import {
  ModerationTargetType,
  ReportStatus,
  ReportTargetType,
  VideoModerationState,
} from "@katante/db";
import { AppError } from "../../common/errors.js";
import { prisma } from "../../lib/prisma.js";

function reportTargetToModeration(t: ReportTargetType): ModerationTargetType {
  const map: Record<ReportTargetType, ModerationTargetType> = {
    [ReportTargetType.VIDEO]: ModerationTargetType.VIDEO,
    [ReportTargetType.COMMENT]: ModerationTargetType.COMMENT,
    [ReportTargetType.CHANNEL]: ModerationTargetType.CHANNEL,
    [ReportTargetType.USER]: ModerationTargetType.USER,
  };
  return map[t];
}

async function enrichReportsForList(
  reports: Array<{
    id: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    details: string | null;
    status: ReportStatus;
    createdAt: Date;
    reporter: {
      id: string;
      displayName: string;
      email: string;
    };
  }>,
) {
  const videoIds = reports
    .filter((r) => r.targetType === ReportTargetType.VIDEO)
    .map((r) => r.targetId);
  const channelIds = reports
    .filter((r) => r.targetType === ReportTargetType.CHANNEL)
    .map((r) => r.targetId);
  const userIds = reports
    .filter((r) => r.targetType === ReportTargetType.USER)
    .map((r) => r.targetId);
  const commentIds = reports
    .filter((r) => r.targetType === ReportTargetType.COMMENT)
    .map((r) => r.targetId);

  const [videos, channels, users, comments] = await Promise.all([
    videoIds.length
      ? prisma.video.findMany({
          where: { id: { in: videoIds } },
          select: { id: true, title: true, slug: true },
        })
      : [],
    channelIds.length
      ? prisma.channel.findMany({
          where: { id: { in: channelIds } },
          select: { id: true, name: true, handle: true },
        })
      : [],
    userIds.length
      ? prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, displayName: true, username: true },
        })
      : [],
    commentIds.length
      ? prisma.comment.findMany({
          where: { id: { in: commentIds } },
          select: {
            id: true,
            body: true,
            video: { select: { id: true, slug: true } },
          },
        })
      : [],
  ]);

  const videoMap = new Map(videos.map((v) => [v.id, v]));
  const channelMap = new Map(channels.map((c) => [c.id, c]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const commentMap = new Map(comments.map((c) => [c.id, c]));

  return reports.map((r) => {
    let targetLabel = `${r.targetType} · ${r.targetId.slice(0, 8)}…`;
    let targetPath: string | null = null;

    if (r.targetType === ReportTargetType.VIDEO) {
      const v = videoMap.get(r.targetId);
      if (v) {
        targetLabel = v.title;
        targetPath = `/video/${v.slug}-${v.id}`;
      }
    } else if (r.targetType === ReportTargetType.CHANNEL) {
      const c = channelMap.get(r.targetId);
      if (c) {
        targetLabel = `@${c.handle} — ${c.name}`;
        targetPath = `/channel/${c.handle}`;
      }
    } else if (r.targetType === ReportTargetType.USER) {
      const u = userMap.get(r.targetId);
      if (u) {
        targetLabel = `${u.displayName} (@${u.username})`;
        targetPath = null;
      }
    } else if (r.targetType === ReportTargetType.COMMENT) {
      const c = commentMap.get(r.targetId);
      if (c) {
        const excerpt =
          c.body.length > 80 ? `${c.body.slice(0, 80)}…` : c.body;
        targetLabel = `Commentaire : ${excerpt}`;
        targetPath = `/video/${c.video.slug}-${c.video.id}`;
      }
    }

    return {
      ...r,
      targetLabel,
      targetPath,
    };
  });
}

export async function listAdminReports(
  cursor: string | undefined,
  limit: number,
  statusFilter: ReportStatus | undefined,
) {
  const items = await prisma.report.findMany({
    take: limit + 1,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    where: statusFilter ? { status: statusFilter } : undefined,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      reporter: {
        select: {
          id: true,
          displayName: true,
          email: true,
        },
      },
    },
  });
  const hasMore = items.length > limit;
  const slice = hasMore ? items.slice(0, limit) : items;
  const enriched = await enrichReportsForList(slice);
  const nextCursor = hasMore ? slice[slice.length - 1]!.id : null;
  return { items: enriched, nextCursor };
}

