import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function defaultMediaRootFromMonorepo(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "../../../..");
  return resolve(repoRoot, "data", "media");
}

/** Racine stockage (absolu). `MEDIA_ROOT` prime sur le défaut monorepo `data/media`. */
export function getMediaRoot(): string {
  return resolve(process.env.MEDIA_ROOT ?? defaultMediaRootFromMonorepo());
}

export async function ensureVideoDir(videoId: string): Promise<string> {
  const dir = resolve(getMediaRoot(), videoId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export function resolveMediaPath(videoId: string, ...segments: string[]): string {
  return resolve(getMediaRoot(), videoId, ...segments);
}

/** URL publique de base pour construire hlsUrl (sans slash final). */
export function getPublicMediaBase(): string {
  return (
    process.env.PUBLIC_MEDIA_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  ).replace(/\/$/, "");
}
