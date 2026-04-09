"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ListPlus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  PLAYLIST_PRIVACY_OPTIONS,
  type PlaylistPrivacyValue,
} from "@/lib/playlist-ui";

type MeResponse =
  | { user: { id: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

type PlaylistRow = {
  id: string;
  title: string;
  itemCount: number;
};

async function fetchMyPlaylists(): Promise<{ playlists: PlaylistRow[] }> {
  const res = await apiFetch("/v1/playlists/me");
  if (!res.ok) throw new Error("playlists");
  return res.json() as Promise<{ playlists: PlaylistRow[] }>;
}

export function AddToPlaylist({ slugId }: { slugId: string }) {
  const pathname = usePathname() ?? "/";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrivacy, setNewPrivacy] = useState<PlaylistPrivacyValue>("PRIVATE");

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  const listQuery = useQuery({
    queryKey: ["playlists", "me"],
    queryFn: fetchMyPlaylists,
    enabled: loggedIn && open,
  });

  const addMutation = useMutation({
    mutationFn: async (playlistId: string) => {
      const res = await apiFetch(
        `/v1/playlists/${encodeURIComponent(playlistId)}/items`,
        {
          method: "POST",
          body: JSON.stringify({ slugId }),
        },
      );
      if (!res.ok) throw new Error("add-item");
      return res.json() as Promise<{ ok: boolean; alreadyExists?: boolean }>;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setOpen(false);
    },
  });

  const createAndAddMutation = useMutation({
    mutationFn: async (payload: { title: string; privacy: PlaylistPrivacyValue }) => {
      const cr = await apiFetch("/v1/playlists", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!cr.ok) throw new Error("create");
      const { playlist } = (await cr.json()) as { playlist: { id: string } };
      const res = await apiFetch(
        `/v1/playlists/${encodeURIComponent(playlist.id)}/items`,
        {
          method: "POST",
          body: JSON.stringify({ slugId }),
        },
      );
      if (!res.ok) throw new Error("add-item");
    },
    onSuccess: async () => {
      setNewTitle("");
      setNewPrivacy("PRIVATE");
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
      >
        <ListPlus className="size-3.5" aria-hidden />
        Playlist
      </Link>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ListPlus className="size-3.5" aria-hidden />
        Playlist
      </Button>
      {open ? (
        <div
          className="absolute left-0 z-50 mt-1 w-[min(100vw-2rem,18rem)] rounded-lg border border-border bg-card p-3 text-sm shadow-lg"
          role="dialog"
          aria-label="Ajouter à une playlist"
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Ajouter à…
          </p>
          {listQuery.isPending ? (
            <p className="text-xs text-muted-foreground">Chargement…</p>
          ) : listQuery.isError ? (
            <p className="text-xs text-destructive">Liste indisponible.</p>
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {listQuery.data?.playlists.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
                    disabled={addMutation.isPending}
                    onClick={() => addMutation.mutate(p.id)}
                  >
                    <span className="truncate">{p.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.itemCount}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {addMutation.isError ? (
            <p className="mt-2 text-xs text-destructive">Échec de l’ajout.</p>
          ) : null}
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <p className="text-xs text-muted-foreground">Nouvelle liste</p>
            <select
              value={newPrivacy}
              onChange={(e) =>
                setNewPrivacy(e.target.value as PlaylistPrivacyValue)
              }
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs outline-none"
            >
              {PLAYLIST_PRIVACY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Titre"
                className="h-8 text-xs"
                maxLength={200}
              />
              <Button
                type="button"
                size="sm"
                className="shrink-0"
                disabled={
                  createAndAddMutation.isPending || !newTitle.trim()
                }
                onClick={() =>
                  createAndAddMutation.mutate({
                    title: newTitle.trim(),
                    privacy: newPrivacy,
                  })
                }
              >
                OK
              </Button>
            </div>
          </div>
          <button
            type="button"
            className="mt-2 w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setOpen(false)}
          >
            Fermer
          </button>
        </div>
      ) : null}
    </div>
  );
}