export async function patchAdminReport(
  adminUserId: string,
  reportId: string,
  status: ReportStatus,
  notes?: string,
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) {
    throw new AppError(404, "NOT_FOUND", "Signalement introuvable");
  }

  const noteLine =
    notes?.trim() ||
    `Statut → ${status} (signalement ${reportId.slice(0, 8)}…)`;

  await prisma.$transaction([
    prisma.report.update({
      where: { id: reportId },
      data: { status },
    }),
    prisma.moderationAction.create({
      data: {
        adminUserId,
        targetType: reportTargetToModeration(report.targetType),
        targetId: report.targetId,
        actionType: `REPORT_${status}`,
        notes: noteLine,
      },
    }),
  ]);

  const updated = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      reporter: {
        select: { id: true, displayName: true, email: true },
      },
    },
  });
  if (!updated) throw new AppError(500, "INTERNAL_ERROR", "Mise à jour invalide");
  const [enriched] = await enrichReportsForList([updated]);
  return enriched;
}

export async function listAdminVideosModeration(
  cursor: string | undefined,
  limit: number,
) {
  const items = await prisma.video.findMany({
    take: limit + 1,
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    select: {
      id: true,
      slug: true,
      title: true,
      moderationState: true,
      processingStatus: true,
      visibility: true,
      publishedAt: true,
      updatedAt: true,
      channel: { select: { handle: true, name: true } },
    },
  });
  const hasMore = items.length > limit;
  const slice = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? slice[slice.length - 1]!.id : null;
  return {
    items: slice.map((v) => ({
      ...v,
      watchPath: `/video/${v.slug}-${v.id}`,
    })),
    nextCursor,
  };
}

export async function patchAdminVideoModeration(
  adminUserId: string,
  videoId: string,
  moderationState: VideoModerationState,
  notes?: string,
) {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) {
    throw new AppError(404, "NOT_FOUND", "Vidéo introuvable");
  }

  const noteLine =
    notes?.trim() ||
    `Modération → ${moderationState} (vidéo ${video.slug})`;

  await prisma.$transaction([
    prisma.video.update({
      where: { id: videoId },
      data: { moderationState },
    }),
    prisma.moderationAction.create({
      data: {
        adminUserId,
        targetType: ModerationTargetType.VIDEO,
        targetId: videoId,
        actionType: `VIDEO_MODERATION_${moderationState}`,
        notes: noteLine,
      },
    }),
  ]);

  const updated = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      id: true,
      slug: true,
      title: true,
      moderationState: true,
      processingStatus: true,
      visibility: true,
      publishedAt: true,
      updatedAt: true,
      channel: { select: { handle: true, name: true } },
    },
  });
  if (!updated) throw new AppError(500, "INTERNAL_ERROR", "Mise à jour invalide");
  return {
    ...updated,
    watchPath: `/video/${updated.slug}-${updated.id}`,
  };
}

export async function listModerationActions(
  cursor: string | undefined,
  limit: number,
) {
  const items = await prisma.moderationAction.findMany({
    take: limit + 1,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
    select: {
      id: true,
      targetType: true,
      targetId: true,
      actionType: true,
      notes: true,
      createdAt: true,
      admin: { select: { id: true, displayName: true, email: true } },
    },
  });
  const hasMore = items.length > limit;
  const slice = hasMore ? items.slice(0, limit) : items;
  const nextCursor = hasMore ? slice[slice.length - 1]!.id : null;
  return { items: slice, nextCursor };
}
