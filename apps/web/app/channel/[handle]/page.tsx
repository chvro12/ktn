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

  return (
    <AppShell>
      <div className="space-y-8">
        <header className="space-y-4">
          <div className="relative h-32 overflow-hidden rounded-lg bg-muted ring-1 ring-border sm:h-40">
            {channel.bannerUrl ? (
              <Image
                src={channel.bannerUrl}
                alt=""
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-muted to-muted-foreground/10" />
            )}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xl font-semibold text-muted-foreground ring-2 ring-background ring-offset-0 sm:size-20">
              {channel.avatarUrl ? (
                <Image
                  src={channel.avatarUrl}
                  alt=""
                  width={80}
                  height={80}
                  className="size-full object-cover"
                />
              ) : (
                channel.name.slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight">
                {channel.name}
                {channel.verified ? (
                  <span className="ml-1 text-muted-foreground" title="Vérifiée">
                    ✓
                  </span>
                ) : null}
              </h1>
              <p className="text-sm text-muted-foreground">@{channel.handle}</p>
            </div>
            <ChannelSubscribe
              handle={channel.handle}
              initialSubscriberCount={channel.subscriberCount}
            />
            <Link
              href="/"
              className="self-center text-sm text-muted-foreground underline-offset-4 hover:underline sm:self-end"
            >
              Accueil
            </Link>
          </div>
          {channel.description ? (
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {channel.description}
            </p>
          ) : null}
        </header>
        <section aria-labelledby="videos-heading">
          <h2 id="videos-heading" className="sr-only">
            Vidéos
          </h2>
          <VideoGrid items={videos.items} />
        </section>
      </div>
    </AppShell>
  );
}
