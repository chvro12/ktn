"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { readApiErrorMessage } from "@/lib/api-errors";

type MeResponse =
  | { user: { id: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

type SubStatus = { subscribed: boolean; subscriberCount: number };

async function fetchSubStatus(handle: string): Promise<SubStatus> {
  const res = await apiFetch(
    `/v1/engagement/channels/${encodeURIComponent(handle)}/subscription-status`,
  );
  if (!res.ok) throw new Error("subscription-status");
  return res.json() as Promise<SubStatus>;
}

export function ChannelSubscribe({
  handle,
  initialSubscriberCount,
}: {
  handle: string;
  initialSubscriberCount: number;
}) {
  const queryClient = useQueryClient();
  const [count, setCount] = useState(initialSubscriberCount);

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  const statusQuery = useQuery({
    queryKey: ["subscription", handle],
    queryFn: () => fetchSubStatus(handle),
    enabled: loggedIn,
  });

  useEffect(() => {
    if (statusQuery.data?.subscriberCount != null) {
      setCount(statusQuery.data.subscriberCount);
    }
  }, [statusQuery.data?.subscriberCount]);

  const toggle = useMutation({
    mutationFn: async () => {
      const subscribed = statusQuery.data?.subscribed ?? false;
      if (subscribed) {
        const res = await apiFetch(
          `/v1/engagement/channels/${encodeURIComponent(handle)}/subscribe`,
          { method: "DELETE" },
        );
        if (!res.ok) {
          throw new Error(await readApiErrorMessage(res, "Erreur"));
        }
        return res.json() as Promise<SubStatus>;
      }
      const res = await apiFetch(
        `/v1/engagement/channels/${encodeURIComponent(handle)}/subscribe`,
        { method: "POST" },
      );
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res, "Erreur"));
      }
      return res.json() as Promise<SubStatus>;
    },
    onSuccess: async (data) => {
      setCount(data.subscriberCount);
      await queryClient.invalidateQueries({ queryKey: ["subscription", handle] });
    },
  });

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-stretch gap-1 sm:items-end">
        <Link
          href={`/login?next=${encodeURIComponent(`/channel/${handle}`)}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          S’abonner
        </Link>
        <span className="text-center text-xs text-muted-foreground sm:text-right">
          {new Intl.NumberFormat("fr-FR").format(count)} abonné
          {count > 1 ? "s" : ""}
        </span>
      </div>
    );
  }

  const subscribed = statusQuery.data?.subscribed ?? false;

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <Button
        type="button"
        size="sm"
        variant={subscribed ? "secondary" : "default"}
        disabled={statusQuery.isPending || toggle.isPending}
        onClick={() => toggle.mutate()}
      >
        {subscribed ? "Abonné" : "S’abonner"}
      </Button>
      <span className="text-center text-xs text-muted-foreground sm:text-right">
        {new Intl.NumberFormat("fr-FR").format(count)} abonné
        {count > 1 ? "s" : ""}
      </span>
    </div>
  );
}
