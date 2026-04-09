"use client";

import { Search } from "lucide-react";
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
    <form
      onSubmit={onSubmit}
      className="order-3 relative min-w-0 basis-full sm:order-none sm:flex-1 sm:basis-auto sm:max-w-md lg:max-w-xl"
    >
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
        <Search
          className="size-3.5 text-muted-foreground"
          aria-hidden
        />
      </div>
      <Input
        type="search"
        name="q"
        placeholder="Rechercher…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="h-10 w-full rounded-full border-border/70 bg-background/80 pl-10 pr-4 shadow-[0_16px_40px_-34px_rgba(23,23,23,0.4)] sm:h-11 sm:placeholder:text-sm"
        autoComplete="off"
        aria-label="Recherche"
      />
    </form>
  );
}
