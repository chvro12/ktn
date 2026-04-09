"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAuthMe } from "@/lib/auth-me";
import { isAdminRole } from "@/lib/roles";
import { cn } from "@/lib/utils";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
  }, [queryClient]);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchAuthMe,
    staleTime: 0,
    refetchOnMount: "always",
  });

  if (meQuery.isPending) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  const user =
    meQuery.data && "user" in meQuery.data ? meQuery.data.user : null;

  if (!user) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg font-semibold">Connexion requise</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Connecte-toi avec un compte administrateur pour accéder à cette zone.
        </p>
        <Link href="/login?next=/admin" className={cn(buttonVariants())}>
          Se connecter
        </Link>
      </div>
    );
  }

  if (!isAdminRole(user.role)) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-lg font-semibold">Accès refusé</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Ton compte n’a pas le rôle administrateur en base. Si tu viens de te
          promouvoir (script ou SQL), recharge la page ou déconnecte-toi puis
          reconnecte-toi.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
