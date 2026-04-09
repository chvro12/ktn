import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-md justify-center">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Katante
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
