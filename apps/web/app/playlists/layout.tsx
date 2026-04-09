import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mes playlists",
  robots: { index: false, follow: false },
};

export default function PlaylistsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
