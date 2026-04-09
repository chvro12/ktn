"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { fetchModerationActions } from "@/lib/admin-api";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function targetTypeLabel(t: string) {
  switch (t) {
    case "VIDEO":
      return "Vidéo";
    case "COMMENT":
      return "Commentaire";
    case "CHANNEL":
      return "Chaîne";
    case "USER":
      return "Utilisateur";
    default:
      return t;
  }
}

function actionLabel(actionType: string) {
  switch (actionType) {
    case "VIDEO_MODERATION_NONE":
      return "Vidéo approuvée";
    case "VIDEO_MODERATION_LIMITED":
      return "Vidéo limitée";
    case "VIDEO_MODERATION_BLOCKED":
      return "Vidéo bloquée";
    case "REPORT_OPEN":
      return "Signalement rouvert";
    case "REPORT_IN_REVIEW":
      return "Signalement en examen";
    case "REPORT_RESOLVED":
      return "Signalement résolu";
    case "REPORT_REJECTED":
      return "Signalement rejeté";
    default:
      return actionType;
  }
}

export function AdminAuditTable() {
  const q = useInfiniteQuery({
    queryKey: ["admin", "moderation-actions"],
    queryFn: ({ pageParam }) =>
      fetchModerationActions(pageParam as string | undefined),
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
        Aucune action enregistrée.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Administrateur</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Cible</th>
              <th className="px-3 py-2 font-medium">Détails</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr
                key={a.id}
                className="border-b border-border/60 align-top last:border-0"
              >
                <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                  {formatDate(a.createdAt)}
                </td>
                <td className="px-3 py-3">
                  <div className="font-medium">{a.admin.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.admin.email}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <div className="text-sm font-medium">{actionLabel(a.actionType)}</div>
                  <div className="font-mono text-[0.65rem] text-muted-foreground">
                    {a.actionType}
                  </div>
                </td>
                <td className="px-3 py-3">
                  <span className="text-muted-foreground">
                    {targetTypeLabel(a.targetType)}
                  </span>
                  <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
                    {a.targetId.slice(0, 12)}…
                  </div>
                </td>
                <td className="max-w-xs px-3 py-3 text-xs text-muted-foreground">
                  {a.notes ?? "—"}
                </td>
              </tr>
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
