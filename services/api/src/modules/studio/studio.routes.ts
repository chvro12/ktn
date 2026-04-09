import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleRouteError } from "../../common/errors.js";
import { requireAuth } from "../../lib/require-auth.js";
import {
  createStudioVideoBodySchema,
  patchStudioVideoBodySchema,
} from "./studio.schemas.js";
import {
  createStudioVideo,
  getStudioVideoDetail,
  listStudioVideos,
  patchStudioVideo,
  publishStudioVideo,
  uploadStudioSource,
} from "./studio.service.js";

const idParams = z.object({ id: z.string().min(1) });

export async function registerStudioRoutes(app: FastifyInstance) {
  app.get(
    "/v1/studio/videos",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await listStudioVideos(userId);
        void reply.send({
          channelId: result.channelId,
          videos: result.videos.map((v) => ({
            ...v,
            updatedAt: v.updatedAt.toISOString(),
            publishedAt: v.publishedAt?.toISOString() ?? null,
          })),
        });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post(
    "/v1/studio/videos",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const body = createStudioVideoBodySchema.parse(request.body);
        const result = await createStudioVideo(userId, body);
        void reply.status(201).send({
          video: {
            ...result.video,
            updatedAt: result.video.updatedAt.toISOString(),
            publishedAt: result.video.publishedAt?.toISOString() ?? null,
          },
        });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get(
    "/v1/studio/videos/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = idParams.parse(request.params);
        const result = await getStudioVideoDetail(userId, id);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.patch(
    "/v1/studio/videos/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = idParams.parse(request.params);
        const body = patchStudioVideoBodySchema.parse(request.body);
        const result = await patchStudioVideo(userId, id, body);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post(
    "/v1/studio/videos/:id/publish",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = idParams.parse(request.params);
        const result = await publishStudioVideo(userId, id);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post(
    "/v1/studio/videos/:id/upload",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = idParams.parse(request.params);
        const file = await request.file();
        if (!file) {
          void reply.status(400).send({
            error: { code: "NO_FILE", message: "Fichier manquant (champ file)" },
          });
          return;
        }
        const result = await uploadStudioSource(userId, id, file);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );
}
