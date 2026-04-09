import {
  VideoModerationState,
  VideoProcessingStatus,
  VideoVisibility,
  type Prisma,
} from "@katante/db";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../common/errors.js";
import { decodeCursor, encodeCursor } from "../../common/cursor.js";

export const publishedWhere: Prisma.VideoWhereInput = {
  visibility: VideoVisibility.PUBLIC,
  processingStatus: VideoProcessingStatus.READY,
  moderationState: { not: VideoModerationState.BLOCKED },
  publishedAt: { not: null },
};

/** Appelée avant listes publiques et depuis le studio pour aligner `publishedAt` avec le fil d’accueil. */
export async function repairEligiblePublishedVideos() {
  await prisma.video.updateMany({
    where: {
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

const channelPublicSelect = {
  handle: true,
  name: true,
  avatarUrl: true,
} satisfies Prisma.ChannelSelect;

export const videoCardSelect = {
  id: true,
  slug: true,
  title: true,
  thumbnailUrl: true,
  durationSec: true,
  publishedAt: true,
  viewsCount: true,
  channel: { select: channelPublicSelect },
} satisfies Prisma.VideoSelect;

export async function listPublishedVideos(limit: number, cursor?: string) {
  await repairEligiblePublishedVideos();
  const take = Math.min(Math.max(limit, 1), 48);
  const decoded = cursor ? decodeCursor(cursor) : null;

  const items = await prisma.video.findMany({
    where: {
      ...publishedWhere,
      ...(decoded
        ? {
            OR: [
              {
                publishedAt: { lt: new Date(decoded.t) },
              },
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

export function parseVideoSlugId(param: string): { slug: string; id: string } {
  const lastDash = param.lastIndexOf("-");
  if (lastDash <= 0) {
    throw new AppError(400, "INVALID_VIDEO_URL", "URL vidéo invalide");
  }
  const slug = param.slice(0, lastDash);
  const id = param.slice(lastDash + 1);
  if (!slug || id.length < 8) {
    throw new AppError(400, "INVALID_VIDEO_URL", "URL vidéo invalide");
  }
  return { slug, id };
}

export async function getPublishedVideoById(id: string) {
  await repairEligiblePublishedVideos();
  const video = await prisma.video.findFirst({
    where: {
      id,
      ...publishedWhere,
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });
  if (!video) {
    throw new AppError(404, "VIDEO_NOT_FOUND", "Vidéo introuvable");
  }
  return video;
}

export async function getPublishedVideoBySlugId(param: string) {
  await repairEligiblePublishedVideos();
  const { slug, id } = parseVideoSlugId(param);
  const video = await prisma.video.findFirst({
    where: {
      id,
      slug,
      ...publishedWhere,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      durationSec: true,
      publishedAt: true,
      viewsCount: true,
      likesCount: true,
      hlsUrl: true,
      language: true,
      channel: {
        select: {
          id: true,
          handle: true,
          name: true,
          avatarUrl: true,
          subscriberCount: true,
          verified: true,
        },
      },
    },
  });
  if (!video) {
    throw new AppError(404, "VIDEO_NOT_FOUND", "Vidéo introuvable");
  }
  return video;
}

export async function searchPublishedVideos(
  query: string,
  limit: number,
  cursor?: string,
) {
  await repairEligiblePublishedVideos();
  const q = query.trim();
  if (q.length < 2) {
    throw new AppError(400, "QUERY_TOO_SHORT", "Requête trop courte (min. 2 caractères)");
  }
  const take = Math.min(Math.max(limit, 1), 48);
  const decoded = cursor ? decodeCursor(cursor) : null;

  const items = await prisma.video.findMany({
    where: {
      ...publishedWhere,
      title: { contains: q, mode: "insensitive" },
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
