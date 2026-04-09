"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api";
import { ChannelOnboardingForm } from "@/components/channel/channel-onboarding-form";

type MeResponse =
  | { user: { id: string; email: string; displayName: string; role: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

async function fetchMyChannel(): Promise<{ channel: { handle: string } } | null> {
  const res = await apiFetch("/v1/channels/me");
  if (res.status === 404) return null;
  if (res.status === 401) return Promise.reject(new Error("UNAUTHORIZED"));
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Erreur chargement chaîne");
  }
  return res.json() as Promise<{ channel: { handle: string } }>;
}

export function ChannelOnboardingGate() {
  const router = useRouter();

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
  });

  const authed = Boolean(meQuery.data && "user" in meQuery.data);

  const channelQuery = useQuery({
    queryKey: ["channel", "me"],
    queryFn: fetchMyChannel,
    enabled: authed,
  });

  useEffect(() => {
    if (meQuery.isPending) return;
    if (!meQuery.data || !("user" in meQuery.data)) {
      router.replace("/login?next=/onboarding/channel");
    }
  }, [meQuery.isPending, meQuery.data, router]);

  useEffect(() => {
    if (channelQuery.isPending) return;
    if (channelQuery.data?.channel) {
      router.replace("/");
    }
  }, [channelQuery.data, channelQuery.isPending, router]);

  if (meQuery.isPending || (authed && channelQuery.isPending)) {
    return (
      <div className="w-full max-w-md space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!authed) {
    return (
      <p className="text-sm text-muted-foreground">
        Redirection vers la connexion…
      </p>
    );
  }

  if (channelQuery.data?.channel) {
    return (
      <p className="text-sm text-muted-foreground">Redirection…</p>
    );
  }

  if (channelQuery.isError) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">
          Session expirée ou accès refusé.
        </p>
        <Link
          href="/login?next=/onboarding/channel"
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          Se reconnecter
        </Link>
      </div>
    );
  }

  return <ChannelOnboardingForm />;
}
