import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function getMediaRoot(): string {
  if (process.env.MEDIA_ROOT) {
    return resolve(process.env.MEDIA_ROOT);
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, "../../..");
  return resolve(repoRoot, "data", "media");
}

export function getPublicMediaBase(): string {
  return (
    process.env.PUBLIC_MEDIA_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  ).replace(/\/$/, "");
}
