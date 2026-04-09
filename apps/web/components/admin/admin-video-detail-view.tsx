"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchAdminVideoDetail,
  patchAdminVideoModeration,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const MODERATION_STATES = ["NONE", "LIMITED", "BLOCKED"] as const;

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function moderationLabel(value: string) {
  switch (value) {
    case "NONE":
      return "Normale";
    case "LIMITED":
      return "Limitée";
    case "BLOCKED":
      return "Bloquée";
    default:
      return value;
  }
}

function visibilityLabel(value: string) {
  switch (value) {
    case "PUBLIC":
      return "Publique";
    case "UNLISTED":
      return "Non répertoriée";
    case "PRIVATE":
      return "Privée";
    default:
      return value;
  }
}

function processingLabel(value: string) {
  switch (value) {
    case "DRAFT":
      return "Brouillon";
    case "UPLOADING":
      return "Envoi";
    case "UPLOADED":
      return "En attente";
    case "PROCESSING":
      return "Traitement";
    case "READY":
      return "Prête";
    case "FAILED":
      return "Échec";
    default:
      return value;
  }
}

function badgeTone(value: string) {
  switch (value) {
    case "BLOCKED":
    case "FAILED":
      return "border-destructive/20 bg-destructive/10 text-destructive";
    case "LIMITED":
    case "PROCESSING":
    case "UPLOADING":
    case "UPLOADED":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    default:
      return "border-border/70 bg-background/70 text-foreground";
  }
}

function homeVisibilityHint(video: {
  isPubliclyVisible: boolean;
  visibility: string;
  processingStatus: string;
  moderationState: string;
  publishedAt: string | null;
}) {
  if (video.isPubliclyVisible) {
    return "Cette vidéo est éligible à l’accueil.";
  }

  if (video.visibility !== "PUBLIC") {
    return "Elle n’apparaît pas dans l’accueil tant que sa visibilité n’est pas publique.";
  }

  if (video.processingStatus !== "READY") {
    return "Elle n’apparaît pas dans l’accueil tant que le traitement n’est pas terminé.";
  }

  if (video.moderationState === "BLOCKED") {
    return "Elle n’apparaît pas dans l’accueil tant qu’elle reste bloquée.";
  }

  if (!video.publishedAt) {
    return "Elle n’apparaît pas dans l’accueil tant qu’elle n’est pas publiée.";
  }

  return "Cette vidéo n’est pas encore éligible à l’accueil.";
}

function AdminVideoDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Skeleton className="aspect-video rounded-[1.5rem]" />
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-[1.5rem]" />
          <Skeleton className="h-48 rounded-[1.5rem]" />
        </div>
      </div>
    </div>
  );
}

export function AdminVideoDetailView({ videoId }: { videoId: string }) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const detailQuery = useQuery({
    queryKey: ["admin", "video", videoId],
    queryFn: () => fetchAdminVideoDetail(videoId),
  });

  const [moderationState, setModerationState] = useState<string>("NONE");

  useEffect(() => {
    setModerationState(detailQuery.data?.video.moderationState ?? "NONE");
  }, [detailQuery.data?.video.moderationState]);

  const mutation = useMutation({
    mutationFn: (nextState: string) =>
      patchAdminVideoModeration(videoId, {
        moderationState: nextState,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: async ({ video }) => {
      setNotes("");
      setModerationState(video.moderationState);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "video", videoId] }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "videos", "moderation"],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
        queryClient.invalidateQueries({
          queryKey: ["admin", "moderation-actions"],
        }),
        queryClient.invalidateQueries({ queryKey: ["admin", "stats"] }),
      ]);
    },
  });

  if (detailQuery.isPending) {
    return <AdminVideoDetailSkeleton />;
  }

  if (detailQuery.isError) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {detailQuery.error instanceof Error
          ? detailQuery.error.message
          : "Erreur de chargement"}
      </p>
    );
  }

  const { video } = detailQuery.data;
  const srcType = video.hlsUrl?.toLowerCase().includes(".m3u8")
    ? "application/x-mpegURL"
    : "video/mp4";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Link
              href="/admin/videos"
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Modération vidéos
            </Link>
            <span>/</span>
            <span>{video.title}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {video.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            @{video.channel.handle} · {video.channel.name}
            {video.channel.verified ? " · vérifiée" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {video.isPubliclyVisible ? (
            <Link
              href={video.publicWatchPath}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Voir sur le site
            </Link>
          ) : null}
          <Link
            href="/admin/reports"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Voir les signalements
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-border/70 bg-black">
            {video.hlsUrl ? (
              <video
                controls
                playsInline
                preload="metadata"
                poster={video.thumbnailUrl ?? undefined}
                className="h-full w-full bg-black object-contain"
              >
                <source src={video.hlsUrl} type={srcType} />
                Lecture impossible dans ce navigateur.
              </video>
            ) : video.thumbnailUrl ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/75">
                Aucun aperçu média disponible pour cette vidéo pour le moment.
              </div>
            )}
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <h2 className="text-lg font-semibold tracking-tight">Détails</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Statut traitement
                </p>
                <p className="mt-1 text-sm font-medium">
                  {processingLabel(video.processingStatus)}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Visibilité
                </p>
                <p className="mt-1 text-sm font-medium">
                  {visibilityLabel(video.visibility)}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Publication
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(video.publishedAt)}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Signalements
                </p>
                <p className="mt-1 text-sm font-medium">
                  {video.openReportsCount} ouverts · {video.totalReportsCount} total
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {homeVisibilityHint(video)}
            </p>

            {video.description ? (
              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {video.description}
              </p>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Aucune description renseignée.
              </p>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5">
            <h2 className="text-lg font-semibold tracking-tight">Modération</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeTone(
                  video.moderationState,
                )}`}
              >
                {moderationLabel(video.moderationState)}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeTone(
                  video.processingStatus,
                )}`}
              >
                {processingLabel(video.processingStatus)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {MODERATION_STATES.map((state) => {
                const active = moderationState === state;
                const disabled =
                  mutation.isPending || state === video.moderationState;

                return (
                  <Button
                    key={state}
                    type="button"
                    size="sm"
                    variant={
                      state === "BLOCKED"
                        ? active
                          ? "destructive"
                          : "outline"
                        : active
                          ? "default"
                          : "outline"
                    }
                    disabled={disabled}
                    onClick={() => {
                      setModerationState(state);
                      mutation.mutate(state);
                    }}
                  >
                    {state === "NONE"
                      ? "Approuver"
                      : state === "LIMITED"
                        ? "Limiter"
                        : "Bloquer"}
                  </Button>
                );
              })}
            </div>

            <Input
              placeholder="Note (optionnel)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="mt-3 h-9"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              La note est facultative et sera ajoutée seulement si tu déclenches une action.
            </p>

            {mutation.isError ? (
              <p className="mt-2 text-xs text-destructive">
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Modération impossible"}
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 text-sm">
            <h2 className="text-lg font-semibold tracking-tight">Repères</h2>
            <dl className="mt-4 space-y-3 text-muted-foreground">
              <div>
                <dt className="text-xs uppercase tracking-wide">Créée</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {formatDate(video.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Dernière mise à jour</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {formatDate(video.updatedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide">Engagement</dt>
                <dd className="mt-1 text-sm text-foreground">
                  {video.viewsCount} vues · {video.likesCount} likes
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
