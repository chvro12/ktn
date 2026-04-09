import { VideoVisibility } from "@katante/db";
import { z } from "zod";

export const createStudioVideoBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(8_000).optional(),
  visibility: z.nativeEnum(VideoVisibility).optional(),
});

export const patchStudioVideoBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(8_000).optional(),
  visibility: z.nativeEnum(VideoVisibility).optional(),
});

export type CreateStudioVideoBody = z.infer<typeof createStudioVideoBodySchema>;
export type PatchStudioVideoBody = z.infer<typeof patchStudioVideoBodySchema>;
