"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareLinkButton() {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-10 w-full justify-center gap-1.5 rounded-full border-border/70 bg-background/75 shadow-[0_14px_35px_-30px_rgba(23,23,23,0.35)] sm:w-auto"
      onClick={async () => {
        const url = typeof window !== "undefined" ? window.location.href : "";
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      aria-live="polite"
    >
      <Share2 className="size-3.5" aria-hidden />
      {copied ? "Lien copié" : "Partager"}
    </Button>
  );
}
