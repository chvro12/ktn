import { ReactionTargetType, ReactionType } from "@katante/db";
import { prisma } from "../../lib/prisma.js";
import { getPublishedVideoBySlugId } from "../videos/video-public.service.js";

export async function getVideoLikeStatus(userId: string, slugId: string) {
  const video = await getPublishedVideoBySlugId(slugId);
  const reaction = await prisma.reaction.findUnique({
    where: {
      userId_targetType_targetId_reactionType: {
        userId,
        targetType: ReactionTargetType.VIDEO,
        targetId: video.id,
        reactionType: ReactionType.LIKE,
      },
    },
    select: { id: true },
  });
  return { liked: reaction != null, likesCount: video.likesCount, videoId: video.id };
}

/** Récupère likesCount frais depuis la ligne vidéo. */
async function refreshLikesCount(videoId: string): Promise<number> {
  const v = await prisma.video.findUniqueOrThrow({
    where: { id: videoId },
    select: { likesCount: true },
  });
  return v.likesCount;
}

export async function toggleVideoLike(userId: string, slugId: string) {
  const video = await getPublishedVideoBySlugId(slugId);
  const videoId = video.id;

  const existing = await prisma.reaction.findUnique({
    where: {
      userId_targetType_targetId_reactionType: {
        userId,
        targetType: ReactionTargetType.VIDEO,
        targetId: videoId,
        reactionType: ReactionType.LIKE,
      },
    },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.reaction.delete({ where: { id: existing.id } }),
      prisma.video.update({
        where: { id: videoId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);
    const likesCount = await refreshLikesCount(videoId);
    return { liked: false, likesCount };
  }

  await prisma.$transaction([
    prisma.reaction.create({
      data: {
        userId,
        targetType: ReactionTargetType.VIDEO,
        targetId: videoId,
        reactionType: ReactionType.LIKE,
      },
    }),
    prisma.video.update({
      where: { id: videoId },
      data: { likesCount: { increment: 1 } },
    }),
  ]);
  const likesCount = await refreshLikesCount(videoId);
  return { liked: true, likesCount };
}
