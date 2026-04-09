import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const registerFormSchema = z.object({
  email: z.string().email("Email invalide"),
  username: z
    .string()
    .min(3, "Au moins 3 caractères")
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et _ uniquement"),
  displayName: z.string().min(1, "Nom affiché requis").max(80),
  password: z.string().min(10, "Au moins 10 caractères").max(128),
  isCreator: z.boolean(),
});

export const channelOnboardingSchema = z.object({
  handle: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9][a-z0-9_-]*$/, {
      message:
        "minuscules, chiffres, _ ou - (commence par une lettre ou un chiffre)",
    }),
  name: z.string().min(1, "Nom de chaîne requis").max(100),
  description: z.string().max(5000),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ChannelOnboardingValues = z.infer<typeof channelOnboardingSchema>;
