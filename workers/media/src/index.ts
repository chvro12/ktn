import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { processUploadedVideo } from "@katante/media-process";
import { VideoProcessingStatus } from "@katante/db";
import { prisma } from "./prisma.js";
import { getMediaRoot, getPublicMediaBase } from "./media-root.js";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../../.env") });

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 4_000);

const deps = { prisma, getMediaRoot, getPublicMediaBase };

async function main(): Promise<void> {
  console.info("[worker-media] démarré (poll %d ms)", POLL_MS);
  for (;;) {
    try {
      const row = await prisma.video.findFirst({
        where: { processingStatus: VideoProcessingStatus.UPLOADED },
        orderBy: { updatedAt: "asc" },
        select: { id: true },
      });
      if (row) {
        console.info("[worker-media] traitement %s", row.id);
        await processUploadedVideo(deps, row.id);
        console.info("[worker-media] terminé %s", row.id);
      }
    } catch (e) {
      console.error("[worker-media]", e);
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
