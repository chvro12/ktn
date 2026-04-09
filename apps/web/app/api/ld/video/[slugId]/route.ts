import { NextResponse } from "next/server";
import { fetchVideoDetailServer } from "@/lib/server-public-api";
import { getPublicSiteOrigin } from "@/lib/site-config";
import { secondsToIso8601Duration } from "@/lib/format-media";

type Ctx = { params: Promise<{ slugId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { slugId } = await ctx.params;
  const video = await fetchVideoDetailServer(slugId);
  if (!video) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const base = getPublicSiteOrigin().replace(/\/$/, "");
  const canonicalPath = `/video/${video.slug}-${video.id}`;
  const pageUrl = `${base}${canonicalPath}`;
  const uploadDate = video.publishedAt
    ? new Date(video.publishedAt).toISOString().slice(0, 10)
    : undefined;
  const duration =
    video.durationSec != null
      ? secondsToIso8601Duration(video.durationSec)
      : undefined;

  const body = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.title,
    description:
      video.description?.trim() || `${video.title} — ${video.channel.name}`,
    thumbnailUrl: video.thumbnailUrl ?? undefined,
    uploadDate,
    duration,
    contentUrl: video.hlsUrl ?? pageUrl,
    embedUrl: `${base}/embed/${video.id}`,
    publisher: {
      "@type": "Organization",
      name: video.channel.name,
      url: `${base}/channel/${video.channel.handle}`,
    },
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/ld+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
    },
  });
}
