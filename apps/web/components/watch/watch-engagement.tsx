"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { Bookmark, ThumbsUp } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import type { VideoLibraryStateDto } from "@/lib/library-api";
import { fetchVideoLibraryState } from "@/lib/library-api";
import { AddToPlaylist } from "@/components/playlists/add-to-playlist";
import { formatPublishedShort } from "@/lib/format-media";
import type { CommentsListResponse } from "@/lib/types/comments";

type MeResponse =
  | { user: { id: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

async function fetchComments(slugId: string): Promise<CommentsListResponse> {
  const res = await apiFetch(
    `/v1/public/videos/${encodeURIComponent(slugId)}/comments`,
  );
  if (!res.ok) throw new Error("comments");
  return res.json() as Promise<CommentsListResponse>;
}

async function fetchLikeStatus(slugId: string): Promise<{
  liked: boolean;
  likesCount: number;
}> {
  const res = await apiFetch(
    `/v1/engagement/videos/${encodeURIComponent(slugId)}/like-status`,
  );
  if (!res.ok) throw new Error("like-status");
  return res.json() as Promise<{ liked: boolean; likesCount: number }>;
}

export function WatchEngagement({
  slugId,
  initialLikesCount,
}: {
  slugId: string;
  initialLikesCount: number;
}) {
  const queryClient = useQueryClient();
  const pathname = usePathname() ?? "/";
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [body, setBody] = useState("");

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  const commentsQuery = useQuery({
    queryKey: ["comments", slugId],
    queryFn: () => fetchComments(slugId),
  });

  const likeStatusQuery = useQuery({
    queryKey: ["like-status", slugId],
    queryFn: () => fetchLikeStatus(slugId),
    enabled: loggedIn,
  });

  const videoStateQuery = useQuery({
    queryKey: ["library", "video-state", slugId],
    queryFn: () => fetchVideoLibraryState(slugId),
    enabled: loggedIn,
  });

  const displayLikes = useMemo(() => {
    if (likeStatusQuery.data) return likeStatusQuery.data.likesCount;
    return initialLikesCount;
  }, [likeStatusQuery.data, initialLikesCount]);

  const liked = likeStatusQuery.data?.liked ?? false;

  const toggleWatchLater = useMutation({
    mutationFn: async () => {
      const on = videoStateQuery.data?.inWatchLater ?? false;
      if (on) {
        const res = await apiFetch(
          `/v1/library/watch-later/${encodeURIComponent(slugId)}`,
          { method: "DELETE" },
        );
        if (!res.ok) throw new Error("watch-later-remove");
        return res.json() as Promise<{ inWatchLater: boolean; videoId: string }>;
      }
      const res = await apiFetch(
        `/v1/library/watch-later/${encodeURIComponent(slugId)}`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("watch-later-add");
      return res.json() as Promise<{ inWatchLater: boolean; videoId: string }>;
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(
        ["library", "video-state", slugId],
        (prev) => {
          const p = prev as VideoLibraryStateDto | undefined;
          return {
            inWatchLater: data.inWatchLater,
            videoId: data.videoId,
            progressSec: p?.progressSec ?? 0,
            completed: p?.completed ?? false,
          } satisfies VideoLibraryStateDto;
        },
      );
      await queryClient.invalidateQueries({
        queryKey: ["library", "/v1/library/watch-later"],
      });
    },
  });

  const toggleLike = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/v1/engagement/videos/${encodeURIComponent(slugId)}/like`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("like");
      return res.json() as Promise<{ liked: boolean; likesCount: number }>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["like-status", slugId], data);
    },
  });

  const postComment = useMutation({
    mutationFn: async (payload: { body: string; parentCommentId?: string }) => {
      const res = await apiFetch(
        `/v1/engagement/videos/${encodeURIComponent(slugId)}/comments`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(err?.error?.message ?? "Envoi impossible");
      }
    },
    onSuccess: () => {
      setBody("");
      setReplyToId(null);
      void queryClient.invalidateQueries({ queryKey: ["comments", slugId] });
    },
  });

  return (
    <div className="space-y-8">
      <div className="rounded-[1.75rem] border border-border/70 bg-card/75 p-4 shadow-[0_18px_55px_-45px_rgba(23,23,23,0.32)] sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={liked ? "default" : "outline"}
          size="sm"
          disabled={!loggedIn || toggleLike.isPending}
          onClick={() => loggedIn && toggleLike.mutate()}
          className="h-10 gap-1.5 rounded-full"
          aria-pressed={liked}
        >
          <ThumbsUp className="size-3.5" aria-hidden />
          J’aime · {displayLikes}
        </Button>
        {loggedIn ? (
          <Button
            type="button"
            variant={
              videoStateQuery.data?.inWatchLater ? "secondary" : "outline"
            }
            size="sm"
            disabled={
              videoStateQuery.isPending || toggleWatchLater.isPending
            }
            onClick={() => toggleWatchLater.mutate()}
            className="h-10 gap-1.5 rounded-full"
            aria-pressed={videoStateQuery.data?.inWatchLater ?? false}
          >
            <Bookmark className="size-3.5" aria-hidden />
            {videoStateQuery.data?.inWatchLater ? "Dans Plus tard" : "Plus tard"}
          </Button>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-10 gap-1.5 rounded-full",
            )}
          >
            <Bookmark className="size-3.5" aria-hidden />
            Plus tard
          </Link>
        )}
        <AddToPlaylist slugId={slugId} />
        {!loggedIn ? (
          <p className="text-xs text-muted-foreground">
            <Link
              href={`/login?next=${encodeURIComponent(pathname)}`}
              className="underline-offset-4 hover:underline"
            >
              Connecte-toi
            </Link>{" "}
            pour liker, commenter, « Plus tard » et playlists.
          </p>
        ) : null}
        </div>
      </div>
      {toggleWatchLater.isError ? (
        <p className="text-xs text-destructive" role="alert">
          Impossible de mettre à jour « Plus tard ».
        </p>
      ) : null}

      <section
        aria-labelledby="comments-heading"
        className="space-y-4 rounded-[1.75rem] border border-border/70 bg-card/75 p-5 shadow-[0_18px_55px_-45px_rgba(23,23,23,0.32)]"
      >
        <div>
          <h2 id="comments-heading" className="text-lg font-semibold tracking-tight">
            Commentaires
            {commentsQuery.data?.totalTopLevel != null
              ? ` (${commentsQuery.data.totalTopLevel})`
              : null}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Réactions, réponses et échanges autour de cette vidéo.
          </p>
        </div>

        {loggedIn ? (
          <form
            className="space-y-3 rounded-[1.25rem] border border-border/70 bg-background/65 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              const t = body.trim();
              if (!t || postComment.isPending) return;
              postComment.mutate({
                body: t,
                parentCommentId: replyToId ?? undefined,
              });
            }}
          >
            {replyToId ? (
              <p className="text-xs text-muted-foreground">
                Réponse à un commentaire ·{" "}
                <button
                  type="button"
                  className="text-foreground underline-offset-4 hover:underline"
                  onClick={() => setReplyToId(null)}
                >
                  Annuler
                </button>
              </p>
            ) : null}
            <Label htmlFor="comment-body" className="sr-only">
              Ton commentaire
            </Label>
            <textarea
              id="comment-body"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Ajouter un commentaire…"
              className="w-full resize-y rounded-2xl border border-input/80 bg-background/80 px-3.5 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
              maxLength={8000}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                size="sm"
                className="rounded-full"
                disabled={postComment.isPending}
              >
                {postComment.isPending ? "Envoi…" : "Publier"}
              </Button>
            </div>
            {postComment.isError ? (
              <p className="text-xs text-destructive" role="alert">
                {postComment.error instanceof Error
                  ? postComment.error.message
                  : "Erreur"}
              </p>
            ) : null}
          </form>
        ) : null}

        {commentsQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : commentsQuery.isError ? (
          <p className="text-sm text-destructive">Impossible de charger les commentaires.</p>
        ) : (
          <ul className="space-y-6">
            {commentsQuery.data?.comments.map((c) => (
              <li key={c.id} className="space-y-3 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
                <div className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {c.user.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                      <span className="text-sm font-medium">
                        {c.user.displayName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{c.user.username} · {formatPublishedShort(c.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {c.body}
                    </p>
                    {loggedIn ? (
                      <button
                        type="button"
                        className="mt-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                        onClick={() => setReplyToId(c.id)}
                      >
                        Répondre
                      </button>
                    ) : null}
                  </div>
                </div>
                {c.replies.length > 0 ? (
                  <ul className="ml-11 space-y-3 border-l border-border pl-4">
                    {c.replies.map((r) => (
                      <li key={r.id} className="flex gap-2 rounded-2xl bg-muted/25 px-3 py-3">
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.65rem] font-medium text-muted-foreground">
                          {r.user.displayName.slice(0, 1).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-xs font-medium">
                              {r.user.displayName}
                            </span>
                            <span className="text-[0.7rem] text-muted-foreground">
                              {formatPublishedShort(r.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{r.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
