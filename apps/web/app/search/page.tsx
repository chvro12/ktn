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
        <header>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Recherche
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {query
              ? `${resultCount} vidéo${resultCount > 1 ? "s" : ""} trouvée${resultCount > 1 ? "s" : ""} pour « ${query} ».`
              : "Saisis au moins 2 caractères dans la barre du haut pour lancer la recherche."}
          </p>
        </header>
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
