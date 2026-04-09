"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CircleCheckBig,
  Clock3,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type MeResponse =
  | { user: { displayName: string } }
  | { error: { code: string; message: string } };

type StudioVideoRow = {
  id: string;
  slug: string;
  title: string;
  visibility: string;
  processingStatus: string;
  publishedAt: string | null;
  updatedAt: string;
  hlsUrl: string | null;
};

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

async function fetchStudioList(): Promise<{
  channelId: string | null;
  videos: StudioVideoRow[];
}> {
  const res = await apiFetch("/v1/studio/videos");
  if (!res.ok) throw new Error("studio-list");
  return res.json() as Promise<{
    channelId: string | null;
    videos: StudioVideoRow[];
  }>;
}

const STATUS_META: Record<string, { label: string; tone: string; hint: string }> = {
  DRAFT: {
    label: "Brouillon",
    tone: "border-border/70 bg-background/70 text-muted-foreground",
    hint: "Métadonnées prêtes, fichier pas encore envoyé.",
  },
  UPLOADING: {
    label: "Envoi",
    tone: "border-foreground/10 bg-foreground/5 text-foreground",
    hint: "Le fichier arrive sur le serveur.",
  },
  UPLOADED: {
    label: "En attente",
    tone: "border-border/80 bg-muted/30 text-foreground",
    hint: "Transcodage automatique après l’envoi.",
  },
  PROCESSING: {
    label: "Traitement",
    tone: "border-border/80 bg-muted/30 text-foreground",
    hint: "Encodage, miniature et préparation du player.",
  },
  READY: {
    label: "Prête",
    tone: "border-border/80 bg-muted/30 text-foreground",
    hint: "Les vidéos publiques apparaissent sur l’accueil sans action supplémentaire.",
  },
  FAILED: {
    label: "Échec",
    tone: "border-destructive/20 bg-destructive/5 text-destructive",
    hint: "Le fichier devra être renvoyé.",
  },
};

function formatVisibility(value: string): string {
  if (value === "PUBLIC") return "Publique";
  if (value === "UNLISTED") return "Non répertoriée";
  if (value === "PRIVATE") return "Privée";
  return value;
}

function feedStatusLabel(video: StudioVideoRow): string {
  if (video.visibility === "PUBLIC") return "Sur l’accueil";
  if (video.visibility === "UNLISTED") return "Pas dans le fil (lien seulement)";
  return "Privée (pas sur l’accueil)";
}

function StudioDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36 rounded-full" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-24 rounded-full" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-[1.5rem]" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-[1.5rem]" />
        ))}
      </div>
    </div>
  );
}

