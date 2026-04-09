import Image from "next/image";
import Link from "next/link";
import type { VideoCardDto } from "@/lib/types/public";
import {
  formatDurationSec,
  formatPublishedShort,
  formatViewCount,
} from "@/lib/format-media";

function videoPath(v: Pick<VideoCardDto, "slug" | "id">): string {
  return `/video/${v.slug}-${v.id}`;
}

export function VideoCard({ video }: { video: VideoCardDto }) {
  const href = videoPath(video);
  return (
    <article className="group min-w-0">
      <Link
        href={href}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-lg"
      >
        <div className="relative aspect-video overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Sans miniature
            </div>
          )}
          {video.durationSec != null ? (
            <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 text-[0.65rem] font-medium tabular-nums text-white">
              {formatDurationSec(video.durationSec)}
            </span>
          ) : null}
        </div>
        <div className="mt-2 flex gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-foreground">
              {video.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              <span>{video.channel.name}</span>
              <span className="mx-1">·</span>
              <span>{formatViewCount(video.viewsCount)}</span>
              {video.publishedAt ? (
                <>
                  <span className="mx-1">·</span>
                  <span>{formatPublishedShort(video.publishedAt)}</span>
                </>
              ) : null}
            </p>
          </div>
        </div>
      </Link>
    </article>
  );
}
