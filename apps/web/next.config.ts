import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Racine du dépôt : Turbopack + variables `.env` à la racine (local ; sur Vercel le dashboard suffit). */
const monorepoRoot = path.join(__dirname, "../..");
loadEnvConfig(monorepoRoot);

/** Sur Vercel, `NEXT_PUBLIC_*` est figé au build : sans URL d’API, le client retombe sur localhost → « Failed to fetch ». */
if (process.env.VERCEL === "1") {
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!api) {
    throw new Error(
      "NEXT_PUBLIC_API_URL manquant pour le build Vercel. Dashboard → Environment Variables : mets l’URL https de ton API (ex. Railway), puis redéploie.",
    );
  }
  try {
    const u = new URL(api);
    if (u.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_API_URL doit être en https en production.");
    }
  } catch (e) {
    if (e instanceof TypeError) {
      throw new Error(
        "NEXT_PUBLIC_API_URL n’est pas une URL valide (ex. https://ton-api.up.railway.app).",
      );
    }
    throw e;
  }
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
    ],
  },
};

export default nextConfig;
