import { randomBytes } from "node:crypto";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import type { MultipartFile } from "@fastify/multipart";
import {
  VideoAssetType,
  VideoModerationState,
  VideoProcessingStatus,
  VideoVisibility,
  type Prisma,
} from "@katante/db";
import { AppError } from "../../common/errors.js";
import { prisma } from "../../lib/prisma.js";
import {
  ensureVideoDir,
  resolveMediaPath,
  getMediaRoot,
} from "../../lib/media-config.js";
import type { CreateStudioVideoBody } from "./studio.schemas.js";
import { normalize, resolve, sep } from "node:path";

const ALLOWED_UPLOAD_MIME = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "application/octet-stream",
]);

function slugifyTitle(title: string): string {
  const base = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : "video";
}

async function uniqueVideoSlug(title: string): Promise<string> {
  const base = slugifyTitle(title);
  for (let i = 0; i < 12; i++) {
    const slug = `${base}-${randomBytes(3).toString("hex")}`;
    const exists = await prisma.video.findUnique({ where: { slug } });
    if (!exists) return slug;
  }
  throw new AppError(500, "SLUG_FAIL", "Impossible de générer un identifiant URL");
}

const studioListSelect = {
  id: true,
  slug: true,
  title: true,
  visibility: true,
  processingStatus: true,
  publishedAt: true,
  updatedAt: true,
  thumbnailUrl: true,
  hlsUrl: true,
} satisfies Prisma.VideoSelect;

export async function assertStudioVideoOwner(userId: string, videoId: string) {
  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      channel: { ownerUserId: userId },
    },
    select: {
      id: true,
      slug: true,
      channelId: true,
      title: true,
      description: true,
      visibility: true,
      processingStatus: true,
      publishedAt: true,
      updatedAt: true,
      thumbnailUrl: true,
      hlsUrl: true,
      durationSec: true,
      sourceAssetKey: true,
    },
  });
  if (!video) {
    throw new AppError(404, "VIDEO_NOT_FOUND", "Vidéo introuvable");
  }
  return video;
}

export async function createStudioVideo(
  userId: string,
  body: CreateStudioVideoBody,
) {
  const channel = await prisma.channel.findUnique({
    where: { ownerUserId: userId },
  });
  if (!channel) {
    throw new AppError(
      400,
      "NEED_CHANNEL",
      "Crée d’abord une chaîne (onboarding)",
    );
  }

  const slug = await uniqueVideoSlug(body.title);

  const video = await prisma.video.create({
    data: {
      channelId: channel.id,
      slug,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      visibility: body.visibility ?? VideoVisibility.PRIVATE,
      processingStatus: VideoProcessingStatus.DRAFT,
      moderationState: VideoModerationState.NONE,
    },
    select: studioListSelect,
  });

  return { video };
}

export async function listStudioVideos(userId: string) {
  const channel = await prisma.channel.findUnique({
    where: { ownerUserId: userId },
    select: { id: true },
  });
  if (!channel) {
    return {
      channelId: null as string | null,
      videos: [] as Prisma.VideoGetPayload<{ select: typeof studioListSelect }>[],
    };
  }

  const videos = await prisma.video.findMany({
    where: { channelId: channel.id },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: studioListSelect,
  });

  return { channelId: channel.id, videos };
}

export async function getStudioVideoDetail(userId: string, videoId: string) {
  const v = await assertStudioVideoOwner(userId, videoId);
  return {
    video: {
      ...v,
      watchPath: `/video/${v.slug}-${v.id}`,
      updatedAt: v.updatedAt.toISOString(),
      publishedAt: v.publishedAt?.toISOString() ?? null,
    },
  };
}

export async function patchStudioVideo(
  userId: string,
  videoId: string,
  patch: {
    title?: string;
    description?: string;
    visibility?: VideoVisibility;
  },
) {
  const v = await assertStudioVideoOwner(userId, videoId);
  if (v.processingStatus === VideoProcessingStatus.PROCESSING) {
    throw new AppError(
      409,
      "VIDEO_BUSY",
      "Modification impossible pendant le traitement",
    );
  }

  const data: Prisma.VideoUpdateInput = {};
  if (patch.title !== undefined) data.title = patch.title.trim();
  if (patch.description !== undefined) {
    data.description = patch.description.trim();
  }
  if (patch.visibility !== undefined) data.visibility = patch.visibility;

  const nextVisibility = patch.visibility ?? v.visibility;
  if (
    patch.visibility !== undefined &&
    v.processingStatus === VideoProcessingStatus.READY &&
    !v.publishedAt &&
    nextVisibility !== VideoVisibility.PRIVATE
  ) {
    data.publishedAt = new Date();
  }

  if (Object.keys(data).length === 0) {
    return { ok: true as const };
  }

  await prisma.video.update({
    where: { id: videoId },
    data,
  });
  return { ok: true as const };
}

