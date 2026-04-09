"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";

export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const t = q.trim();
    if (t.length < 1) return;
    router.push(`/search?q=${encodeURIComponent(t)}`);
  }

  return (
    <form onSubmit={onSubmit} className="hidden max-w-md flex-1 sm:block">
      <Input
        type="search"
        name="q"
        placeholder="Rechercher…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-8 w-full bg-muted/50"
        autoComplete="off"
        aria-label="Recherche"
      />
    </form>
  );
}
