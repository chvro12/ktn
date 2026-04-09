import type { FastifyInstance } from "fastify";

/**
 * Diagnostic déploiement (sans secrets). Utile pour vérifier CORS / mauvaise URL Railway.
 * GET depuis le navigateur ou curl ; ajoute un header Origin pour simuler une origine.
 */
export async function registerDebugPublicRoutes(app: FastifyInstance) {
  app.get("/v1/public/debug-config", async (request) => {
    const raw = process.env.CORS_ORIGIN ?? "";
    const origins = raw.split(",").map((s) => s.trim()).filter(Boolean);
    const previewFlag = (process.env.CORS_ALLOW_VERCEL_PREVIEWS ?? "")
      .trim()
      .toLowerCase();
    const allowVercelPreviews = ["1", "true", "yes", "on"].includes(previewFlag);
    const originHeader =
      typeof request.headers.origin === "string"
        ? request.headers.origin
        : null;

    let originWouldBeAllowed: boolean | null = null;
    if (originHeader) {
      if (origins.includes(originHeader)) {
        originWouldBeAllowed = true;
      } else if (
        allowVercelPreviews &&
        /^https:\/\/.+\.vercel\.app$/i.test(originHeader)
      ) {
        originWouldBeAllowed = true;
      } else {
        originWouldBeAllowed = false;
      }
    }

    return {
      ok: true,
      nodeEnv: process.env.NODE_ENV ?? "(non défini)",
      serverTimeUtc: new Date().toISOString(),
      cors: {
        allowVercelPreviews,
        allowVercelRaw: process.env.CORS_ALLOW_VERCEL_PREVIEWS ?? "(non défini)",
        originsConfigured: origins,
        requestOriginHeader: originHeader,
        originWouldBeAllowed,
      },
      hints: [
        originWouldBeAllowed === false
          ? "Cette origine serait refusée par CORS. Ajoute CORS_ALLOW_VERCEL_PREVIEWS=1 sur Railway ou l’origine exacte dans CORS_ORIGIN."
          : null,
        !allowVercelPreviews && originHeader?.includes(".vercel.app")
          ? "Origine preview Vercel : mets CORS_ALLOW_VERCEL_PREVIEWS=1 sur ce service Railway."
          : null,
      ].filter(Boolean),
    };
  });
}
