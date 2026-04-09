"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { VideoCard } from "@/components/video/video-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import {
  PLAYLIST_PRIVACY_OPTIONS,
  playlistPrivacyLabel,
  type PlaylistPrivacyValue,
} from "@/lib/playlist-ui";
import type { VideoCardDto } from "@/lib/types/public";

type PlaylistPayload = {
  playlist: {
    id: string;
    title: string;
    description: string;
    privacy: string;
    isOwner: boolean;
    owner: { username: string; displayName: string };
    updatedAt: string;
  };
  items: VideoCardDto[];
};

async function fetchPlaylist(id: string): Promise<PlaylistPayload> {
  const res = await apiFetch(`/v1/playlists/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error("playlist");
  return res.json() as Promise<PlaylistPayload>;
}

function slugId(v: VideoCardDto) {
  return `${v.slug}-${v.id}`;
}

function PlaylistOwnerForm({
  playlistId,
  initial,
}: {
  playlistId: string;
  initial: { title: string; description: string; privacy: string };
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [privacy, setPrivacy] = useState<PlaylistPrivacyValue>(
    (initial.privacy as PlaylistPrivacyValue) ?? "PRIVATE",
  );

  useEffect(() => {
    setTitle(initial.title);
    setDescription(initial.description);
    setPrivacy((initial.privacy as PlaylistPrivacyValue) ?? "PRIVATE");
  }, [initial.title, initial.description, initial.privacy]);

  const [savedTick, setSavedTick] = useState(false);

  const patchMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/v1/playlists/${encodeURIComponent(playlistId)}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          privacy,
        }),
      });
      if (!res.ok) throw new Error("patch");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["playlists", playlistId] });
      await queryClient.invalidateQueries({ queryKey: ["playlists", "me"] });
      setSavedTick(true);
      window.setTimeout(() => setSavedTick(false), 2500);
    },
  });

  return (
    <section
      aria-labelledby="playlist-settings-heading"
      className="rounded-lg border border-border bg-card/30 p-4"
    >
      <h2 id="playlist-settings-heading" className="text-sm font-medium">
        Paramètres
      </h2>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || patchMutation.isPending) return;
          patchMutation.mutate();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="pl-edit-title">Titre</Label>
          <Input
            id="pl-edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pl-edit-desc">Description</Label>
          <textarea
            id="pl-edit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={8000}
            rows={4}
            className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pl-edit-privacy">Visibilité</Label>
          <select
            id="pl-edit-privacy"
            value={privacy}
            onChange={(e) =>
              setPrivacy(e.target.value as PlaylistPrivacyValue)
            }
            className="h-8 w-full max-w-md rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {PLAYLIST_PRIVACY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Privée : toi seul·e · Non répertoriée : lien direct · Publique : indexable
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={patchMutation.isPending}>
            {patchMutation.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {savedTick ? (
            <span className="text-xs text-muted-foreground self-center" aria-live="polite">
              Enregistré
            </span>
          ) : null}
          {patchMutation.isError ? (
            <span className="text-xs text-destructive self-center" role="alert">
              Erreur lors de l’enregistrement.
            </span>
          ) : null}
        </div>
      </form>
    </section>
  );
}

export function PlaylistDetailPage({ playlistId }: { playlistId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["playlists", playlistId],
    queryFn: () => fetchPlaylist(playlistId),
  });

  const removeMutation = useMutation({
    mutationFn: async (video: VideoCardDto) => {
      const res = await apiFetch(
        `/v1/playlists/${encodeURIComponent(playlistId)}/remove-item`,
        {
          method: "POST",
          body: JSON.stringify({ slugId: slugId(video) }),
        },
      );
      if (!res.ok) throw new Error("remove");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["playlists", playlistId] });
      await queryClient.invalidateQueries({ queryKey: ["playlists", "me"] });
    },
  });

  const deletePlaylist = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/v1/playlists/${encodeURIComponent(playlistId)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("delete-pl");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["playlists", "me"] });
      router.push("/playlists");
    },
  });

  if (query.isPending) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </AppShell>
    );
  }

  if (query.isError) {
    return (
      <AppShell>
        <div className="space-y-3">
          <p className="text-sm text-destructive">Playlist introuvable ou privée.</p>
          <Link href="/" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Accueil
          </Link>
        </div>
      </AppShell>
    );
  }

  const { playlist, items } = query.data;

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h1 className="text-lg font-semibold tracking-tight">{playlist.title}</h1>
              <p className="text-sm text-muted-foreground">
                Par {playlist.owner.displayName} (@{playlist.owner.username}) ·{" "}
                {playlistPrivacyLabel(playlist.privacy)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {playlist.isOwner ? (
                <>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={deletePlaylist.isPending}
                    onClick={() => {
                      if (window.confirm("Supprimer cette playlist ?")) {
                        deletePlaylist.mutate();
                      }
                    }}
                  >
                    Supprimer
                  </Button>
                  <Link
                    href="/playlists"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Mes playlists
                  </Link>
                </>
              ) : (
                <Link
                  href="/"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline self-center"
                >
                  Accueil
                </Link>
              )}
            </div>
          </div>
          {playlist.description?.trim() ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {playlist.description}
            </p>
          ) : null}
        </header>

        {playlist.isOwner ? (
          <PlaylistOwnerForm
            playlistId={playlistId}
            initial={{
              title: playlist.title,
              description: playlist.description,
              privacy: playlist.privacy,
            }}
          />
        ) : null}

        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            Aucune vidéo dans cette playlist.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((video) => (
              <div key={video.id} className="relative min-w-0">
                <VideoCard video={video} />
                {playlist.isOwner ? (
                  <div className="absolute left-2 top-2 z-10">
                    <Button
                      type="button"
                      size="xs"
                      variant="secondary"
                      className="shadow-sm"
                      disabled={removeMutation.isPending}
                      onClick={() => removeMutation.mutate(video)}
                    >
                      Retirer
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
