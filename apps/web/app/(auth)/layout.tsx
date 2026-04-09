import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="relative px-4 py-4 sm:px-6 sm:py-5">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground"
        >
          Katante
        </Link>
      </header>
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 pb-12 pt-4 sm:pb-16 sm:pt-6">
        {children}
      </div>
    </div>
  );
}
