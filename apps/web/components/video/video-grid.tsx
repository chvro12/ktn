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
      <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">
        {emptyMessage ??
          "Aucune vidéo pour l’instant. Reviens plus tard."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
