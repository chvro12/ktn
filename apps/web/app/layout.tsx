import type { Metadata, Viewport } from "next";
import { getMetadataBaseUrl } from "@/lib/site-config";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getMetadataBaseUrl(),
  title: {
    default: "Katante",
    template: "%s · Katante",
  },
  description: "Regarde des vidéos et partage les tiennes.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
