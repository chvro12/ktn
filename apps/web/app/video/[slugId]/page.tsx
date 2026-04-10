import type { Metadata } from "next";
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
import { ReportVideoButton } from "@/components/watch/report-video-button";
import { ShareLinkButton } from "@/components/watch/share-link-button";
import { WatchEngagement } from "@/components/watch/watch-engagement";
import { WatchVideoPlayer } from "@/components/watch/watch-video-player";
import {
  fetchChannelVideosPage,
  fetchVideoDetailServer,
} from "@/lib/server-public-api";
import { isAbsoluteUrl } from "@/lib/utils";

type Props = { params: Promise<{ slugId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slugId } = await params;
    const video = await fetchVideoDetailServer(slugId);
    if (!video || !video.channel) {
      return { title: "Vidéo introuvable" };
    }
    const channelName = video.channel.name ?? "";
    const title = channelName ? `${video.title} · ${channelName}` : video.title;
    const desc =
      video.description?.trim() ||
      (channelName ? `${video.title} — ${channelName}` : video.title);
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
        images: video.thumbnailUrl && isAbsoluteUrl(video.thumbnailUrl)
          ? [{ url: video.thumbnailUrl, width: 1280, height: 720 }]
          : undefined,
      },
      twitter: {
        card: video.hlsUrl && isAbsoluteUrl(video.hlsUrl) ? "player" : "summary_large_image",
        title,
        description: desc,
        images: video.thumbnailUrl && isAbsoluteUrl(video.thumbnailUrl) ? [video.thumbnailUrl] : undefined,
      },
    };
  } catch (err) {
    console.error("[generateMetadata] error for watch page:", err);
    return { title: "Katante" };
  }
}

export default async function WatchPage({ params }: Props) {
  const { slugId } = await params;
  let video: Awaited<ReturnType<typeof fetchVideoDetailServer>>;
  try {
    video = await fetchVideoDetailServer(slugId);
  } catch (err) {
    console.error("[WatchPage] fetchVideoDetailServer threw:", err);
    throw err;
  }
  if (!video) notFound();

  // Defensive: channel might be null if relation is broken in DB
  if (!video.channel) {
    console.error("[WatchPage] video.channel is null for slugId:", slugId, "videoId:", video.id);
    notFound();
  }

  let channelFeed: Awaited<ReturnType<typeof fetchChannelVideosPage>>;
  try {
    channelFeed = await fetchChannelVideosPage(video.channel.handle);
  } catch (err) {
    console.error("[WatchPage] fetchChannelVideosPage threw:", err);
    channelFeed = null;
  }
  const relatedVideos =
    channelFeed?.videos?.items
      .filter((v) => v.id !== video!.id)
      .slice(0, 12) ?? [];

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <div
            className="relative aspect-video w-full overflow-hidden rounded-[1.25rem] border border-border/70 bg-black shadow-[0_30px_80px_-50px_rgba(0,0,0,0.55)] sm:rounded-[1.75rem]"
            aria-label="Lecteur vidéo"
          >
            {video.hlsUrl && isAbsoluteUrl(video.hlsUrl) ? (
              <WatchVideoPlayer
                slugId={`${video.slug}-${video.id}`}
                hlsUrl={video.hlsUrl}
                poster={video.thumbnailUrl && isAbsoluteUrl(video.thumbnailUrl) ? video.thumbnailUrl : undefined}
                durationSec={video.durationSec}
              />
            ) : (
              <>
                {video.thumbnailUrl && isAbsoluteUrl(video.thumbnailUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-90"
                  />
                ) : null}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 px-4 text-center text-sm text-white">
                  La lecture n’est pas encore disponible pour cette vidéo.
                </div>
              </>
            )}
          </div>
          <div className="rounded-[1.5rem] border border-border/70 bg-card/80 p-4 shadow-[0_20px_60px_-45px_rgba(23,23,23,0.35)] sm:rounded-[1.75rem] sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold leading-snug tracking-tight text-balance">
                  {video.title}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>{formatViewCount(video.viewsCount)}</span>
                  <span aria-hidden>·</span>
                  <span>{formatPublishedShort(video.publishedAt)}</span>
                  {video.durationSec != null ? (
                    <>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{formatDurationSec(video.durationSec)}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-stretch">
                <ShareLinkButton />
                <ReportVideoButton videoId={video.id} />
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-border/70 pt-5 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href={`/channel/${video.channel.handle}`}
                className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-3 py-3 transition hover:bg-background focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring sm:flex-initial sm:min-w-[16rem]"
              >
                <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-muted-foreground ring-1 ring-border">
                  {video.channel.avatarUrl && isAbsoluteUrl(video.channel.avatarUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.channel.avatarUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    (video.channel.name ?? "").slice(0, 1).toUpperCase()
                  )}
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
          </div>
          {video.description ? (
            <VideoDescriptionCollapsible text={video.description} />
          ) : null}
          <WatchEngagement
            slugId={`${video.slug}-${video.id}`}
            initialLikesCount={video.likesCount}
          />
          <section className="space-y-4 lg:hidden">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Autres vidéos</h2>
              <p className="mt-1 text-sm text-muted-foreground">{video.channel.name}</p>
            </div>
            {relatedVideos.length > 0 ? (
              <VideoGrid
                items={relatedVideos}
                emptyMessage="Aucune autre vidéo pour l’instant."
              />
            ) : (
              <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Aucune autre vidéo publiée sur cette chaîne pour l’instant.
              </p>
            )}
          </section>
        </div>
        <aside className="hidden min-h-[200px] min-w-0 lg:block">
          <div className="rounded-[1.75rem] border border-border/80 bg-card p-5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Autres vidéos
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{video.channel.name}</p>
            <div className="mt-4">
              {relatedVideos.length > 0 ? (
                <VideoGrid
                  items={relatedVideos}
                  emptyMessage="Aucune autre vidéo pour l’instant."
                />
              ) : (
                <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Aucune autre vidéo publiée sur cette chaîne pour l’instant.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
