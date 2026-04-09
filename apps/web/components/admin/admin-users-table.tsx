"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  fetchAdminUsers,
  patchAdminUser,
  type AdminUserRow,
} from "@/lib/admin-api";

const ROLES = ["VIEWER", "CREATOR", "ADMIN"] as const;
const STATUSES = ["ACTIVE", "SUSPENDED"] as const;

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

function UserRow({ user }: { user: AdminUserRow }) {
  const queryClient = useQueryClient();
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);

  useEffect(() => {
    setRole(user.role);
    setStatus(user.status);
  }, [user.id, user.role, user.status]);

  const dirty = role !== user.role || status !== user.status;

  const mutation = useMutation({
    mutationFn: () =>
      patchAdminUser(user.id, {
        ...(role !== user.role ? { role } : {}),
        ...(status !== user.status ? { status } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-3 py-3 align-top">
        <div className="font-medium">{user.displayName}</div>
        <div className="text-xs text-muted-foreground">{user.email}</div>
        <div className="mt-0.5 font-mono text-[0.65rem] text-muted-foreground">
          @{user.username}
        </div>
      </td>
      <td className="px-3 py-3 align-top">
        <select
          className="h-8 w-full max-w-[9rem] rounded-md border border-input bg-background px-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label={`Rôle de ${user.displayName}`}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r === "VIEWER"
                ? "Spectateur"
                : r === "CREATOR"
                  ? "Créateur"
                  : "Admin"}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3 align-top">
        <select
          className="h-8 w-full max-w-[9rem] rounded-md border border-input bg-background px-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label={`Statut de ${user.displayName}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ACTIVE" ? "Actif" : "Suspendu"}
            </option>
          ))}
        </select>
      </td>
      <td className="hidden px-3 py-3 align-top text-sm text-muted-foreground lg:table-cell">
        {formatDate(user.createdAt)}
      </td>
      <td className="px-3 py-3 align-top">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!dirty || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "…" : "Enregistrer"}
        </Button>
        {mutation.isError ? (
          <p className="mt-1 max-w-[10rem] text-xs text-destructive">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Erreur"}
          </p>
        ) : null}
      </td>
    </tr>
  );
}

export function AdminUsersTable() {
  const q = useInfiniteQuery({
    queryKey: ["admin", "users"],
    queryFn: ({ pageParam }) => fetchAdminUsers(pageParam),
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
        Aucun utilisateur.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border/80 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 font-medium">Compte</th>
              <th className="px-3 py-2 font-medium">Rôle</th>
              <th className="px-3 py-2 font-medium">Statut</th>
              <th className="hidden px-3 py-2 font-medium lg:table-cell">
                Inscription
              </th>
              <th className="px-3 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow key={u.id} user={u} />
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
