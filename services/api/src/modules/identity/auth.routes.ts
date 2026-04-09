import type { FastifyInstance } from "fastify";
import { handleRouteError } from "../../common/errors.js";
import {
  loginBodySchema,
  registerBodySchema,
} from "./auth.schemas.js";
import { SESSION_COOKIE } from "./auth.constants.js";
import {
  clearSession,
  createSessionForUser,
  getUserFromSession,
  loginUser,
  registerUser,
} from "./auth.service.js";

export async function registerIdentityRoutes(app: FastifyInstance) {
  app.post("/v1/auth/register", async (request, reply) => {
    try {
      const body = registerBodySchema.parse(request.body);
      const user = await registerUser(body);
      await createSessionForUser(reply, user.id);
      void reply.status(201).send({ user });
    } catch (err) {
      handleRouteError(reply, err);
    }
  });

  app.post("/v1/auth/login", async (request, reply) => {
    try {
      const body = loginBodySchema.parse(request.body);
      const user = await loginUser(body);
      await createSessionForUser(reply, user.id);
      void reply.send({ user });
    } catch (err) {
      handleRouteError(reply, err);
    }
  });

  app.post("/v1/auth/logout", async (request, reply) => {
    try {
      const raw = request.cookies[SESSION_COOKIE];
      await clearSession(reply, raw);
      void reply.send({ ok: true });
    } catch (err) {
      handleRouteError(reply, err);
    }
  });

  app.get("/v1/auth/me", async (request, reply) => {
    try {
      const raw = request.cookies[SESSION_COOKIE];
      const user = await getUserFromSession(raw);
      if (!user) {
        void reply.status(401).send({
          error: { code: "UNAUTHORIZED", message: "Non connecté" },
        });
        return;
      }
      void reply.send({ user });
    } catch (err) {
      handleRouteError(reply, err);
    }
  });
}
