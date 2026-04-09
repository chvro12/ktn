"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import {
  PLAYLIST_PRIVACY_OPTIONS,
  playlistPrivacyLabel,
  type PlaylistPrivacyValue,
} from "@/lib/playlist-ui";

type MeResponse =
  | { user: { displayName: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

type PlaylistRow = {
  id: string;
  slug: string;
  title: string;
  privacy: string;
  itemCount: number;
  updatedAt: string;
};

async function fetchMyPlaylists(): Promise<{ playlists: PlaylistRow[] }> {
  const res = await apiFetch("/v1/playlists/me");
  if (!res.ok) throw new Error("playlists");
  return res.json() as Promise<{ playlists: PlaylistRow[] }>;
}

export function UserPlaylistsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState<PlaylistPrivacyValue>("PRIVATE");

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  useEffect(() => {
    if (meQuery.isPending) return;
    if (!loggedIn) router.replace("/login?next=/playlists");
  }, [meQuery.isPending, loggedIn, router]);

  const listQuery = useQuery({
    queryKey: ["playlists", "me"],
    queryFn: fetchMyPlaylists,
    enabled: loggedIn && !meQuery.isPending,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { title: string; privacy: PlaylistPrivacyValue }) => {
      const res = await apiFetch("/v1/playlists", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("create");
      return res.json() as Promise<{ playlist: { id: string } }>;
    },
    onSuccess: async (data) => {
      setTitle("");
      setPrivacy("PRIVATE");
      await queryClient.invalidateQueries({ queryKey: ["playlists", "me"] });
      router.push(`/playlist/${data.playlist.id}`);
    },
  });

  if (meQuery.isPending || !loggedIn) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Mes playlists</h1>
          <p className="text-sm text-muted-foreground">
            Crée des listes et ajoute des vidéos depuis une page de lecture.
          </p>
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Accueil
          </Link>
        </div>

        <form
          className="flex max-w-lg flex-col gap-3 rounded-lg border border-border bg-card/40 p-4 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t || createMutation.isPending) return;
            createMutation.mutate({ title: t, privacy });
          }}
        >
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pl-title">Nouvelle playlist</Label>
              <Input
                id="pl-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre"
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pl-privacy">Visibilité</Label>
              <select
                id="pl-privacy"
                value={privacy}
                onChange={(e) =>
                  setPrivacy(e.target.value as PlaylistPrivacyValue)
                }
                className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {PLAYLIST_PRIVACY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={createMutation.isPending || !title.trim()}>
            {createMutation.isPending ? "Création…" : "Créer"}
          </Button>
        </form>
        {createMutation.isError ? (
          <p className="text-xs text-destructive" role="alert">
            Impossible de créer la playlist.
          </p>
        ) : null}

        {listQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Chargement des playlists…</p>
        ) : listQuery.isError ? (
          <p className="text-sm text-destructive">Impossible de charger tes playlists.</p>
        ) : (
          <ul className="space-y-2">
            {listQuery.data?.playlists.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/playlist/${p.id}`}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border bg-card/30 px-4 py-3 text-sm transition-colors hover:bg-muted/40"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {p.itemCount} vidéo{p.itemCount > 1 ? "s" : ""} ·{" "}
                    {playlistPrivacyLabel(p.privacy)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
