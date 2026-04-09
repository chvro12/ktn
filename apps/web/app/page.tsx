import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { fetchFeedServer } from "@/lib/server-public-api";

export default async function Home() {
  const feed = await fetchFeedServer();

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Découvrir
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Les vidéos publiques les plus récentes de la plateforme.
            </p>
          </div>
        </header>
        <VideoGrid items={feed.items} />
      </div>
    </AppShell>
  );
}
