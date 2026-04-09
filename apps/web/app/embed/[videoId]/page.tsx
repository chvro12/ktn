import { serverApiUrl } from "@/lib/api";
import { notFound, redirect } from "next/navigation";

type Props = { params: Promise<{ videoId: string }> };

export default async function EmbedPage({ params }: Props) {
  const { videoId } = await params;
  if (!videoId) notFound();

  const res = await fetch(
    serverApiUrl(`/v1/public/videos/lookup/${encodeURIComponent(videoId)}`),
    { next: { revalidate: 120 } },
  );

  if (!res.ok) notFound();

  const data = (await res.json()) as { slug: string; id: string };
  redirect(`/video/${data.slug}-${data.id}`);
}
