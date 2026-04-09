"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchAdminVideosModeration,
  patchAdminVideoModeration,
  type AdminVideoModRow,
} from "@/lib/admin-api";

const MOD_STATES = ["NONE", "LIMITED", "BLOCKED"] as const;

function modLabel(s: string) {
  switch (s) {
    case "NONE":
      return "Normale";
    case "LIMITED":
      return "Limitée";
    case "BLOCKED":
      return "Bloquée (hors ligne)";
    default:
      return s;
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function isPubliclyVisible(video: AdminVideoModRow) {
  return (
    video.processingStatus === "READY" &&
    video.visibility === "PUBLIC" &&
    video.moderationState !== "BLOCKED" &&
    video.publishedAt != null
  );
}

function VideoModRow({ video }: { video: AdminVideoModRow }) {
  const queryClient = useQueryClient();
  const [moderationState, setModerationState] = useState(video.moderationState);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setModerationState(video.moderationState);
  }, [video.id, video.moderationState]);

  const dirty =
    moderationState !== video.moderationState || notes.trim().length > 0;

  const mutation = useMutation({
    mutationFn: (nextState: string) =>
      patchAdminVideoModeration(video.id, {
        moderationState: nextState,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: () => {
      setNotes("");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "videos", "moderation"],
      });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "moderation-actions"],
      });
    },
  });

  const submitState = (nextState: string) => {
    setModerationState(nextState);
    mutation.mutate(nextState);
  };

  return (
    <tr className="border-b border-border/60 align-top last:border-0">
      <td className="px-3 py-3">
        <div className="font-medium">{video.title}</div>
        <div className="text-xs text-muted-foreground">
          @{video.channel.handle} · {video.channel.name}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <Link
            href={video.watchPath}
            className="text-primary underline-offset-4 hover:underline"
          >
            Ouvrir en admin
          </Link>
          {isPubliclyVisible(video) ? (
            <Link
              href={`/video/${video.slug}-${video.id}`}
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Voir sur le site
            </Link>
          ) : null}
        </div>
      </td>
      <td className="hidden px-3 py-3 text-xs text-muted-foreground sm:table-cell">
        <div>{video.processingStatus}</div>
        <div className="mt-0.5">{video.visibility}</div>
        <div className="mt-0.5">Pub. {formatDate(video.publishedAt)}</div>
      </td>
      <td className="px-3 py-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {MOD_STATES.map((state) => {
            const active = moderationState === state;
            const disabled =
              mutation.isPending ||
              (state === video.moderationState && notes.trim().length === 0);

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
                onClick={() => submitState(state)}
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
        <p className="mb-2 text-xs text-muted-foreground">
          État actuel : {modLabel(moderationState)}.
        </p>
        <p className="mb-2 text-[0.65rem] leading-snug text-muted-foreground">
          « Bloquer » retire la vidéo du catalogue public. « Approuver » remet
          l’état normal.
        </p>
        <Input
          placeholder="Note (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mb-2 h-8 max-w-[14rem] text-xs"
        />
        {dirty ? (
          <p className="text-xs text-muted-foreground">
            La note sera ajoutée à la prochaine action.
          </p>
        ) : null}
        {mutation.isError ? (
          <p className="mt-1 max-w-[12rem] text-xs text-destructive">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Erreur"}
          </p>
        ) : null}
      </td>
    </tr>
  );
}

export function AdminVideosModerationTable() {
  const q = useInfiniteQuery({
    queryKey: ["admin", "videos", "moderation"],
    queryFn: ({ pageParam }) =>
      fetchAdminVideosModeration(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const rows = useMemo(
    () => q.data?.pages.flatMap((p) => p.items) ?? [],
    [q.data?.pages],
  );

  if (q.isPending) {
    return <p className="text-sm text-muted-foreground">Chargement…</p>;
  }

  if (q.isError) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {q.error instanceof Error ? q.error.message : "Erreur"}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
        Aucune vidéo.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Vidéo</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">
                Technique
              </th>
              <th className="px-3 py-2 font-medium">Modération</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <VideoModRow key={v.id} video={v} />
            ))}
          </tbody>
        </table>
      </div>
      {q.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={q.isFetchingNextPage}
          onClick={() => void q.fetchNextPage()}
        >
          {q.isFetchingNextPage ? "Chargement…" : "Charger plus"}
        </Button>
      ) : null}
    </div>
  );
}
