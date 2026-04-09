import { serverApiUrl } from "@/lib/api";
import type {
  ChannelPageDto,
  FeedResponse,
  VideoDetailDto,
} from "@/lib/types/public";
export async function fetchFeedServer(cursor?: string): Promise<FeedResponse> {
  try {
    const u = new URL(serverApiUrl("/v1/public/videos/feed"));
    u.searchParams.set("limit", "24");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await fetch(u.toString(), { cache: "no-store" });
    if (!res.ok) {
      const snippet = await res.text().catch(() => "");
      console.error(
        "[fetchFeedServer]",
        res.status,
        u.origin,
        snippet.slice(0, 400),
      );
      return { items: [], nextCursor: null };
    }
    const body = (await res.json()) as Partial<FeedResponse>;
    if (!Array.isArray(body.items)) {
      console.error("[fetchFeedServer] réponse invalide: items absent");
      return { items: [], nextCursor: null };
    }
    return {
      items: body.items,
      nextCursor: body.nextCursor ?? null,
    };
  } catch (e) {
    console.error("[fetchFeedServer] erreur réseau", e);
    return { items: [], nextCursor: null };
  }
}

export async function fetchVideoDetailServer(
  slugId: string,
): Promise<VideoDetailDto | null> {
  try {
    const res = await fetch(
      serverApiUrl(`/v1/public/videos/${encodeURIComponent(slugId)}`),
      { cache: "no-store" },
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { video: VideoDetailDto };
    return data.video;
  } catch {
    return null;
  }
}

export async function fetchChannelVideosPage(
  handle: string,
  cursor?: string,
): Promise<{ channel: ChannelPageDto; videos: FeedResponse } | null> {
  try {
    const u = new URL(
      serverApiUrl(`/v1/public/channels/${encodeURIComponent(handle)}/videos`),
    );
    u.searchParams.set("limit", "24");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await fetch(u.toString(), { cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return res.json() as Promise<{ channel: ChannelPageDto; videos: FeedResponse }>;
  } catch {
    return null;
  }
}

export async function fetchPlaylistMetadataServer(
  id: string,
): Promise<{ title: string; description: string; privacy: string } | null> {
  try {
    const res = await fetch(
      serverApiUrl(`/v1/playlists/${encodeURIComponent(id)}`),
      {
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      playlist: { title: string; description: string; privacy: string };
    };
    return body.playlist;
  } catch {
    return null;
  }
}

export async function fetchSearchVideosServer(
  q: string,
): Promise<FeedResponse | null> {
  const trimmed = q.trim();
  if (trimmed.length < 2) return null;
  try {
    const u = new URL(serverApiUrl("/v1/public/search/videos"));
    u.searchParams.set("q", trimmed);
    u.searchParams.set("limit", "24");
    const res = await fetch(u.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    return res.json() as Promise<FeedResponse>;
  } catch {
    return null;
  }
}
