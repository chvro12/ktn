import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { handleRouteError } from "../../common/errors.js";
import { optionalAuth } from "../../lib/optional-auth.js";
import { requireAuth } from "../../lib/require-auth.js";
import {
  createPlaylistBodySchema,
  playlistSlugIdBodySchema,
  updatePlaylistBodySchema,
} from "./playlist.schemas.js";
import {
  addPlaylistItem,
  createPlaylist,
  deletePlaylist,
  getPlaylistForViewer,
  listPlaylistsForUser,
  removePlaylistItem,
  updatePlaylist,
} from "./playlist.service.js";

const idParams = z.object({ id: z.string().min(1) });

export async function registerPlaylistRoutes(app: FastifyInstance) {
  app.get(
    "/v1/playlists/me",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const result = await listPlaylistsForUser(userId);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post(
    "/v1/playlists",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const body = createPlaylistBodySchema.parse(request.body);
        const result = await createPlaylist(userId, body);
        void reply.status(201).send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.get(
    "/v1/playlists/:id",
    { preHandler: optionalAuth },
    async (request, reply) => {
      try {
        const { id } = idParams.parse(request.params);
        const viewerId = request.currentUser?.id ?? null;
        const result = await getPlaylistForViewer(id, viewerId);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.patch(
    "/v1/playlists/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = idParams.parse(request.params);
        const body = updatePlaylistBodySchema.parse(request.body);
        const result = await updatePlaylist(userId, id, body);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.delete(
    "/v1/playlists/:id",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = idParams.parse(request.params);
        const result = await deletePlaylist(userId, id);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post(
    "/v1/playlists/:id/items",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = idParams.parse(request.params);
        const body = playlistSlugIdBodySchema.parse(request.body);
        const result = await addPlaylistItem(userId, id, body.slugId);
        void reply.status(result.alreadyExists ? 200 : 201).send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );

  app.post(
    "/v1/playlists/:id/remove-item",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = idParams.parse(request.params);
        const body = playlistSlugIdBodySchema.parse(request.body);
        const result = await removePlaylistItem(userId, id, body.slugId);
        void reply.send(result);
      } catch (err) {
        handleRouteError(reply, err);
      }
    },
  );
}
