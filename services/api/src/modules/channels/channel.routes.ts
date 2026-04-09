import type { FastifyInstance } from "fastify";
import { handleRouteError } from "../../common/errors.js";
import { requireAuth } from "../../lib/require-auth.js";
import { createChannelBodySchema } from "./channel.schemas.js";
import { createChannel, getChannelForOwner } from "./channel.service.js";

export async function registerChannelRoutes(app: FastifyInstance) {
  app.get(
    "/v1/channels/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const channel = await getChannelForOwner(userId);
        if (!channel) {
          void reply.status(404).send({
            error: { code: "NO_CHANNEL", message: "Aucune chaîne pour ce compte" },
          });
          return;
        }
        void reply.send({ channel });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post(
    "/v1/channels",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const body = createChannelBodySchema.parse(request.body);
        const channel = await createChannel(userId, body);
        void reply.status(201).send({ channel });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );
}
