import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "@prisma/client";
import { VideoProcessingStatus } from "@prisma/client";

export type MediaProcessDeps = {
  prisma: PrismaClient;
  getMediaRoot: () => string;
  getPublicMediaBase: () => string;
};

function run(cmd: string, args: string[]): Promise<void> {
  return new Promise((res, rej) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("error", rej);
    p.on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} code ${c}`))));
  });
}

async function ffprobeDuration(file: string): Promise<number | null> {
  try {
    const out = await new Promise<string>((ok, err) => {
      execFile(
        "ffprobe",
        [
          "-v",
          "error",
          "-show_entries",
          "format=duration",
          "-of",
          "default=noprint_wrappers=1:nokey=1",
          file,
        ],
        (e, stdout) => {
          if (e) err(e);
          else ok(stdout.trim());
        },
      );
    });
    const n = Number(out);
    return Number.isFinite(n) ? Math.floor(n) : null;
  } catch {
    return null;
  }
}

/**
 * Réclame une vidéo UPLOADED (atomique) puis transcode.
 * @returns true si ce processus a fait le travail, false si une autre instance l’a déjà prise / déjà prête.
 */
export async function processUploadedVideo(
  deps: MediaProcessDeps,
  videoId: string,
): Promise<boolean> {
  const claimed = await deps.prisma.video.updateMany({
    where: {
      id: videoId,
      processingStatus: VideoProcessingStatus.UPLOADED,
    },
    data: { processingStatus: VideoProcessingStatus.PROCESSING },
  });

  if (claimed.count === 0) {
    const v = await deps.prisma.video.findUnique({
      where: { id: videoId },
      select: { processingStatus: true },
    });
    if (
      v?.processingStatus === VideoProcessingStatus.READY ||
      v?.processingStatus === VideoProcessingStatus.PROCESSING
    ) {
      return false;
    }
    return false;
  }

  const video = await deps.prisma.video.findUnique({ where: { id: videoId } });
  if (!video?.sourceAssetKey) {
    console.error(
      "[media-process] %s: pas de sourceAssetKey après claim — FAILED",
      videoId,
    );
    await deps.prisma.video.update({
      where: { id: videoId },
      data: { processingStatus: VideoProcessingStatus.FAILED },
    });
    return true;
  }

  const root = deps.getMediaRoot();
  const sourcePath = join(root, videoId, video.sourceAssetKey);
  const hlsDir = join(root, videoId, "hls");

  async function markFailed(reason: string, err: unknown) {
    console.error(
      "[media-process] %s: %s — %s",
      videoId,
      reason,
      err instanceof Error ? err.message : String(err),
    );
    await deps.prisma.video.update({
      where: { id: videoId },
      data: { processingStatus: VideoProcessingStatus.FAILED },
    });
  }

  try {
    await mkdir(hlsDir, { recursive: true });
  } catch (e) {
    await markFailed("impossible de créer le dossier HLS", e);
    return true;
  }

  const base = deps.getPublicMediaBase();
  const skip = process.env.MEDIA_SKIP_TRANSCODE === "1";

  if (skip) {
    try {
      const ext =
        video.sourceAssetKey.slice(video.sourceAssetKey.lastIndexOf(".")) ||
        ".mp4";
      const name = `passthrough${ext}`;
      const dest = join(hlsDir, name);
      await copyFile(sourcePath, dest);
      const dur = await ffprobeDuration(dest);
      const hlsUrl = `${base}/v1/media/${videoId}/hls/${name}`;
      await deps.prisma.video.update({
        where: { id: videoId },
        data: {
          processingStatus: VideoProcessingStatus.READY,
          hlsUrl,
          playbackManifestKey: `hls/${name}`,
          durationSec: dur ?? video.durationSec ?? undefined,
          publishedAt: !video.publishedAt ? new Date() : video.publishedAt,
        },
      });
      return true;
    } catch (e) {
      await markFailed("passthrough (MEDIA_SKIP_TRANSCODE)", e);
      return true;
    }
  }

  const m3u8 = join(hlsDir, "stream.m3u8");
  try {
    await run("ffmpeg", [
      "-y",
      "-i",
      sourcePath,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      join(hlsDir, "segment%03d.ts"),
      m3u8,
    ]);
  } catch (e) {
    await markFailed(
      "ffmpeg HLS (vérifier que ffmpeg est installé sur le serveur / worker)",
      e,
    );
    return true;
  }

  try {
    const dur = await ffprobeDuration(sourcePath);
    const thumb = join(hlsDir, "thumb.jpg");
    try {
      await run("ffmpeg", [
        "-y",
        "-ss",
        "1",
        "-i",
        sourcePath,
        "-vframes",
        "1",
        thumb,
      ]);
    } catch {
      /* miniature optionnelle */
    }

    const hlsUrl = `${base}/v1/media/${videoId}/hls/stream.m3u8`;
    const thumbUrl = `${base}/v1/media/${videoId}/hls/thumb.jpg`;

    await deps.prisma.video.update({
      where: { id: videoId },
      data: {
        processingStatus: VideoProcessingStatus.READY,
        hlsUrl,
        playbackManifestKey: "hls/stream.m3u8",
        durationSec: dur ?? undefined,
        thumbnailUrl: thumbUrl,
        publishedAt: !video.publishedAt ? new Date() : video.publishedAt,
      },
    });
    return true;
  } catch (e) {
    await markFailed("finalisation après transcodage HLS", e);
    return true;
  }
}
