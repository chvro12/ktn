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

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Recherche</h1>
          {query ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Résultats pour « {query} »
              {results?.items.length != null
                ? ` — ${results.items.length} vidéo(s)`
                : null}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Saisis au moins 2 caractères dans la barre du haut.
            </p>
          )}
        </div>
        {query.length >= 2 && results ? (
          <VideoGrid
            items={results.items}
            emptyMessage="Aucun titre ne correspond à cette recherche."
          />
        ) : null}
        {query.length >= 2 && results === null ? (
          <p className="text-sm text-destructive">
            La recherche est momentanément indisponible. Réessaie dans un
            instant.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
