import { z } from "zod";

export const createCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(8000),
  parentCommentId: z.string().min(8).max(32).optional(),
});

export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
