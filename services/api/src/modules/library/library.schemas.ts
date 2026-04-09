import { z } from "zod";

export const historyUpsertBodySchema = z.object({
  slugId: z.string().min(12).max(200),
  progressSec: z.coerce.number().int().min(0).max(864_000),
  completed: z.boolean().optional().default(false),
});

export type HistoryUpsertBody = z.infer<typeof historyUpsertBodySchema>;
