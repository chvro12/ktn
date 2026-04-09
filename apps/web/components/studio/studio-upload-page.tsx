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
  type PlaylistPrivacyValue,
} from "@/lib/playlist-ui";

type MeResponse =
  | { user: { displayName: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

/** Réutilise les mêmes valeurs que les vidéos (PUBLIC / UNLISTED / PRIVATE). */
const VISIBILITY_OPTIONS = PLAYLIST_PRIVACY_OPTIONS;

export function StudioUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<PlaylistPrivacyValue>("UNLISTED");
  const [file, setFile] = useState<File | null>(null);
  const [stepMsg, setStepMsg] = useState<string | null>(null);

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  useEffect(() => {
    if (meQuery.isPending) return;
    if (!loggedIn) router.replace("/login?next=/studio/upload");
  }, [meQuery.isPending, loggedIn, router]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const t = title.trim();
      if (!t || !file) throw new Error("incomplete");

      setStepMsg("Création du brouillon…");
      const cr = await apiFetch("/v1/studio/videos", {
        method: "POST",
        body: JSON.stringify({
          title: t,
          description: description.trim() || undefined,
          visibility,
        }),
      });
      if (!cr.ok) {
        const err = (await cr.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(err?.error?.message ?? "Création impossible");
      }
      const { video } = (await cr.json()) as { video: { id: string } };

      setStepMsg("Envoi du fichier…");
      const fd = new FormData();
      fd.append("file", file);
      const up = await apiFetch(
        `/v1/studio/videos/${encodeURIComponent(video.id)}/upload`,
        { method: "POST", body: fd },
      );
      if (!up.ok) {
        const err = (await up.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(err?.error?.message ?? "Upload impossible");
      }

      return video.id;
    },
    onSuccess: async (videoId) => {
      setStepMsg(
        "Fichier bien reçu. Le traitement peut prendre quelques minutes avant la publication.",
      );
      await queryClient.invalidateQueries({ queryKey: ["studio", "videos"] });
      router.push(`/studio?_new=${encodeURIComponent(videoId)}`);
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
      <div className="mx-auto max-w-xl space-y-8">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Importer une vidéo</h1>
          <p className="text-sm text-muted-foreground">
            mp4, mov, webm — puis publication depuis le studio une fois prête.
          </p>
          <Link
            href="/studio"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Retour au studio
          </Link>
        </div>

        <form
          className="space-y-4 rounded-lg border border-border bg-card/40 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (uploadMutation.isPending) return;
            uploadMutation.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="uv-title">Titre</Label>
            <Input
              id="uv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uv-desc">Description</Label>
            <textarea
              id="uv-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={8000}
              rows={3}
              className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uv-vis">Visibilité (après mise en ligne)</Label>
            <select
              id="uv-vis"
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as PlaylistPrivacyValue)
              }
              className="h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uv-file">Fichier vidéo</Label>
            <Input
              id="uv-file"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,.mp4,.mov,.webm"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type="submit"
            disabled={uploadMutation.isPending || !title.trim() || !file}
          >
            {uploadMutation.isPending ? "Envoi…" : "Créer et envoyer"}
          </Button>
          {stepMsg ? (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {stepMsg}
            </p>
          ) : null}
          {uploadMutation.isError ? (
            <p className="text-xs text-destructive" role="alert">
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : "Erreur"}
            </p>
          ) : null}
        </form>
      </div>
    </AppShell>
  );
}
