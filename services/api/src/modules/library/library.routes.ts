import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleRouteError } from "../../common/errors.js";
import { requireAuth } from "../../lib/require-auth.js";
import { historyUpsertBodySchema } from "./library.schemas.js";
import {
  addWatchLater,
  getVideoLibraryState,
  listWatchLater,
  listWatchHistory,
  removeWatchLater,
  upsertWatchHistory,
} from "./library.service.js";

const libraryListQuerySchema = z.object({
  cursor: z.string().optional(),
});

type SlugParams = { Params: { slugId: string } };

export async function registerLibraryRoutes(app: FastifyInstance) {
  app.get(
    "/v1/library/watch-later",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const q = libraryListQuerySchema.parse(request.query);
        const result = await listWatchLater(userId, q.cursor);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get(
    "/v1/library/history",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const q = libraryListQuerySchema.parse(request.query);
        const result = await listWatchHistory(userId, q.cursor);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get<SlugParams>(
    "/v1/library/video-state/:slugId",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await getVideoLibraryState(
          userId,
          request.params.slugId,
        );
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post<SlugParams>(
    "/v1/library/watch-later/:slugId",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await addWatchLater(userId, request.params.slugId);
        void reply.status(201).send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.delete<SlugParams>(
    "/v1/library/watch-later/:slugId",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await removeWatchLater(userId, request.params.slugId);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post(
    "/v1/library/history",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const body = historyUpsertBodySchema.parse(request.body);
        const result = await upsertWatchHistory(
          userId,
          body.slugId,
          body.progressSec,
          body.completed,
        );
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );
}
