import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_58%)]" />
        <div className="absolute left-[-8rem] top-24 size-64 rounded-full bg-[rgba(255,255,255,0.55)] blur-3xl" />
        <div className="absolute bottom-[-7rem] right-[-4rem] size-72 rounded-full bg-[rgba(244,239,228,0.75)] blur-3xl" />
      </div>
      <header className="relative px-4 py-4 sm:px-6 sm:py-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-sm font-semibold tracking-tight text-foreground shadow-[0_16px_40px_-32px_rgba(23,23,23,0.4)]"
        >
          <span className="inline-flex size-2 rounded-full bg-foreground" aria-hidden />
          Katante
        </Link>
      </header>
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-4 sm:pb-16 sm:pt-6">
        {children}
      </div>
    </div>
  );
}
