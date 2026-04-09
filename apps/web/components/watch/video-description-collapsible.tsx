"use client";

import { useMemo, useState } from "react";

const MIN_CHARS_TO_COLLAPSE = 240;

export function VideoDescriptionCollapsible({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const collapsible = useMemo(
    () => text.trim().length > MIN_CHARS_TO_COLLAPSE,
    [text],
  );

  return (
    <div className="rounded-lg border border-border bg-card/50 px-4 py-3 text-sm leading-relaxed text-card-foreground">
      <p
        id="video-description-text"
        className={
          collapsible && !open
            ? "line-clamp-4 whitespace-pre-wrap"
            : "whitespace-pre-wrap"
        }
      >
        {text}
      </p>
      {collapsible ? (
        <button
          type="button"
          className="mt-2 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          aria-expanded={open}
          aria-controls="video-description-text"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Réduire" : "Voir plus"}
        </button>
      ) : null}
    </div>
  );
}
