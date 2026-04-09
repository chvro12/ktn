import { z } from "zod";

export const createChannelBodySchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9][a-z0-9_-]*$/, {
      message:
        "Handle : lettres minuscules, chiffres, _ ou - (doit commencer par alphanum)",
    }),
  name: z.string().min(1).max(100),
  description: z.string().max(5000).optional().default(""),
});

export type CreateChannelBody = z.infer<typeof createChannelBodySchema>;
