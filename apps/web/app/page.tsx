import { AppShell } from "@/components/layout/app-shell";
import { SessionStatus } from "@/components/auth/session-status";
import { VideoGrid } from "@/components/video/video-grid";
import { fetchFeedServer } from "@/lib/server-public-api";

export default async function Home() {
  const feed = await fetchFeedServer();

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">Accueil</h1>
          <p className="text-sm text-muted-foreground">
            Les dernières vidéos publiées.
          </p>
        </div>
        <VideoGrid items={feed.items} />
        <section aria-labelledby="session-heading" className="space-y-2 border-t border-border pt-8">
          <h2 id="session-heading" className="text-sm font-medium">
            Session
          </h2>
          <SessionStatus />
        </section>
      </div>
    </AppShell>
  );
}
