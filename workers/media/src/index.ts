import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VideoProcessingStatus } from "@katante/db";
import { processVideoJob } from "./process-video.js";
import { prisma } from "./prisma.js";

const here = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(here, "../../../.env") });

const POLL_MS = Number(process.env.WORKER_POLL_MS ?? 4_000);

async function claimNext(): Promise<string | null> {
  const row = await prisma.video.findFirst({
    where: { processingStatus: VideoProcessingStatus.UPLOADED },
    orderBy: { updatedAt: "asc" },
    select: { id: true },
  });
  if (!row) return null;

  const u = await prisma.video.updateMany({
    where: { id: row.id, processingStatus: VideoProcessingStatus.UPLOADED },
    data: { processingStatus: VideoProcessingStatus.PROCESSING },
  });
  return u.count === 1 ? row.id : null;
}

async function main(): Promise<void> {
  console.info("[worker-media] démarré (poll %d ms)", POLL_MS);
  for (;;) {
    try {
      const id = await claimNext();
      if (id) {
        console.info("[worker-media] traitement %s", id);
        await processVideoJob(id);
        console.info("[worker-media] terminé %s", id);
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
