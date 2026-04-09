import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleRouteError } from "../../common/errors.js";
import {
  getPublicChannelByHandle,
  listChannelVideos,
} from "./channel-public.service.js";

const channelVideosQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(48).optional().default(24),
});

export async function registerChannelPublicRoutes(app: FastifyInstance) {
  app.get<{ Params: { handle: string } }>(
    "/v1/public/channels/:handle",
    async (request, reply) => {
      try {
        const channel = await getPublicChannelByHandle(request.params.handle);
        const { ownerUserId: _owner, ...publicChannel } = channel;
        void reply.send({ channel: publicChannel });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get<{ Params: { handle: string } }>(
    "/v1/public/channels/:handle/videos",
    async (request, reply) => {
      try {
        const q = channelVideosQuerySchema.parse(request.query);
        const channel = await getPublicChannelByHandle(request.params.handle);
        const videos = await listChannelVideos(channel.id, q.limit, q.cursor);
        const { ownerUserId: _owner, ...publicChannel } = channel;
        void reply.send({ channel: publicChannel, videos });
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );
}
