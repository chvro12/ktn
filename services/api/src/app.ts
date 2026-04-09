import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { createCorsOrigin } from "./lib/cors-config.js";
import { registerChannelPublicRoutes } from "./modules/channels/channel-public.routes.js";
import { registerChannelRoutes } from "./modules/channels/channel.routes.js";
import { registerIdentityRoutes } from "./modules/identity/auth.routes.js";
import { registerEngagementRoutes } from "./modules/engagement/engagement.routes.js";
import { registerLibraryRoutes } from "./modules/library/library.routes.js";
import { registerMediaRoutes } from "./modules/media/media.routes.js";
import { registerPlaylistRoutes } from "./modules/playlists/playlist.routes.js";
import { registerStudioRoutes } from "./modules/studio/studio.routes.js";
import { registerSubscriptionRoutes } from "./modules/subscriptions/subscription.routes.js";
import { registerVideoPublicRoutes } from "./modules/videos/video-public.routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin: createCorsOrigin(),
    credentials: true,
  });

  await app.register(cookie, {
    secret:
      process.env.COOKIE_SECRET ??
      "dev-cookie-secret-change-in-production-min-32-chars",
  });

  app.get("/health", async () => ({ status: "ok" }));

  await registerIdentityRoutes(app);
  await registerChannelRoutes(app);
  await registerVideoPublicRoutes(app);
  await registerChannelPublicRoutes(app);
  await registerEngagementRoutes(app);
  await registerSubscriptionRoutes(app);
  await registerLibraryRoutes(app);
  await registerPlaylistRoutes(app);

  await app.register(multipart, {
    limits: { fileSize: 512 * 1024 * 1024 },
  });
  await registerStudioRoutes(app);
  await registerMediaRoutes(app);

  return app;
}
