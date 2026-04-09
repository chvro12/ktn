import type { FastifyCorsOptions } from "@fastify/cors";

type CorsOrigin = NonNullable<FastifyCorsOptions["origin"]>;

/**
 * Toujours une fonction `origin` (pas une string seule) : avec `credentials: true`,
 * @fastify/cors doit **refléter** l’origine de la requête quand on accepte la requête.
 * Une simple string force un `Access-Control-Allow-Origin` fixe pour toutes les réponses,
 * ce qui casse les previews Vercel (`*.vercel.app` différent de la prod).
 *
 * - `CORS_ORIGIN` : une ou plusieurs origines exactes, séparées par des virgules.
 * - `CORS_ALLOW_VERCEL_PREVIEWS` : si `1` / `true` / `yes` / `on`, accepte aussi `https://*.vercel.app`.
 */
export function createCorsOrigin(): CorsOrigin {
  return (origin, cb) => {
    const raw = process.env.CORS_ORIGIN ?? "http://localhost:3000";
    const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const previewFlag = (process.env.CORS_ALLOW_VERCEL_PREVIEWS ?? "")
      .trim()
      .toLowerCase();
    const allowVercel = ["1", "true", "yes", "on"].includes(previewFlag);

    if (!origin) {
      cb(null, true);
      return;
    }
    if (list.includes(origin)) {
      cb(null, true);
      return;
    }
    if (allowVercel && /^https:\/\/.+\.vercel\.app$/i.test(origin)) {
      cb(null, true);
      return;
    }
    cb(null, false);
  };
}