export async function publishStudioVideo(userId: string, videoId: string) {
  const v = await assertStudioVideoOwner(userId, videoId);
  if (v.processingStatus !== VideoProcessingStatus.READY) {
    throw new AppError(
      400,
      "NOT_READY",
      "La vidéo n’est pas prête à être publiée",
    );
  }
  if (v.visibility === VideoVisibility.PRIVATE) {
    throw new AppError(
      400,
      "PRIVATE_VIDEO",
      "Passe la visibilité à public ou non répertoriée pour publier",
    );
  }
  if (v.publishedAt) {
    return { ok: true as const, already: true };
  }

  await prisma.video.update({
    where: { id: videoId },
    data: { publishedAt: new Date() },
  });
  return { ok: true as const, already: false };
}

function extFromFilename(name: string): string {
  const i = name.lastIndexOf(".");
  if (i <= 0) return ".mp4";
  const ext = name.slice(i).toLowerCase();
  if (ext.length > 8) return ".mp4";
  return ext;
}

export async function uploadStudioSource(
  userId: string,
  videoId: string,
  file: MultipartFile,
) {
  const v = await assertStudioVideoOwner(userId, videoId);

  const allowedStatuses: VideoProcessingStatus[] = [
    VideoProcessingStatus.DRAFT,
    VideoProcessingStatus.FAILED,
  ];
  if (!allowedStatuses.includes(v.processingStatus)) {
    throw new AppError(
      409,
      "INVALID_STATUS",
      "Upload impossible dans l’état actuel",
    );
  }

  const mime = file.mimetype.toLowerCase();
  if (!ALLOWED_UPLOAD_MIME.has(mime)) {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      "Format vidéo non pris en charge (mp4, mov, webm, avi)",
    );
  }

  await prisma.video.update({
    where: { id: videoId },
    data: { processingStatus: VideoProcessingStatus.UPLOADING },
  });

  await ensureVideoDir(videoId);
  const ext = extFromFilename(file.filename);
  const relativeKey = `source${ext}`;
  const absPath = resolveMediaPath(videoId, relativeKey);

  let sizeBytes = 0n;
  try {
    await pipeline(file.file, createWriteStream(absPath));
    const stat = await import("node:fs/promises").then((fs) =>
      fs.stat(absPath),
    );
    sizeBytes = BigInt(stat.size);
    if (stat.size < 32) {
      throw new Error("empty");
    }
  } catch {
    await prisma.video.update({
      where: { id: videoId },
      data: { processingStatus: VideoProcessingStatus.FAILED },
    });
    throw new AppError(400, "UPLOAD_FAILED", "Échec de l’enregistrement du fichier");
  }

  await prisma.videoAsset.deleteMany({
    where: {
      videoId,
      assetType: VideoAssetType.SOURCE,
    },
  });

  await prisma.$transaction([
    prisma.videoAsset.create({
      data: {
        videoId,
        assetType: VideoAssetType.SOURCE,
        storageKey: `${videoId}/${relativeKey}`,
        mimeType: mime,
        sizeBytes,
      },
    }),
    prisma.video.update({
      where: { id: videoId },
      data: {
        sourceAssetKey: relativeKey,
        processingStatus: VideoProcessingStatus.UPLOADED,
      },
    }),
  ]);

  return {
    ok: true as const,
    processingStatus: VideoProcessingStatus.UPLOADED,
  };
}

/** Lecture média : vidéo prête, publiée, pas privée. */
export async function canReadMediaAsset(
  videoId: string,
  relativePath: string,
  allowAdminPreview = false,
): Promise<boolean> {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    select: {
      processingStatus: true,
      visibility: true,
      publishedAt: true,
    },
  });
  if (!video) {
    return false;
  }

  if (allowAdminPreview) {
    if (!relativePath.startsWith("hls/")) {
      return false;
    }
  } else {
    if (video.processingStatus !== VideoProcessingStatus.READY) {
      return false;
    }
    if (!video.publishedAt || video.visibility === VideoVisibility.PRIVATE) {
      return false;
    }
  }

  const root = resolve(getMediaRoot(), videoId);
  const normalized = normalize(relativePath.replace(/^\/+/, "")).replace(
    /^(\.\.(\/|\\|$))+/,
    "",
  );
  const full = resolve(root, normalized);
  if (full !== root && !full.startsWith(root + sep)) return false;
  return true;
}
