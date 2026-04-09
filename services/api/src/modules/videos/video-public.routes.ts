import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleRouteError } from "../../common/errors.js";
import { listPublicCommentsBySlugId } from "../engagement/comment.service.js";
import {
  getPublishedVideoById,
  getPublishedVideoBySlugId,
  listPublishedVideos,
  searchPublishedVideos,
} from "./video-public.service.js";

const feedQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(48).optional().default(24),
});

const searchQuerySchema = z.object({
  q: z.string().optional().default(""),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(48).optional().default(24),
});

const commentsQuerySchema = z.object({
  cursor: z.string().optional(),
});

export async function registerVideoPublicRoutes(app: FastifyInstance) {
  app.get<{ Params: { id: string } }>(
    "/v1/public/videos/lookup/:id",
    async (request, reply) => {
      try {
        const video = await getPublishedVideoById(request.params.id);
        void reply.send({ slug: video.slug, id: video.id });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get("/v1/public/videos/feed", async (request, reply) => {
    try {
      const q = feedQuerySchema.parse(request.query);
      const result = await listPublishedVideos(q.limit, q.cursor);
      void reply.send(result);
    } catch (err) {
      handleRouteError(reply, err);
    }
  });

  app.get<{ Params: { slugId: string } }>(
    "/v1/public/videos/:slugId/comments",
    async (request, reply) => {
      try {
        const q = commentsQuerySchema.parse(request.query);
        const result = await listPublicCommentsBySlugId(
          request.params.slugId,
          q.cursor,
        );
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get<{ Params: { slugId: string } }>(
    "/v1/public/videos/:slugId",
    async (request, reply) => {
      try {
        const video = await getPublishedVideoBySlugId(request.params.slugId);
        void reply.send({ video });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get("/v1/public/search/videos", async (request, reply) => {
    try {
      const q = searchQuerySchema.parse(request.query);
      const result = await searchPublishedVideos(q.q, q.limit, q.cursor);
      void reply.send(result);
    } catch (err) {
      handleRouteError(reply, err);
    }
  });
}
