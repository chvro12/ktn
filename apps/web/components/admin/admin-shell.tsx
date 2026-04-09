"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/reports", label: "Signalements" },
  { href: "/admin/videos", label: "Modération vidéos" },
  { href: "/admin/audit", label: "Journal" },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";

  return (
    <div className="min-h-svh bg-background">
      <div className="flex flex-col md:flex-row">
        <aside className="shrink-0 border-b border-border/80 md:w-52 md:border-b-0 md:border-r md:border-border/80">
          <div className="p-4 md:p-5">
            <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
              Administration
            </p>
            <nav className="mt-4 flex flex-row gap-1 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
              {nav.map(({ href, label }) => {
                const active =
                  href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/"
              className="mt-4 hidden text-sm text-muted-foreground hover:text-foreground md:inline-block"
            >
              ← Retour au site
            </Link>
            <Link
              href="/"
              className="mt-2 inline-block text-sm text-muted-foreground hover:text-foreground md:hidden"
            >
              Site
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
