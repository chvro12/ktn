import { UserRole } from "@katante/db";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, normalize, resolve, sep } from "node:path";
import type { FastifyInstance } from "fastify";
import { resolveMediaPath } from "../../lib/media-config.js";
import { optionalAuth } from "../../lib/optional-auth.js";
import { canReadMediaAsset } from "../studio/studio.service.js";

const MIME: Record<string, string> = {
  ".m3u8": "application/vnd.apple.mpegurl",
  ".ts": "video/mp2t",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export async function registerMediaRoutes(app: FastifyInstance) {
  // Preflight CORS pour les requêtes HLS avec header Range (non-simple → preflight)
  app.options<{ Params: { videoId: string; "*": string } }>(
    "/v1/media/:videoId/*",
    async (request, reply) => {
      const origin = request.headers.origin ?? "*";
      void reply
        .header("Access-Control-Allow-Origin", origin)
        .header("Vary", "Origin")
        .header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        .header("Access-Control-Allow-Headers", "Range")
        .header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length")
        .header("Access-Control-Max-Age", "86400")
        .status(204)
        .send();
    },
  );

  app.get<{ Params: { videoId: string; "*": string } }>(
    "/v1/media/:videoId/*",
    { preHandler: optionalAuth },
    async (request, reply) => {
      const { videoId } = request.params;
      const rest = (request.params["*"] ?? "").replace(/^\/+/, "");
      if (!rest) {
        void reply.status(404).send();
        return;
      }

      const isAdmin = request.currentUser?.role === UserRole.ADMIN;
      const allowed = await canReadMediaAsset(videoId, rest, isAdmin);
      if (!allowed) {
        void reply.status(404).send();
        return;
      }

      // CORS pour HLS.js — fetch() cross-origin sans credentials sur les segments
      const origin = request.headers.origin;
      void reply.header("Access-Control-Allow-Origin", origin ?? "*");
      void reply.header("Access-Control-Expose-Headers", "Content-Range, Accept-Ranges, Content-Length");
      if (origin) void reply.header("Vary", "Origin");

      const root = resolveMediaPath(videoId);
      const full = resolve(root, normalize(rest));
      if (full !== root && !full.startsWith(root + sep)) {
        void reply.status(404).send();
        return;
      }

      let st: Awaited<ReturnType<typeof stat>>;
      try {
        st = await stat(full);
        if (!st.isFile()) {
          void reply.status(404).send();
          return;
        }
      } catch {
        void reply.status(404).send();
        return;
      }

      const ext = extname(full).toLowerCase();
      const mime = MIME[ext] ?? "application/octet-stream";
      const fileSize = st.size;
      const cacheControl = isAdmin ? "private, no-store" : "public, max-age=3600";

      void reply.header("Accept-Ranges", "bytes");
      void reply.header("Cache-Control", cacheControl);

      const rangeHeader = request.headers.range;

      if (rangeHeader) {
        // Supporte "Range: bytes=start-end" pour la lecture vidéo dans le navigateur
        const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
        if (!match) {
          void reply
            .status(416)
            .header("Content-Range", `bytes */${fileSize}`)
            .send();
          return;
        }
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

        if (start > end || end >= fileSize) {
          void reply
            .status(416)
            .header("Content-Range", `bytes */${fileSize}`)
            .send();
          return;
        }

        const chunkSize = end - start + 1;
        void reply.status(206);
        void reply.header("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        void reply.header("Content-Length", String(chunkSize));
        void reply.header("Content-Type", mime);
        return reply.send(createReadStream(full, { start, end }));
      }

      // Réponse complète (200) — le navigateur peut aussi demander le fichier entier
      void reply.header("Content-Length", String(fileSize));
      void reply.header("Content-Type", mime);
      return reply.send(createReadStream(full));
    },
  );
}
