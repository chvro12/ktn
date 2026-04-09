"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchAdminReports,
  patchAdminReport,
  type AdminReportRow,
} from "@/lib/admin-api";

const STATUSES = [
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "REJECTED",
] as const;

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

function statusLabel(s: string) {
  switch (s) {
    case "OPEN":
      return "Ouvert";
    case "IN_REVIEW":
      return "En examen";
    case "RESOLVED":
      return "Résolu";
    case "REJECTED":
      return "Rejeté";
    default:
      return s;
  }
}

function ReportRow({ report }: { report: AdminReportRow }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setStatus(report.status);
  }, [report.id, report.status]);

  const dirty = status !== report.status || notes.trim().length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      patchAdminReport(report.id, {
        status,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      }),
    onSuccess: () => {
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      void queryClient.invalidateQueries({
        queryKey: ["admin", "moderation-actions"],
      });
    },
  });

  return (
    <tr className="border-b border-border/60 align-top last:border-0">
      <td className="px-3 py-3">
        <div className="text-xs text-muted-foreground">
          {targetTypeLabel(report.targetType)}
        </div>
        <div className="mt-0.5 font-medium">{report.targetLabel}</div>
        {report.targetPath ? (
          <Link
            href={report.targetPath}
            className="mt-1 inline-block text-xs text-primary underline-offset-4 hover:underline"
          >
            Voir sur le site
          </Link>
        ) : null}
        <p className="mt-2 text-sm text-foreground">
          <span className="text-muted-foreground">Motif : </span>
          {report.reason}
        </p>
        {report.details ? (
          <p className="mt-1 text-xs text-muted-foreground">{report.details}</p>
        ) : null}
      </td>
      <td className="px-3 py-3 text-sm">
        <div>{report.reporter.displayName}</div>
        <div className="text-xs text-muted-foreground">
          {report.reporter.email}
        </div>
      </td>
      <td className="hidden px-3 py-3 text-sm text-muted-foreground lg:table-cell">
        {formatDate(report.createdAt)}
      </td>
      <td className="px-3 py-3">
        <select
          className="mb-2 h-8 w-full max-w-[10rem] rounded-md border border-input bg-background px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Statut du signalement"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        <Input
          placeholder="Note (optionnel)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mb-2 h-8 max-w-[14rem] text-xs"
        />
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!dirty || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "…" : "Appliquer"}
        </Button>
        {mutation.isError ? (
          <p className="mt-1 max-w-[12rem] text-xs text-destructive">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Erreur"}
          </p>
        ) : null}
      </td>
    </tr>
  );
}

export function AdminReportsTable() {
  const [filter, setFilter] = useState<"ALL" | "OPEN">("ALL");
  const statusParam = filter === "OPEN" ? "OPEN" : undefined;

  const q = useInfiniteQuery({
    queryKey: ["admin", "reports", statusParam ?? "ALL"],
    queryFn: ({ pageParam }) =>
      fetchAdminReports(pageParam as string | undefined, statusParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const rows = useMemo(
    () => q.data?.pages.flatMap((p) => p.items) ?? [],
    [q.data?.pages],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "ALL" ? "default" : "outline"}
          onClick={() => setFilter("ALL")}
        >
          Tous
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "OPEN" ? "default" : "outline"}
          onClick={() => setFilter("OPEN")}
        >
          Ouverts seulement
        </Button>
      </div>

      {q.isPending ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : null}
      {q.isError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {q.error instanceof Error ? q.error.message : "Erreur"}
        </p>
      ) : null}

      {!q.isPending && !q.isError && rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/60 py-12 text-center text-sm text-muted-foreground">
          Aucun signalement.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border/80 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2 font-medium">Cible</th>
                <th className="px-3 py-2 font-medium">Signaleur</th>
                <th className="hidden px-3 py-2 font-medium lg:table-cell">
                  Date
                </th>
                <th className="px-3 py-2 font-medium">Traitement</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <ReportRow key={r.id} report={r} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

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
