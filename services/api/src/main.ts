import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

import { buildApp } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../..");
config({ path: path.join(monorepoRoot, ".env") });

/** Render / Railway injectent `PORT` ; en local on utilise souvent `API_PORT`. */
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);
const host = process.env.API_HOST ?? "0.0.0.0";

const app = await buildApp();

try {
  await app.listen({ port, host });
  app.log.info(`API sur http://${host === "0.0.0.0" ? "localhost" : host}:${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
