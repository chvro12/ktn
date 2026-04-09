import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, normalize, resolve, sep } from "node:path";
import type { FastifyInstance } from "fastify";
import { resolveMediaPath } from "../../lib/media-config.js";
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
  app.get<{ Params: { videoId: string; "*": string } }>(
    "/v1/media/:videoId/*",
    async (request, reply) => {
      const { videoId } = request.params;
      const rest = (request.params["*"] ?? "").replace(/^\/+/, "");
      if (!rest) {
        void reply.status(404).send();
        return;
      }

      const allowed = await canReadMediaAsset(videoId, rest);
      if (!allowed) {
        void reply.status(404).send();
        return;
      }

      const root = resolveMediaPath(videoId);
      const full = resolve(root, normalize(rest));
      if (full !== root && !full.startsWith(root + sep)) {
        void reply.status(404).send();
        return;
      }

      try {
        const st = await stat(full);
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
      void reply.header("Content-Type", mime);
      void reply.header("Cache-Control", "public, max-age=3600");
      return reply.send(createReadStream(full));
    },
  );
}
