import type { FastifyReply, FastifyRequest } from "fastify";
import { SESSION_COOKIE } from "../modules/identity/auth.constants.js";
import { getUserFromSession } from "../modules/identity/auth.service.js";

/** Renseigne `request.currentUser` si cookie de session valide ; sinon ne fait rien (pas de 401). */
export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const raw = request.cookies[SESSION_COOKIE];
  const user = await getUserFromSession(raw);
  if (user) {
    request.currentUser = user;
  }
}
