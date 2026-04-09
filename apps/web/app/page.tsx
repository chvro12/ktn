import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { fetchFeedServer } from "@/lib/server-public-api";

export default async function Home() {
  const feed = await fetchFeedServer();
  const featuredCount = feed.items.length;

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,239,228,0.92))] px-4 py-5 shadow-[0_20px_70px_-45px_rgba(23,23,23,0.45)] sm:rounded-[2rem] sm:px-7 sm:py-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center rounded-full border border-foreground/10 bg-background/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Accueil
              </div>
              <div className="space-y-3">
                <h1 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
                  Des vidéos récentes, une interface plus calme.
                </h1>
                <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Les dernières publications apparaissent ici dans une présentation
                  simple, lisible et centrée sur le contenu.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[20rem]">
              <div className="rounded-2xl border border-foreground/10 bg-background/75 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  En ligne
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {featuredCount}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  vidéo{featuredCount > 1 ? "s" : ""} visible
                  {featuredCount > 1 ? "s" : ""} maintenant
                </p>
              </div>
              <div className="rounded-2xl border border-foreground/10 bg-foreground px-4 py-4 text-primary-foreground shadow-[0_18px_45px_-35px_rgba(0,0,0,0.7)]">
                <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">
                  Parcours
                </p>
                <p className="mt-2 text-lg font-semibold tracking-tight">
                  Découvrir sans friction
                </p>
                <p className="mt-1 text-sm text-primary-foreground/75">
                  Miniatures claires, hiérarchie simple, actions utiles seulement.
                </p>
              </div>
            </div>
          </div>
        </section>

        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Dernières vidéos
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
