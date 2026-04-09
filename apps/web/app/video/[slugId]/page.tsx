import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ChannelSubscribe } from "@/components/channel/channel-subscribe";
import {
  formatDurationSec,
  formatPublishedShort,
  formatViewCount,
} from "@/lib/format-media";
import { VideoGrid } from "@/components/video/video-grid";
import { VideoDescriptionCollapsible } from "@/components/watch/video-description-collapsible";
import { ShareLinkButton } from "@/components/watch/share-link-button";
import { WatchEngagement } from "@/components/watch/watch-engagement";
import { WatchVideoPlayer } from "@/components/watch/watch-video-player";
import {
  fetchChannelVideosPage,
  fetchVideoDetailServer,
} from "@/lib/server-public-api";

type Props = { params: Promise<{ slugId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slugId } = await params;
  const video = await fetchVideoDetailServer(slugId);
  if (!video) {
    return { title: "Vidéo introuvable" };
  }
  const title = `${video.title} · ${video.channel.name}`;
  const desc =
    video.description?.trim() ||
    `${video.title} — ${video.channel.name}`;
  const canonicalPath = `/video/${video.slug}-${video.id}`;
  return {
    title: video.title,
    description: desc,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description: desc,
      type: "video.other",
      url: canonicalPath,
      images: video.thumbnailUrl
        ? [{ url: video.thumbnailUrl, width: 1280, height: 720 }]
        : undefined,
    },
    twitter: {
      card: video.hlsUrl ? "player" : "summary_large_image",
      title,
      description: desc,
      images: video.thumbnailUrl ? [video.thumbnailUrl] : undefined,
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { slugId } = await params;
  const video = await fetchVideoDetailServer(slugId);
  if (!video) notFound();

  const channelFeed = await fetchChannelVideosPage(video.channel.handle);
  const relatedVideos =
    channelFeed?.videos.items
      .filter((v) => v.id !== video.id)
      .slice(0, 12) ?? [];

  return (
    <AppShell>
      <div className="grid gap-8 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-4">
          <div
            className="relative aspect-video w-full overflow-hidden rounded-lg bg-black ring-1 ring-foreground/10"
            aria-label="Lecteur vidéo"
          >
            {video.hlsUrl ? (
              <WatchVideoPlayer
                slugId={`${video.slug}-${video.id}`}
                hlsUrl={video.hlsUrl}
                poster={video.thumbnailUrl}
                durationSec={video.durationSec}
              />
            ) : (
              <>
                {video.thumbnailUrl ? (
                  <Image
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover opacity-90"
                    priority
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 px-4 text-center text-sm text-white">
                  La lecture n’est pas encore disponible pour cette vidéo.
                </div>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold leading-snug tracking-tight">
                {video.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span>{formatViewCount(video.viewsCount)}</span>
                <span aria-hidden>·</span>
                <span>{formatPublishedShort(video.publishedAt)}</span>
                {video.durationSec != null ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="tabular-nums">
                      {formatDurationSec(video.durationSec)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
            <ShareLinkButton />
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <Link
              href={`/channel/${video.channel.handle}`}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-lg focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring sm:flex-initial"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground ring-1 ring-border">
                {video.channel.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">
                  {video.channel.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  @{video.channel.handle}
                  {video.channel.verified ? " · vérifiée" : ""}
                </span>
              </span>
            </Link>
            <ChannelSubscribe
              handle={video.channel.handle}
              initialSubscriberCount={video.channel.subscriberCount}
            />
          </div>
          {video.description ? (
            <VideoDescriptionCollapsible text={video.description} />
          ) : null}
          <WatchEngagement
            slugId={`${video.slug}-${video.id}`}
            initialLikesCount={video.likesCount}
          />
        </div>
        <aside className="hidden min-h-[200px] min-w-0 lg:block">
          <h2 className="text-sm font-medium text-foreground">
            Autres vidéos · {video.channel.name}
          </h2>
          <div className="mt-4">
            {relatedVideos.length > 0 ? (
              <VideoGrid
                items={relatedVideos}
                emptyMessage="Aucune autre vidéo pour l’instant."
              />
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune autre vidéo publiée sur cette chaîne pour l’instant.
              </p>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
