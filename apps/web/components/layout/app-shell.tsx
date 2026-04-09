import Link from "next/link";
import { HeaderNav } from "@/components/layout/header-nav";
import { HeaderSearch } from "@/components/layout/header-search";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight text-foreground"
          >
            Katante
          </Link>
          <HeaderSearch />
          <HeaderNav />
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-4 py-6">{children}</main>
    </div>
  );
}
