import { UserRole } from "@katante/db";
import type { FastifyReply, FastifyRequest } from "fastify";
import { SESSION_COOKIE } from "../modules/identity/auth.constants.js";
import { getUserFromSession } from "../modules/identity/auth.service.js";

/** Session valide + rôle ADMIN. Renseigne `request.currentUser`. */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const raw = request.cookies[SESSION_COOKIE];
  const user = await getUserFromSession(raw);
  if (!user) {
    void reply.status(401).send({
      error: { code: "UNAUTHORIZED", message: "Non connecté" },
    });
    return;
  }
  if (user.role !== UserRole.ADMIN) {
    void reply.status(403).send({
      error: { code: "FORBIDDEN", message: "Accès administrateur requis" },
    });
    return;
  }
  request.currentUser = user;
}
