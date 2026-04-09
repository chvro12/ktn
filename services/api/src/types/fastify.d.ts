import type { UserRole, UserStatus } from "@katante/db";

declare module "fastify" {
  interface FastifyRequest {
    /** Renseigné par le preHandler `requireAuth`. */
    currentUser?: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      avatarUrl: string | null;
      role: UserRole;
      status: UserStatus;
      createdAt: Date;
    };
  }
}
