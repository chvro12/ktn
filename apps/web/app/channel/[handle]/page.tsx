import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ChannelSubscribe } from "@/components/channel/channel-subscribe";
import { VideoGrid } from "@/components/video/video-grid";
import { fetchChannelVideosPage } from "@/lib/server-public-api";

type Props = { params: Promise<{ handle: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const data = await fetchChannelVideosPage(handle);
  if (!data) {
    return { title: "Chaîne introuvable" };
  }
  const { channel } = data;
  return {
    title: channel.name,
    description:
      channel.description?.trim() ||
      `Chaîne ${channel.name} sur Katante`,
    alternates: { canonical: `/channel/${channel.handle}` },
    openGraph: {
      title: `${channel.name} · Katante`,
      description: channel.description || undefined,
      url: `/channel/${channel.handle}`,
      images: channel.avatarUrl ? [channel.avatarUrl] : undefined,
    },
  };
}

export default async function ChannelPage({ params }: Props) {
  const { handle } = await params;
  const data = await fetchChannelVideosPage(handle);
  if (!data) notFound();

  const { channel, videos } = data;
  const publishedCount = videos.items.length;

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        <header className="space-y-5">
          <div className="relative h-32 overflow-hidden rounded-[1.75rem] border border-border/70 bg-muted shadow-[0_24px_70px_-50px_rgba(23,23,23,0.45)] sm:h-52 sm:rounded-[2rem]">
            {channel.bannerUrl ? (
              <Image
                src={channel.bannerUrl}
                alt=""
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.55),transparent_38%),linear-gradient(135deg,rgba(244,239,228,0.92),rgba(229,231,235,0.68))]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
          </div>
          <div className="rounded-[1.75rem] border border-border/70 bg-card/80 p-4 shadow-[0_24px_70px_-50px_rgba(23,23,23,0.42)] sm:rounded-[2rem] sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-muted text-xl font-semibold text-muted-foreground shadow-[0_18px_45px_-35px_rgba(23,23,23,0.4)] sm:size-22 sm:text-2xl">
                  {channel.avatarUrl ? (
                    <Image
                      src={channel.avatarUrl}
                      alt=""
                      width={88}
                      height={88}
                      className="size-full object-cover"
                    />
                  ) : (
                    channel.name.slice(0, 1).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight sm:text-3xl">
                      {channel.name}
                      {channel.verified ? (
                        <span className="ml-2 align-middle text-sm text-muted-foreground" title="Vérifiée">
                          ✓
                        </span>
                      ) : null}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">@{channel.handle}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                      {channel.subscriberCount} abonné{channel.subscriberCount > 1 ? "s" : ""}
                    </span>
                    <span className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs text-muted-foreground">
                      {publishedCount} vidéo{publishedCount > 1 ? "s" : ""} visible{publishedCount > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
                <ChannelSubscribe
                  handle={channel.handle}
                  initialSubscriberCount={channel.subscriberCount}
                />
                <Link
                  href="/"
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  Accueil
                </Link>
              </div>
            </div>
            {channel.description ? (
              <p className="mt-5 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {channel.description}
              </p>
            ) : null}
          </div>
        </header>
        <section aria-labelledby="videos-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 id="videos-heading" className="text-xl font-semibold tracking-tight">
                Vidéos publiées
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Les contenus publics actuellement visibles sur cette chaîne.
              </p>
            </div>
          </div>
          <VideoGrid items={videos.items} />
        </section>
      </div>
    </AppShell>
  );
}
