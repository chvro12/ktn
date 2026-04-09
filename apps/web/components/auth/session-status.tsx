"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";

type MeResponse =
  | { user: { email: string; displayName: string; role: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

export function SessionStatus() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
  });

  if (isPending) {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  if (isError || !data || "error" in data) {
    return (
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
        <p>Tu n’es pas connecté·e.</p>
        <p className="mt-2">
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Connexion
          </Link>
          <span className="mx-2 text-border" aria-hidden>
            ·
          </span>
          <Link
            href="/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 text-sm">
      <p className="font-medium text-foreground">{data.user.displayName}</p>
      <p className="text-muted-foreground">{data.user.email}</p>
    </div>
  );
}
