"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { fetchAuthMe } from "@/lib/auth-me";
import { submitReport } from "@/lib/reports-api";
import { cn } from "@/lib/utils";

export function ReportVideoButton({
  videoId,
  className,
}: {
  videoId: string;
  className?: string;
}) {
  const pathname = usePathname() ?? "/";
  const queryClient = useQueryClient();
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchAuthMe,
  });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  const close = useCallback(() => {
    setOpen(false);
    setReason("");
    setDetails("");
  }, []);

  const mutation = useMutation({
    mutationFn: () =>
      submitReport({
        targetType: "VIDEO",
        targetId: videoId,
        reason: reason.trim(),
        ...(details.trim() ? { details: details.trim() } : {}),
      }),
    onSuccess: () => {
      close();
      void queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
    },
  });

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>("textarea")?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  if (meQuery.isPending) {
    return (
      <div
        className={cn(
          "h-10 w-full rounded-full bg-muted/40 sm:w-28",
          "animate-pulse",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (!loggedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={cn(
          buttonVariants({
            variant: "outline",
            size: "sm",
          }),
          "h-10 w-full justify-center gap-1.5 rounded-full border-border/70 bg-background/75 shadow-[0_14px_35px_-30px_rgba(23,23,23,0.35)] sm:w-auto",
          className,
        )}
      >
        <Flag className="size-3.5" aria-hidden />
        Signaler (connexion)
      </Link>
    );
  }

  const canSubmit = reason.trim().length >= 3 && reason.trim().length <= 500;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-10 w-full justify-center gap-1.5 rounded-full border-border/70 bg-background/75 shadow-[0_14px_35px_-30px_rgba(23,23,23,0.35)] sm:w-auto",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        <Flag className="size-3.5" aria-hidden />
        Signaler
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center"
          role="presentation"
          onClick={close}
        >
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[min(90vh,32rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border/80 bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight"
            >
              Signaler cette vidéo
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ton signalement sera examiné par l’équipe. Les abus peuvent
              entraîner la suspension du compte.
            </p>

            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!canSubmit || mutation.isPending) return;
                mutation.mutate();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor={`${dialogId}-reason`}>Motif (obligatoire)</Label>
                <textarea
                  id={`${dialogId}-reason`}
                  required
                  minLength={3}
                  maxLength={500}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex. contenu choquant, spam, erreur de droits…"
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${dialogId}-details`}>
                  Précisions (optionnel)
                </Label>
                <textarea
                  id={`${dialogId}-details`}
                  maxLength={4000}
                  rows={3}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Horodatage, liens utiles, contexte…"
                  className="w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
                />
              </div>

              {mutation.isError ? (
                <p className="text-sm text-destructive" role="alert">
                  {mutation.error instanceof Error
                    ? mutation.error.message
                    : "Erreur"}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={close}
                  disabled={mutation.isPending}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!canSubmit || mutation.isPending}
                >
                  {mutation.isPending ? "Envoi…" : "Envoyer le signalement"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
