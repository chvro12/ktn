import Image from "next/image";
import Link from "next/link";
import type { VideoCardDto } from "@/lib/types/public";
import {
  formatDurationSec,
  formatPublishedShort,
  formatViewCount,
} from "@/lib/format-media";
import { isAbsoluteUrl } from "@/lib/utils";

function videoPath(v: Pick<VideoCardDto, "slug" | "id">): string {
  return `/video/${v.slug}-${v.id}`;
}

export function VideoCard({ video }: { video: VideoCardDto }) {
  const href = videoPath(video);
  return (
    <article className="group min-w-0">
      <Link
        href={href}
        className="block rounded-[1.5rem] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/80 shadow-[0_18px_45px_-35px_rgba(23,23,23,0.45)]">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {video.thumbnailUrl && isAbsoluteUrl(video.thumbnailUrl) ? (
              <Image
                src={video.thumbnailUrl}
                alt={video.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.35),transparent_55%),linear-gradient(135deg,rgba(244,239,228,0.75),rgba(229,231,235,0.55))] text-xs font-medium text-muted-foreground">
                Aperçu en préparation
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-90" />
            {video.durationSec != null ? (
              <span className="absolute bottom-2 right-2 rounded-full bg-black/80 px-2 py-1 text-[0.68rem] font-medium tabular-nums text-white backdrop-blur">
                {formatDurationSec(video.durationSec)}
              </span>
            ) : null}
          </div>
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              <span className="truncate">{video.channel?.name ?? ""}</span>
              <span className="size-1 rounded-full bg-border" aria-hidden />
              <span>{formatViewCount(video.viewsCount)}</span>
            </div>
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight text-foreground">
                {video.title}
              </h3>
              <p className="mt-2 truncate text-sm text-muted-foreground">
                {video.publishedAt ? (
                  <span>{formatPublishedShort(video.publishedAt)}</span>
                ) : (
                  <span>Publication en cours</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
