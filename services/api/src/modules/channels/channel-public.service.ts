import {
  VideoModerationState,
  VideoProcessingStatus,
  VideoVisibility,
  type Prisma,
} from "@katante/db";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../common/errors.js";
import { decodeCursor, encodeCursor } from "../../common/cursor.js";

const publishedWhere: Prisma.VideoWhereInput = {
  visibility: VideoVisibility.PUBLIC,
  processingStatus: VideoProcessingStatus.READY,
  moderationState: { not: VideoModerationState.BLOCKED },
  publishedAt: { not: null },
};

async function repairEligiblePublishedVideosForChannel(channelId: string) {
  await prisma.video.updateMany({
    where: {
      channelId,
      visibility: VideoVisibility.PUBLIC,
      processingStatus: VideoProcessingStatus.READY,
      moderationState: { not: VideoModerationState.BLOCKED },
      publishedAt: null,
    },
    data: {
      publishedAt: new Date(),
    },
  });
}

const videoCardSelect = {
  id: true,
  slug: true,
  title: true,
  thumbnailUrl: true,
  durationSec: true,
  publishedAt: true,
  viewsCount: true,
} satisfies Prisma.VideoSelect;

export async function getPublicChannelByHandle(handleRaw: string) {
  const handle = handleRaw.trim().toLowerCase();
  const channel = await prisma.channel.findUnique({
    where: { handle },
    select: {
      id: true,
      ownerUserId: true,
      handle: true,
      name: true,
      description: true,
      avatarUrl: true,
      bannerUrl: true,
      verified: true,
      subscriberCount: true,
      createdAt: true,
    },
  });
  if (!channel) {
    throw new AppError(404, "CHANNEL_NOT_FOUND", "Chaîne introuvable");
  }
  return channel;
}

export async function listChannelVideos(
  channelId: string,
  limit: number,
  cursor?: string,
) {
  await repairEligiblePublishedVideosForChannel(channelId);
  const take = Math.min(Math.max(limit, 1), 48);
  const decoded = cursor ? decodeCursor(cursor) : null;

  const items = await prisma.video.findMany({
    where: {
      channelId,
      ...publishedWhere,
      ...(decoded
        ? {
            OR: [
              { publishedAt: { lt: new Date(decoded.t) } },
              {
                publishedAt: new Date(decoded.t),
                id: { lt: decoded.id },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
    take: take + 1,
    select: videoCardSelect,
  });

  let nextCursor: string | null = null;
  if (items.length > take) {
    items.pop();
    const last = items[items.length - 1];
    if (last?.publishedAt) {
      nextCursor = encodeCursor({ publishedAt: last.publishedAt, id: last.id });
    }
  }

  return { items, nextCursor };
}
