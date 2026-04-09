import { prisma } from "../../lib/prisma.js";
import { decodeCursor, encodeTimeIdCursor } from "../../common/cursor.js";
import {
  getPublishedVideoBySlugId,
  videoCardSelect,
  publishedWhere,
} from "../videos/video-public.service.js";

const PAGE = 24;

export async function getVideoLibraryState(userId: string, slugId: string) {
  const video = await getPublishedVideoBySlugId(slugId);
  const [watchLaterRow, historyRow] = await Promise.all([
    prisma.watchLater.findUnique({
      where: {
        userId_videoId: { userId, videoId: video.id },
      },
      select: { userId: true },
    }),
    prisma.watchHistory.findUnique({
      where: {
        userId_videoId: { userId, videoId: video.id },
      },
      select: { progressSec: true, completed: true },
    }),
  ]);
  return {
    inWatchLater: watchLaterRow != null,
    videoId: video.id,
    progressSec: historyRow?.progressSec ?? 0,
    completed: historyRow?.completed ?? false,
  };
}

export async function addWatchLater(userId: string, slugId: string) {
  const video = await getPublishedVideoBySlugId(slugId);
  try {
    await prisma.watchLater.create({
      data: { userId, videoId: video.id },
    });
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as { code?: string }).code
        : undefined;
    if (code === "P2002") {
      return { inWatchLater: true, videoId: video.id };
    }
    throw e;
  }
  return { inWatchLater: true, videoId: video.id };
}

export async function removeWatchLater(userId: string, slugId: string) {
  const video = await getPublishedVideoBySlugId(slugId);
  await prisma.watchLater.deleteMany({
    where: { userId, videoId: video.id },
  });
  return { inWatchLater: false, videoId: video.id };
}

export async function listWatchLater(userId: string, cursor?: string) {
  const decoded = cursor ? decodeCursor(cursor) : null;
  const take = PAGE + 1;

  const rows = await prisma.watchLater.findMany({
    where: {
      userId,
      video: publishedWhere,
      ...(decoded
        ? {
            OR: [
              { createdAt: { lt: new Date(decoded.t) } },
              {
                createdAt: new Date(decoded.t),
                videoId: { lt: decoded.id },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { videoId: "desc" }],
    take,
    select: {
      createdAt: true,
      videoId: true,
      video: { select: videoCardSelect },
    },
  });

  let nextCursor: string | null = null;
  const page = rows.length > PAGE ? rows.slice(0, PAGE) : rows;
  if (rows.length > PAGE) {
    const last = page[page.length - 1];
    if (last) {
      nextCursor = encodeTimeIdCursor(last.createdAt, last.videoId);
    }
  }

  return {
    items: page.map((r) => r.video),
    nextCursor,
  };
}

export async function upsertWatchHistory(
  userId: string,
  slugId: string,
  progressSec: number,
  completed: boolean,
) {
  const video = await getPublishedVideoBySlugId(slugId);
  await prisma.watchHistory.upsert({
    where: {
      userId_videoId: { userId, videoId: video.id },
    },
    create: {
      userId,
      videoId: video.id,
      progressSec,
      completed,
      watchedAt: new Date(),
    },
    update: {
      progressSec,
      completed,
      watchedAt: new Date(),
    },
  });
  return { ok: true as const, videoId: video.id };
}

export async function listWatchHistory(userId: string, cursor?: string) {
  const decoded = cursor ? decodeCursor(cursor) : null;
  const take = PAGE + 1;

  const rows = await prisma.watchHistory.findMany({
    where: {
      userId,
      video: publishedWhere,
      ...(decoded
        ? {
            OR: [
              { watchedAt: { lt: new Date(decoded.t) } },
              {
                watchedAt: new Date(decoded.t),
                id: { lt: decoded.id },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ watchedAt: "desc" }, { id: "desc" }],
    take,
    select: {
      id: true,
      watchedAt: true,
      video: { select: videoCardSelect },
    },
  });

  let nextCursor: string | null = null;
  const page = rows.length > PAGE ? rows.slice(0, PAGE) : rows;
  if (rows.length > PAGE) {
    const last = page[page.length - 1];
    if (last) {
      nextCursor = encodeTimeIdCursor(last.watchedAt, last.id);
    }
  }

  return {
    items: page.map((r) => r.video),
    nextCursor,
  };
}
