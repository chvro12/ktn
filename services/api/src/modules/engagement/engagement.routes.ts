import type { FastifyInstance } from "fastify";
import { handleRouteError } from "../../common/errors.js";
import { requireAuth } from "../../lib/require-auth.js";
import { createCommentForVideo } from "./comment.service.js";
import { createCommentBodySchema } from "./engagement.schemas.js";
import { getVideoLikeStatus, toggleVideoLike } from "./like.service.js";

type SlugParams = { Params: { slugId: string } };

export async function registerEngagementRoutes(app: FastifyInstance) {
  app.get<SlugParams>(
    "/v1/engagement/videos/:slugId/like-status",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await getVideoLikeStatus(userId, request.params.slugId);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post<SlugParams>(
    "/v1/engagement/videos/:slugId/like",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await toggleVideoLike(userId, request.params.slugId);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post<SlugParams>(
    "/v1/engagement/videos/:slugId/comments",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const body = createCommentBodySchema.parse(request.body);
        const result = await createCommentForVideo(
          userId,
          request.params.slugId,
          body,
        );
        void reply.status(201).send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );
}
