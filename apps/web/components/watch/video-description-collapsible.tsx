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
    <div className="rounded-[1.75rem] border border-border/70 bg-card/75 px-5 py-4 text-sm leading-7 text-card-foreground shadow-[0_18px_55px_-45px_rgba(23,23,23,0.32)]">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        Description
      </p>
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
          className="mt-3 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-background hover:text-foreground"
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
