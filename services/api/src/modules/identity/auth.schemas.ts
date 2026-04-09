import { UserRole } from "@katante/db";
import { z } from "zod";

const publicRegisterRole = z.nativeEnum(UserRole).refine(
  (r) => r === UserRole.VIEWER || r === UserRole.CREATOR,
  { message: "Rôle d’inscription non autorisé" },
);

export const registerBodySchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(80),
  password: z.string().min(10).max(128),
  role: publicRegisterRole.optional().default(UserRole.VIEWER),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
