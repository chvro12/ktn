import {
  ReportStatus,
  UserRole,
  UserStatus,
  VideoModerationState,
} from "@katante/db";
import { z } from "zod";

export const adminUsersQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
});

const adminPatchableStatus = z.union([
  z.literal(UserStatus.ACTIVE),
  z.literal(UserStatus.SUSPENDED),
]);

export const adminUserPatchSchema = z
  .object({
    role: z.nativeEnum(UserRole).optional(),
    status: adminPatchableStatus.optional(),
  })
  .refine((b) => b.role !== undefined || b.status !== undefined, {
    message: "Au moins un champ (role ou status) est requis",
  });

export const adminReportsQuerySchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
  status: z.nativeEnum(ReportStatus).optional(),
});

export const adminReportPatchSchema = z.object({
  status: z.nativeEnum(ReportStatus),
  notes: z.string().max(2000).optional(),
});

export const adminVideoModerationPatchSchema = z.object({
  moderationState: z.nativeEnum(VideoModerationState),
  notes: z.string().max(2000).optional(),
});
