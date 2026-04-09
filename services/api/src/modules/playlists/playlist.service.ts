import { PlaylistPrivacy, type Prisma } from "@katante/db";
import { AppError } from "../../common/errors.js";
import { prisma } from "../../lib/prisma.js";
import {
  getPublishedVideoBySlugId,
  videoCardSelect,
} from "../videos/video-public.service.js";

function slugifyTitle(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base.length > 0 ? base : "playlist";
}

async function uniqueSlugForUser(userId: string, base: string): Promise<string> {
  let slug = base;
  let n = 2;
  for (;;) {
    const exists = await prisma.playlist.findUnique({
      where: { ownerUserId_slug: { ownerUserId: userId, slug } },
    });
    if (!exists) return slug;
    slug = `${base}-${n++}`;
  }
}

const playlistSummarySelect = {
  id: true,
  slug: true,
  title: true,
  privacy: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { items: true } },
} satisfies Prisma.PlaylistSelect;

export async function listPlaylistsForUser(userId: string) {
  const rows = await prisma.playlist.findMany({
    where: { ownerUserId: userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: playlistSummarySelect,
  });
  return {
    playlists: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      privacy: r.privacy,
      itemCount: r._count.items,
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
}

export async function createPlaylist(
  userId: string,
  data: {
    title: string;
    description?: string;
    privacy?: PlaylistPrivacy;
  },
) {
  const base = slugifyTitle(data.title);
  const slug = await uniqueSlugForUser(userId, base);
  const p = await prisma.playlist.create({
    data: {
      ownerUserId: userId,
      slug,
      title: data.title.trim(),
      description: data.description?.trim() ?? "",
      privacy: data.privacy ?? PlaylistPrivacy.PRIVATE,
    },
    select: playlistSummarySelect,
  });
  return {
    playlist: {
      id: p.id,
      slug: p.slug,
      title: p.title,
      privacy: p.privacy,
      itemCount: p._count.items,
      updatedAt: p.updatedAt.toISOString(),
    },
  };
}

async function loadPlaylistBundle(id: string) {
  return prisma.playlist.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, username: true, displayName: true } },
      items: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          video: { select: videoCardSelect },
        },
      },
    },
  });
}

export async function getPlaylistForViewer(
  playlistId: string,
  viewerUserId: string | null,
) {
  const p = await loadPlaylistBundle(playlistId);
  if (!p) {
    throw new AppError(404, "PLAYLIST_NOT_FOUND", "Playlist introuvable");
  }

  if (p.privacy === PlaylistPrivacy.PRIVATE) {
    if (!viewerUserId || viewerUserId !== p.ownerUserId) {
      throw new AppError(404, "PLAYLIST_NOT_FOUND", "Playlist introuvable");
    }
  }

  const isOwner = viewerUserId === p.ownerUserId;

  return {
    playlist: {
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      privacy: p.privacy,
      isOwner,
      owner: {
        username: p.owner.username,
        displayName: p.owner.displayName,
      },
      updatedAt: p.updatedAt.toISOString(),
    },
    items: p.items.map((i) => i.video),
  };
}

export async function updatePlaylist(
  userId: string,
  playlistId: string,
  patch: {
    title?: string;
    description?: string;
    privacy?: PlaylistPrivacy;
  },
) {
  const existing = await prisma.playlist.findFirst({
    where: { id: playlistId, ownerUserId: userId },
  });
  if (!existing) {
    throw new AppError(404, "PLAYLIST_NOT_FOUND", "Playlist introuvable");
  }

  const data: Prisma.PlaylistUpdateInput = {};
  if (patch.description !== undefined) {
    data.description = patch.description.trim();
  }
  if (patch.privacy !== undefined) {
    data.privacy = patch.privacy;
  }
  if (patch.title !== undefined) {
    const t = patch.title.trim();
    if (t.length < 1) {
      throw new AppError(400, "INVALID_TITLE", "Titre invalide");
    }
    data.title = t;
  }

  if (Object.keys(data).length === 0) {
    return { ok: true as const };
  }

  await prisma.playlist.update({
    where: { id: playlistId },
    data,
  });
  return { ok: true as const };
}

export async function deletePlaylist(userId: string, playlistId: string) {
  const r = await prisma.playlist.deleteMany({
    where: { id: playlistId, ownerUserId: userId },
  });
  if (r.count === 0) {
    throw new AppError(404, "PLAYLIST_NOT_FOUND", "Playlist introuvable");
  }
  return { ok: true as const };
}

export async function addPlaylistItem(
  userId: string,
  playlistId: string,
  slugId: string,
) {
  const p = await prisma.playlist.findFirst({
    where: { id: playlistId, ownerUserId: userId },
  });
  if (!p) {
    throw new AppError(404, "PLAYLIST_NOT_FOUND", "Playlist introuvable");
  }

  const video = await getPublishedVideoBySlugId(slugId);

  const maxPos = await prisma.playlistItem.aggregate({
    where: { playlistId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  try {
    await prisma.playlistItem.create({
      data: { playlistId, videoId: video.id, position },
    });
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as { code?: string }).code
        : undefined;
    if (code === "P2002") {
      return { ok: true as const, alreadyExists: true };
    }
    throw e;
  }
  return { ok: true as const, alreadyExists: false };
}

export async function removePlaylistItem(
  userId: string,
  playlistId: string,
  slugId: string,
) {
  const p = await prisma.playlist.findFirst({
    where: { id: playlistId, ownerUserId: userId },
  });
  if (!p) {
    throw new AppError(404, "PLAYLIST_NOT_FOUND", "Playlist introuvable");
  }

  const video = await getPublishedVideoBySlugId(slugId);
  await prisma.playlistItem.deleteMany({
    where: { playlistId, videoId: video.id },
  });
  return { ok: true as const };
}
