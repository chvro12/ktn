"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { VideoGrid } from "@/components/video/video-grid";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { FeedResponse } from "@/lib/types/public";

type MeResponse =
  | { user: { displayName: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

async function fetchLibraryPage(
  path: "/v1/library/watch-later" | "/v1/library/history",
  cursor?: string,
): Promise<FeedResponse> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await apiFetch(`${path}${q}`);
  if (!res.ok) throw new Error("library");
  return res.json() as Promise<FeedResponse>;
}

export function UserLibraryPage({
  apiPath,
  title,
  description,
  loginNextPath,
  emptyMessage,
}: {
  apiPath: "/v1/library/watch-later" | "/v1/library/history";
  title: string;
  description: string;
  loginNextPath: string;
  emptyMessage: string;
}) {
  const router = useRouter();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
  });

  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  useEffect(() => {
    if (meQuery.isPending) return;
    if (!loggedIn) {
      router.replace(`/login?next=${encodeURIComponent(loginNextPath)}`);
    }
  }, [meQuery.isPending, loggedIn, loginNextPath, router]);

  const listQuery = useInfiniteQuery({
    queryKey: ["library", apiPath],
    queryFn: ({ pageParam }) => fetchLibraryPage(apiPath, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: loggedIn && !meQuery.isPending,
  });

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [listQuery.data?.pages],
  );

  if (meQuery.isPending || !loggedIn) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          <Link
            href="/"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Accueil
          </Link>
        </div>
        {listQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Chargement des vidéos…</p>
        ) : listQuery.isError ? (
          <p className="text-sm text-destructive">
            Impossible de charger la liste.
          </p>
        ) : (
          <>
            <VideoGrid items={items} emptyMessage={emptyMessage} />
            {listQuery.hasNextPage ? (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={listQuery.isFetchingNextPage}
                  onClick={() => listQuery.fetchNextPage()}
                >
                  {listQuery.isFetchingNextPage ? "Chargement…" : "Voir plus"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