export function StudioDashboard({ newVideoId }: { newVideoId?: string }) {
  const router = useRouter();

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  const listQuery = useQuery({
    queryKey: ["studio", "videos"],
    queryFn: fetchStudioList,
    enabled: loggedIn && !meQuery.isPending,
    refetchInterval: (query) => {
      const rows = query.state.data?.videos ?? [];
      return rows.some((row) =>
        ["UPLOADING", "UPLOADED", "PROCESSING"].includes(row.processingStatus),
      )
        ? 4000
        : false;
    },
  });

  useEffect(() => {
    if (meQuery.isPending) return;
    if (!loggedIn) router.replace("/login?next=/studio");
  }, [meQuery.isPending, loggedIn, router]);

  const uploadedVideo = listQuery.data?.videos.find((video) => video.id === newVideoId);

  const stats = useMemo(() => {
    const videos = listQuery.data?.videos ?? [];
    return {
      total: videos.length,
      processing: videos.filter((video) =>
        ["UPLOADING", "UPLOADED", "PROCESSING"].includes(video.processingStatus),
      ).length,
      onHome: videos.filter(
        (video) =>
          video.processingStatus === "READY" &&
          video.visibility === "PUBLIC" &&
          video.publishedAt,
      ).length,
    };
  }, [listQuery.data?.videos]);

  if (meQuery.isPending || !loggedIn) {
    return (
      <AppShell>
        <StudioDashboardSkeleton />
      </AppShell>
    );
  }

  const noChannel =
    listQuery.data != null &&
    listQuery.data.channelId == null &&
    !listQuery.isError;

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Studio
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Upload et traitement : les vidéos publiques vont sur l’accueil dès qu’elles
              sont prêtes, sans validation manuelle.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/studio/upload"
              className={cn(buttonVariants({ size: "sm" }), "rounded-full")}
            >
              Importer une vidéo
            </Link>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full",
              )}
            >
              Accueil
            </Link>
          </div>
        </div>

        {uploadedVideo ? (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-500/25 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
            <CircleCheckBig className="mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">Vidéo envoyée</p>
              <p className="mt-1">
                {uploadedVideo.title} est maintenant dans le studio.
                {["UPLOADING", "UPLOADED", "PROCESSING"].includes(
                  uploadedVideo.processingStatus,
                )
                  ? " Le traitement continue automatiquement."
                  : ""}
              </p>
            </div>
          </div>
        ) : null}

        {listQuery.isPending ? (
          <StudioDashboardSkeleton />
        ) : listQuery.isError ? (
          <div className="rounded-[1.75rem] border border-destructive/20 bg-destructive/5 p-5">
            <div className="flex items-start gap-3">
              <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">
                  Impossible de charger le studio
                </p>
                <p className="mt-1 text-sm text-destructive/80">
                  Réessaie pour récupérer la liste des vidéos et leurs statuts.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full"
                  onClick={() => void listQuery.refetch()}
                >
                  <RefreshCw className="size-3.5" aria-hidden />
                  Réessayer
                </Button>
              </div>
            </div>
          </div>
        ) : noChannel ? (
          <div className="rounded-[1.75rem] border border-border/80 bg-card p-6">
            <p className="text-lg font-semibold tracking-tight">Chaîne requise</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Crée une chaîne pour commencer à publier et suivre tes vidéos depuis
              le studio.
            </p>
            <Link
              href="/onboarding/channel"
              className={cn(
                buttonVariants({ size: "sm" }),
                "mt-4 inline-flex rounded-full",
              )}
            >
              Créer une chaîne
            </Link>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-border/80 bg-card p-4">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {stats.total}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  vidéo{stats.total > 1 ? "s" : ""} dans ton studio
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/80 bg-card p-4">
                <p className="text-xs text-muted-foreground">En cours</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {stats.processing}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  import{stats.processing > 1 ? "s" : ""} ou traitement{stats.processing > 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-border/80 bg-card p-4">
                <p className="text-xs text-muted-foreground">Sur l’accueil</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {stats.onHome}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  publique{stats.onHome > 1 ? "s" : ""} et prête{stats.onHome > 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {listQuery.data?.videos.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-border/80 bg-card px-6 py-12 text-center">
                <p className="text-lg font-semibold tracking-tight">
                  Aucune vidéo pour l’instant
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Commence par importer un premier fichier. Le studio suivra
                  ensuite l’envoi et le traitement automatiquement.
                </p>
                <Link
                  href="/studio/upload"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "mt-5 inline-flex rounded-full",
                  )}
                >
                  Importer un fichier
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {listQuery.data?.videos.map((video) => {
                  const meta =
                    STATUS_META[video.processingStatus] ?? STATUS_META.DRAFT;

                  return (
                    <li key={video.id}>
                      <div className="rounded-[1.5rem] border border-border/80 bg-card p-4 sm:p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                                {video.title}
                              </h2>
                              <span
                                className={cn(
                                  "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em]",
                                  meta.tone,
                                )}
                              >
                                {meta.label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {meta.hint}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                                {formatVisibility(video.visibility)}
                              </span>
                              {video.processingStatus === "READY" ? (
                                <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                                  {feedStatusLabel(video)}
                                </span>
                              ) : null}
                              {["UPLOADING", "UPLOADED", "PROCESSING"].includes(
                                video.processingStatus,
                              ) ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
                                  <Clock3 className="size-3" aria-hidden />
                                  Actualisation auto active
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {video.processingStatus === "READY" ? (
                              <Link
                                href={`/video/${video.slug}-${video.id}`}
                                className={cn(
                                  buttonVariants({ variant: "outline", size: "sm" }),
                                  "rounded-full",
                                )}
                              >
                                Voir la vidéo
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
