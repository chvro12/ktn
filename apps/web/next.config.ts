import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Racine du dépôt : Turbopack + variables `.env` à la racine (local ; sur Vercel le dashboard suffit). */
const monorepoRoot = path.join(__dirname, "../..");
loadEnvConfig(monorepoRoot);

/**
 * Sur Vercel : au moins une URL d’API. `API_URL` (sans NEXT_PUBLIC) est lue au runtime par
 * `/api/public-config` ; `NEXT_PUBLIC_API_URL` reste utile pour le SSR et en fallback client.
 */
if (process.env.VERCEL === "1") {
  const api =
    process.env.API_URL?.trim() || process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!api) {
    throw new Error(
      "Définis API_URL et/ou NEXT_PUBLIC_API_URL sur Vercel (https://ton-api.up.railway.app). API_URL permet de changer l’URL sans rebuild des previews.",
    );
  }
  try {
    const u = new URL(api);
    if (u.protocol !== "https:") {
      throw new Error("L’URL de l’API doit être en https en production.");
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        "API_URL / NEXT_PUBLIC_API_URL invalide (ex. https://ton-api.up.railway.app).",
      );
    }
    throw e;
  }
}

/**
 * Construit les patterns autorisés pour next/image à partir des URLs d’API configurées.
 * Couvre : localhost:4000 (dev), PUBLIC_MEDIA_BASE_URL et NEXT_PUBLIC_API_URL (prod).
 */
function buildMediaRemotePatterns(): import("next").RemotePattern[] {
  const candidates = [
    process.env.PUBLIC_MEDIA_BASE_URL?.trim(),
    process.env.NEXT_PUBLIC_API_URL?.trim(),
    "http://localhost:4000",
  ].filter(Boolean) as string[];

  const seen = new Set<string>();
  const patterns: import("next").RemotePattern[] = [];

  for (const raw of candidates) {
    try {
      const u = new URL(raw.replace(/\/$/, ""));
      const key = `${u.protocol}//${u.hostname}:${u.port}`;
      if (seen.has(key)) continue;
      seen.add(key);
      patterns.push({
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        port: u.port || undefined,
        pathname: "/v1/media/**",
      });
    } catch {
      // URL invalide, ignorée
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      ...buildMediaRemotePatterns(),
    ],
  },
};

export default nextConfig;
