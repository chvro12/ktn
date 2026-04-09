import {
  ReportStatus,
  UserRole,
  UserStatus,
  VideoModerationState,
} from "@katante/db";
import { AppError } from "../../common/errors.js";
import { prisma } from "../../lib/prisma.js";

export async function getAdminStats() {
  const [
    userCount,
    videoCount,
    channelCount,
    openReportsCount,
    flaggedVideoCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.video.count(),
    prisma.channel.count(),
    prisma.report.count({ where: { status: ReportStatus.OPEN } }),
    prisma.video.count({
      where: { moderationState: { not: VideoModerationState.NONE } },
    }),
  ]);
  return {
    userCount,
    videoCount,
    channelCount,
    openReportsCount,
    flaggedVideoCount,
  };
}

export async function listAdminUsers(cursor: string | undefined, limit: number) {
  const users = await prisma.user.findMany({
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
      email: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
  const hasMore = users.length > limit;
  const items = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore ? items[items.length - 1]!.id : null;
  return { items, nextCursor };
}

export async function adminUpdateUser(
  actorId: string,
  targetId: string,
  patch: { role?: UserRole; status?: UserStatus },
) {
  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    throw new AppError(404, "NOT_FOUND", "Utilisateur introuvable");
  }

  if (targetId === actorId) {
    if (patch.role != null && patch.role !== UserRole.ADMIN) {
      throw new AppError(
        400,
        "INVALID_OPERATION",
        "Tu ne peux pas retirer ton propre rôle administrateur",
      );
    }
    if (
      patch.status === UserStatus.SUSPENDED ||
      patch.status === UserStatus.DELETED
    ) {
      throw new AppError(
        400,
        "INVALID_OPERATION",
        "Tu ne peux pas suspendre ou supprimer ton propre compte",
      );
    }
  }

  if (
    target.role === UserRole.ADMIN &&
    (patch.role === UserRole.VIEWER || patch.role === UserRole.CREATOR)
  ) {
    const otherAdmins = await prisma.user.count({
      where: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        id: { not: targetId },
      },
    });
    if (otherAdmins < 1) {
      throw new AppError(
        400,
        "INVALID_OPERATION",
        "Impossible de retirer le rôle admin au dernier administrateur actif",
      );
    }
  }

  if (target.role === UserRole.ADMIN && patch.status === UserStatus.SUSPENDED) {
    const otherAdmins = await prisma.user.count({
      where: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        id: { not: targetId },
      },
    });
    if (otherAdmins < 1) {
      throw new AppError(
        400,
        "INVALID_OPERATION",
        "Impossible de suspendre le dernier administrateur actif",
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: {
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });
  return updated;
}
