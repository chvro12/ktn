import type { VideoCardDto } from "@/lib/types/public";
import { VideoCard } from "@/components/video/video-card";

export function VideoGrid({
  items,
  emptyMessage,
}: {
  items: VideoCardDto[];
  /** Si absent, message par défaut (accueil / chaîne). */
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-card/60 px-6 py-14 text-center text-sm text-muted-foreground shadow-[0_14px_40px_-35px_rgba(23,23,23,0.4)]">
        {emptyMessage ??
          "Aucune vidéo pour l’instant. Reviens plus tard."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {items.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
