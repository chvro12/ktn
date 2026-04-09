import { ReportTargetType } from "@katante/db";
import { AppError } from "../../common/errors.js";
import { prisma } from "../../lib/prisma.js";

async function assertReportTargetExists(
  targetType: ReportTargetType,
  targetId: string,
): Promise<void> {
  switch (targetType) {
    case ReportTargetType.VIDEO: {
      const row = await prisma.video.findUnique({ where: { id: targetId } });
      if (!row) {
        throw new AppError(404, "NOT_FOUND", "Vidéo introuvable");
      }
      return;
    }
    case ReportTargetType.COMMENT: {
      const row = await prisma.comment.findUnique({ where: { id: targetId } });
      if (!row) {
        throw new AppError(404, "NOT_FOUND", "Commentaire introuvable");
      }
      return;
    }
    case ReportTargetType.CHANNEL: {
      const row = await prisma.channel.findUnique({ where: { id: targetId } });
      if (!row) {
        throw new AppError(404, "NOT_FOUND", "Chaîne introuvable");
      }
      return;
    }
    case ReportTargetType.USER: {
      const row = await prisma.user.findUnique({ where: { id: targetId } });
      if (!row) {
        throw new AppError(404, "NOT_FOUND", "Utilisateur introuvable");
      }
      return;
    }
  }
}

export async function createUserReport(
  reporterUserId: string,
  input: {
    targetType: ReportTargetType;
    targetId: string;
    reason: string;
    details?: string;
  },
) {
  if (
    input.targetType === ReportTargetType.USER &&
    input.targetId === reporterUserId
  ) {
    throw new AppError(
      400,
      "INVALID_OPERATION",
      "Tu ne peux pas te signaler toi-même",
    );
  }

  await assertReportTargetExists(input.targetType, input.targetId);

  const detailsTrimmed = input.details?.trim();
  const report = await prisma.report.create({
    data: {
      reporterUserId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim(),
      details: detailsTrimmed ? detailsTrimmed : null,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  return report;
}
