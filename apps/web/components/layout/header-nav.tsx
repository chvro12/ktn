"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

type MeResponse =
  | { user: { displayName: string; email: string; role: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

export function HeaderNav() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
  });

  const sessionUser =
    meQuery.data && "user" in meQuery.data ? meQuery.data.user : null;
  const loggedIn = sessionUser !== null;

  const logout = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/v1/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error("logout failed");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      await queryClient.invalidateQueries({ queryKey: ["channel", "me"] });
      router.refresh();
    },
  });

  if (meQuery.isPending) {
    return (
      <nav
        className="flex flex-1 items-center justify-end gap-2 text-sm"
        aria-busy="true"
        aria-label="Chargement du compte"
      >
        <Skeleton className="hidden h-8 w-32 sm:block" />
        <Skeleton className="h-9 w-24 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </nav>
    );
  }

  return (
    <nav className="flex flex-1 items-center justify-end gap-2 text-sm">
      <Link
        href="/onboarding/channel"
        className="hidden text-muted-foreground hover:text-foreground sm:inline"
      >
        Créer une chaîne
      </Link>
      {loggedIn ? (
        <>
          <Link
            href="/studio"
            className="hidden text-muted-foreground hover:text-foreground sm:inline"
          >
            Studio
          </Link>
          <Link
            href="/watch-later"
            className="text-muted-foreground hover:text-foreground"
          >
            Plus tard
          </Link>
          <Link
            href="/history"
            className="text-muted-foreground hover:text-foreground"
          >
            Historique
          </Link>
          <Link
            href="/playlists"
            className="text-muted-foreground hover:text-foreground"
          >
            Playlists
          </Link>
          <span className="hidden max-w-[140px] truncate text-muted-foreground sm:inline">
            {sessionUser.displayName}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Déconnexion
          </Button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ variant: "default", size: "sm" }))}
          >
            Inscription
          </Link>
        </>
      )}
    </nav>
  );
}
