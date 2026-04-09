import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { VideoProcessingStatus, VideoVisibility } from "@katante/db";
import { getMediaRoot, getPublicMediaBase } from "./media-root.js";
import { prisma } from "./prisma.js";

function run(
  cmd: string,
  args: string[],
): Promise<void> {
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

export async function processVideoJob(videoId: string): Promise<void> {
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video?.sourceAssetKey) {
    throw new Error("video sans source");
  }

  const root = getMediaRoot();
  const sourcePath = join(root, videoId, video.sourceAssetKey);
  const hlsDir = join(root, videoId, "hls");
  await mkdir(hlsDir, { recursive: true });

  const base = getPublicMediaBase();
  const skip = process.env.MEDIA_SKIP_TRANSCODE === "1";

  if (skip) {
    const ext =
      video.sourceAssetKey.slice(video.sourceAssetKey.lastIndexOf(".")) || ".mp4";
    const name = `passthrough${ext}`;
    const dest = join(hlsDir, name);
    await copyFile(sourcePath, dest);
    const dur = await ffprobeDuration(dest);
    const hlsUrl = `${base}/v1/media/${videoId}/hls/${name}`;
    await prisma.video.update({
      where: { id: videoId },
      data: {
        processingStatus: VideoProcessingStatus.READY,
        hlsUrl,
        playbackManifestKey: `hls/${name}`,
        durationSec: dur ?? video.durationSec ?? undefined,
        publishedAt:
          !video.publishedAt && video.visibility !== VideoVisibility.PRIVATE
            ? new Date()
            : video.publishedAt ?? undefined,
      },
    });
    return;
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
  } catch {
    await prisma.video.update({
      where: { id: videoId },
      data: { processingStatus: VideoProcessingStatus.FAILED },
    });
    return;
  }

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

  await prisma.video.update({
    where: { id: videoId },
    data: {
      processingStatus: VideoProcessingStatus.READY,
      hlsUrl,
      playbackManifestKey: "hls/stream.m3u8",
      durationSec: dur ?? undefined,
      thumbnailUrl: thumbUrl,
      publishedAt:
        !video.publishedAt && video.visibility !== VideoVisibility.PRIVATE
          ? new Date()
          : video.publishedAt ?? undefined,
    },
  });
}
