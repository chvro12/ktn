import type { FastifyReply, FastifyRequest } from "fastify";
import { SESSION_COOKIE } from "../modules/identity/auth.constants.js";
import { getUserFromSession } from "../modules/identity/auth.service.js";

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const raw = request.cookies[SESSION_COOKIE];
  const user = await getUserFromSession(raw);
  if (!user) {
    return reply.status(401).send({
      error: { code: "UNAUTHORIZED", message: "Non connecté" },
    });
  }
  request.currentUser = user;
}
