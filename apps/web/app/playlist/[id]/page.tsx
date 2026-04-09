import type { Metadata } from "next";
import { PlaylistDetailPage } from "@/components/playlists/playlist-detail-page";
import { fetchPlaylistMetadataServer } from "@/lib/server-public-api";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const p = await fetchPlaylistMetadataServer(id);
  if (!p) {
    return {
      title: "Playlist",
      robots: { index: false, follow: true },
    };
  }
  const desc =
    p.description?.trim().slice(0, 160) ||
    `Playlist « ${p.title} » sur Katante`;
  const indexable = p.privacy === "PUBLIC";
  return {
    title: p.title,
    description: desc,
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      title: `${p.title} · Katante`,
      description: desc,
    },
  };
}

export default async function PlaylistPage({ params }: Props) {
  const { id } = await params;
  return <PlaylistDetailPage playlistId={id} />;
}
