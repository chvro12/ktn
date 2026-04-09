"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminStats } from "@/lib/admin-api";

function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <div
      className={
        warn
          ? "rounded-xl border border-amber-500/30 bg-amber-500/5 px-5 py-4"
          : "rounded-xl border border-border/60 bg-card/40 px-5 py-4"
      }
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={
          warn
            ? "mt-2 text-2xl font-semibold tabular-nums text-amber-200"
            : "mt-2 text-2xl font-semibold tabular-nums"
        }
      >
        {value}
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const q = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: fetchAdminStats,
  });

  if (q.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-muted/40"
          />
        ))}
      </div>
    );
  }

  if (q.isError) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        {q.error instanceof Error ? q.error.message : "Erreur de chargement"}
      </p>
    );
  }

  const s = q.data;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Utilisateurs" value={s.userCount} />
      <StatCard label="Vidéos" value={s.videoCount} />
      <StatCard label="Chaînes" value={s.channelCount} />
      <StatCard
        label="Signalements ouverts"
        value={s.openReportsCount}
        warn={s.openReportsCount > 0}
      />
      <StatCard
        label="Vidéos modérées (≠ normale)"
        value={s.flaggedVideoCount}
        warn={s.flaggedVideoCount > 0}
      />
    </div>
  );
}
