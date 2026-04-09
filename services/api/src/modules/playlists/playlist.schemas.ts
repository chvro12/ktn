import { PlaylistPrivacy } from "@katante/db";
import { z } from "zod";

export const createPlaylistBodySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(8_000).optional(),
  privacy: z.nativeEnum(PlaylistPrivacy).optional(),
});

export const updatePlaylistBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(8_000).optional(),
  privacy: z.nativeEnum(PlaylistPrivacy).optional(),
});

export const playlistSlugIdBodySchema = z.object({
  slugId: z.string().min(4),
});
