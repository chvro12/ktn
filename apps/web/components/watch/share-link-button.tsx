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
      className="gap-1.5"
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
