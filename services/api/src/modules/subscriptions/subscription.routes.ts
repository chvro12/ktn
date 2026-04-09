import type { FastifyInstance } from "fastify";
import { handleRouteError } from "../../common/errors.js";
import { requireAuth } from "../../lib/require-auth.js";
import {
  getSubscriptionStatus,
  subscribeToChannel,
  unsubscribeFromChannel,
} from "./subscription.service.js";

type HandleParams = { Params: { handle: string } };

export async function registerSubscriptionRoutes(app: FastifyInstance) {
  app.get<HandleParams>(
    "/v1/engagement/channels/:handle/subscription-status",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await getSubscriptionStatus(userId, request.params.handle);
        void reply.send({
          subscribed: result.subscribed,
          subscriberCount: result.subscriberCount,
        });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post<HandleParams>(
    "/v1/engagement/channels/:handle/subscribe",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await subscribeToChannel(userId, request.params.handle);
        void reply.status(201).send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.delete<HandleParams>(
    "/v1/engagement/channels/:handle/subscribe",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await unsubscribeFromChannel(userId, request.params.handle);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );
}
