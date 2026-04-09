import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À regarder plus tard",
  robots: { index: false, follow: false },
};

export default function WatchLaterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
