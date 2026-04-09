import Link from "next/link";
import { HeaderNav } from "@/components/layout/header-nav";
import { HeaderSearch } from "@/components/layout/header-search";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:h-16 sm:flex-nowrap sm:py-0 sm:px-5">
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
      <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5 sm:py-10">
        {children}
      </main>
    </div>
  );
}
