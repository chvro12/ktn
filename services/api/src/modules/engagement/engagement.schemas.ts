import { ReportTargetType } from "@katante/db";
import { z } from "zod";

export const createReportBodySchema = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().cuid(),
  reason: z.string().trim().min(3).max(500),
  details: z.string().trim().max(4000).optional(),
});

export const createCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(8000),
  parentCommentId: z.string().min(8).max(32).optional(),
});

export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
