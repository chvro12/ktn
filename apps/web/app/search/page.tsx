import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { fetchSearchVideosServer } from "@/lib/server-public-api";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  if (query.length < 2) {
    return { title: "Recherche" };
  }
  return {
    title: `« ${query} »`,
    robots: { index: true, follow: true },
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results =
    query.length >= 2 ? await fetchSearchVideosServer(query) : null;
  const resultCount = results?.items.length ?? 0;

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.97),rgba(244,239,228,0.9))] px-5 py-6 shadow-[0_24px_70px_-50px_rgba(23,23,23,0.45)] sm:px-7 sm:py-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Recherche
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {query ? `Résultats pour « ${query} »` : "Trouve plus vite ce que tu veux regarder"}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {query
                    ? `${resultCount} vidéo${resultCount > 1 ? "s" : ""} trouvée${resultCount > 1 ? "s" : ""} pour cette recherche.`
                    : "Saisis au moins 2 caractères dans la barre du haut pour lancer la recherche."}
                </p>
              </div>
            </div>
            {query ? (
              <div className="rounded-2xl border border-foreground/10 bg-background/75 px-4 py-3 text-sm shadow-[0_18px_50px_-40px_rgba(23,23,23,0.4)]">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Requête
                </p>
                <p className="mt-1 font-medium text-foreground">{query}</p>
              </div>
            ) : null}
          </div>
        </section>
        {query.length >= 2 && results ? (
          <VideoGrid
            items={results.items}
            emptyMessage="Aucun titre ne correspond à cette recherche."
          />
        ) : null}
        {query.length >= 2 && results === null ? (
          <p className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            La recherche est momentanément indisponible. Réessaie dans un
            instant.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
