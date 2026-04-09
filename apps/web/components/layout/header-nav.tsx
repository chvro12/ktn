"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { fetchAuthMe } from "@/lib/auth-me";

function LibraryMenu() {
  const linkClass =
    "block rounded-xl px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted";
  return (
    <details className="group relative">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-1 rounded-full border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-border/70 hover:bg-background hover:text-foreground",
          "marker:content-none [&::-webkit-details-marker]:hidden",
        )}
      >
        Bibliothèque
        <ChevronDown
          className="size-3.5 shrink-0 opacity-60 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div
        className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-2xl border border-border/80 bg-popover/95 p-2 text-popover-foreground shadow-[0_25px_60px_-35px_rgba(23,23,23,0.4)] backdrop-blur"
        role="menu"
      >
        <Link href="/watch-later" className={linkClass} role="menuitem">
          À regarder plus tard
        </Link>
        <Link href="/history" className={linkClass} role="menuitem">
          Historique
        </Link>
        <Link href="/playlists" className={linkClass} role="menuitem">
          Playlists
        </Link>
      </div>
    </details>
  );
}

export function HeaderNav() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchAuthMe,
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
        className="ml-auto flex shrink-0 items-center justify-end gap-2"
        aria-busy="true"
        aria-label="Chargement du compte"
      >
        <Skeleton className="hidden h-8 w-28 sm:block" />
        <Skeleton className="h-8 w-20 rounded-md" />
        <Skeleton className="hidden h-8 w-24 rounded-md sm:block" />
      </nav>
    );
  }

  return (
    <nav className="ml-auto flex shrink-0 items-center justify-end gap-1 sm:gap-2">
      {loggedIn ? (
        <>
          <Link
            href="/onboarding/channel"
            className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground md:inline"
          >
            Créer une chaîne
          </Link>
          {sessionUser.role === "ADMIN" ? (
            <Link
              href="/admin"
              className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-background hover:text-foreground sm:inline-flex"
            >
              Admin
            </Link>
          ) : null}
          <Link
            href="/studio"
            className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-2 text-xs text-foreground shadow-[0_14px_35px_-30px_rgba(23,23,23,0.4)] transition hover:bg-background sm:text-sm"
          >
            Studio
          </Link>
          <div className="hidden sm:block">
            <LibraryMenu />
          </div>
          <span
            className="hidden max-w-[140px] truncate rounded-full border border-border/70 bg-background/65 px-3 py-2 text-sm text-muted-foreground lg:inline"
            title={sessionUser.displayName}
          >
            {sessionUser.displayName}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Déconnexion
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full px-2 sm:hidden"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
            aria-label="Déconnexion"
          >
            Sortir
          </Button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "rounded-full px-3 text-xs sm:text-sm",
            )}
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "rounded-full px-3 text-xs shadow-[0_16px_40px_-30px_rgba(0,0,0,0.45)] sm:text-sm",
            )}
          >
            Inscription
          </Link>
        </>
      )}
    </nav>
  );
}
