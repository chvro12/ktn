import { CommentStatus } from "@katante/db";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../common/errors.js";
import { decodeCursor, encodeTimeIdCursor } from "../../common/cursor.js";
import {
  getPublishedVideoBySlugId,
} from "../videos/video-public.service.js";
import type { CreateCommentBody } from "./engagement.schemas.js";

const REPLIES_PER_THREAD = 12;
const TOP_LEVEL_LIMIT = 40;

const commentAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} as const;

export async function listPublicCommentsBySlugId(
  slugId: string,
  cursor?: string,
) {
  const video = await getPublishedVideoBySlugId(slugId);
  const decoded = cursor ? decodeCursor(cursor) : null;

  const topLevel = await prisma.comment.findMany({
    where: {
      videoId: video.id,
      parentCommentId: null,
      status: CommentStatus.VISIBLE,
      ...(decoded
        ? {
            OR: [
              { createdAt: { lt: new Date(decoded.t) } },
              {
                createdAt: new Date(decoded.t),
                id: { lt: decoded.id },
              },
            ],
          }
        : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: TOP_LEVEL_LIMIT + 1,
    select: {
      id: true,
      body: true,
      createdAt: true,
      likesCount: true,
      user: { select: commentAuthorSelect },
    },
  });

  let nextCursor: string | null = null;
  const page = topLevel.length > TOP_LEVEL_LIMIT ? topLevel.slice(0, TOP_LEVEL_LIMIT) : topLevel;
  if (topLevel.length > TOP_LEVEL_LIMIT) {
    const last = page[page.length - 1];
    if (last) {
      nextCursor = encodeTimeIdCursor(last.createdAt, last.id);
    }
  }

  const parentIds = page.map((c) => c.id);
  type ReplyRow = {
    id: string;
    body: string;
    createdAt: Date;
    likesCount: number;
    parentCommentId: string | null;
    user: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
  const repliesAll: ReplyRow[] =
    parentIds.length === 0
      ? []
      : await prisma.comment.findMany({
          where: {
            videoId: video.id,
            parentCommentId: { in: parentIds },
            status: CommentStatus.VISIBLE,
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            body: true,
            createdAt: true,
            likesCount: true,
            parentCommentId: true,
            user: { select: commentAuthorSelect },
          },
        });

  const repliesByParent = new Map<string, ReplyRow[]>();
  for (const r of repliesAll) {
    if (!r.parentCommentId) continue;
    const list = repliesByParent.get(r.parentCommentId) ?? [];
    list.push(r);
    repliesByParent.set(r.parentCommentId, list);
  }
  for (const [pid, list] of repliesByParent) {
    repliesByParent.set(pid, list.slice(0, REPLIES_PER_THREAD));
  }

  const threads = page.map((c) => ({
    ...c,
    replies: repliesByParent.get(c.id) ?? [],
  }));

  return {
    comments: threads,
    nextCursor,
    videoId: video.id,
    totalTopLevel: page.length,
  };
}

export async function createCommentForVideo(
  userId: string,
  slugId: string,
  input: CreateCommentBody,
) {
  const video = await getPublishedVideoBySlugId(slugId);

  let parentCommentId: string | null = null;
  if (input.parentCommentId) {
    const parent = await prisma.comment.findFirst({
      where: {
        id: input.parentCommentId,
        videoId: video.id,
        status: CommentStatus.VISIBLE,
      },
      select: { id: true, parentCommentId: true },
    });
    if (!parent) {
      throw new AppError(404, "PARENT_NOT_FOUND", "Commentaire parent introuvable");
    }
    if (parent.parentCommentId !== null) {
      throw new AppError(
        400,
        "THREAD_TOO_DEEP",
        "Une seule niveau de réponses pour l’instant",
      );
    }
    parentCommentId = parent.id;
  }

  const comment = await prisma.$transaction(async (tx) => {
    const c = await tx.comment.create({
      data: {
        videoId: video.id,
        userId,
        parentCommentId,
        body: input.body.trim(),
        status: CommentStatus.VISIBLE,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        likesCount: true,
        parentCommentId: true,
        user: { select: commentAuthorSelect },
      },
    });

    await tx.video.update({
      where: { id: video.id },
      data: { commentsCount: { increment: 1 } },
    });

    return c;
  });

  return { comment, videoId: video.id };
}
