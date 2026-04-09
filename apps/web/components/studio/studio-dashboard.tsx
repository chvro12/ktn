"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type MeResponse =
  | { user: { displayName: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

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

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  UPLOADING: "Envoi…",
  UPLOADED: "File d’attente",
  PROCESSING: "Traitement…",
  READY: "Prête",
  FAILED: "Échec",
};

export function StudioDashboard() {
  const router = useRouter();

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  const listQuery = useQuery({
    queryKey: ["studio", "videos"],
    queryFn: fetchStudioList,
    enabled: loggedIn && !meQuery.isPending,
  });

  useEffect(() => {
    if (meQuery.isPending) return;
    if (!loggedIn) router.replace("/login?next=/studio");
  }, [meQuery.isPending, loggedIn, router]);

  if (meQuery.isPending || !loggedIn) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Chargement…</p>
      </AppShell>
    );
  }

  const noChannel =
    listQuery.data != null &&
    listQuery.data.channelId == null &&
    !listQuery.isError;

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight">Studio</h1>
            <p className="text-sm text-muted-foreground">
              Gère tes vidéos : import, traitement et publication.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/studio/upload"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Importer une vidéo
            </Link>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Accueil
            </Link>
          </div>
        </div>

        {listQuery.isError ? (
          <p className="text-sm text-destructive">
            Impossible de charger le studio.
          </p>
        ) : listQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Chargement des vidéos…</p>
        ) : noChannel ? (
          <div className="rounded-lg border border-border bg-card/40 p-6 text-sm">
            <p className="font-medium">Chaîne requise</p>
            <p className="mt-2 text-muted-foreground">
              Crée une chaîne pour accéder au studio.
            </p>
            <Link
              href="/onboarding/channel"
              className={cn(buttonVariants({ size: "sm" }), "mt-4 inline-flex")}
            >
              Créer une chaîne
            </Link>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {listQuery.data?.videos.map((v) => (
                <li key={v.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card/30 px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium">{v.title}</span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {STATUS_LABEL[v.processingStatus] ?? v.processingStatus}{" "}
                        · {v.visibility}
                        {v.publishedAt ? " · en ligne" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {v.processingStatus === "READY" && !v.publishedAt ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            const res = await apiFetch(
                              `/v1/studio/videos/${encodeURIComponent(v.id)}/publish`,
                              { method: "POST" },
                            );
                            if (!res.ok) {
                              const body = (await res.json().catch(() => null)) as {
                                error?: { message?: string };
                              } | null;
                              window.alert(
                                body?.error?.message ?? "Publication impossible",
                              );
                              return;
                            }
                            void listQuery.refetch();
                          }}
                        >
                          Mettre en ligne
                        </Button>
                      ) : null}
                      {v.processingStatus === "READY" && v.publishedAt ? (
                        <Link
                          href={`/video/${v.slug}-${v.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                          )}
                        >
                          Voir
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {listQuery.data?.videos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">
                Aucune vidéo.{" "}
                <Link href="/studio/upload" className="underline-offset-4 hover:underline">
                  Importer un fichier
                </Link>
                .
              </p>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
