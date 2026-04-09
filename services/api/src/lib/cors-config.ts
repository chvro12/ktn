import type { FastifyCorsOptions } from "@fastify/cors";

type CorsOrigin = NonNullable<FastifyCorsOptions["origin"]>;

/**
 * - `CORS_ORIGIN` : une ou plusieurs origines exactes, séparées par des virgules.
 * - `CORS_ALLOW_VERCEL_PREVIEWS` : si `1` ou `true`, autorise aussi `https://*.vercel.app`
 *   (prévisualisations / déploiements Vercel dont l’URL change à chaque build).
 */
export function createCorsOrigin(): CorsOrigin {
  const raw = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  const previewFlag = (process.env.CORS_ALLOW_VERCEL_PREVIEWS ?? "")
    .trim()
    .toLowerCase();
  const allowVercel = ["1", "true", "yes", "on"].includes(previewFlag);

  /** Toujours utiliser le callback dès qu’on autorise les previews (évite les OPTIONS incohérents). */
  if (!allowVercel) {
    return list.length <= 1 ? (list[0] ?? "http://localhost:3000") : list;
  }

  return (origin, cb) => {
    if (!origin) {
      cb(null, true);
      return;
    }
    if (list.includes(origin)) {
      cb(null, true);
      return;
    }
    if (/^https:\/\/.+\.vercel\.app$/i.test(origin)) {
      cb(null, true);
      return;
    }
    cb(null, false);
  };
}
