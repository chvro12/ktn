"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[WatchPage error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Impossible de charger cette vidéo
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Une erreur s&apos;est produite lors du chargement de la page.
        {error.digest ? (
          <span className="mt-1 block font-mono text-xs opacity-60">
            Digest : {error.digest}
          </span>
        ) : null}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm transition hover:bg-muted"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-full border border-border/70 bg-card px-4 py-2 text-sm transition hover:bg-muted"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
