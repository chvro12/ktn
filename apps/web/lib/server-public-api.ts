import { apiUrl } from "@/lib/api";
import type {
  ChannelPageDto,
  FeedResponse,
  VideoDetailDto,
} from "@/lib/types/public";

const defaultRevalidate = 60;

export async function fetchFeedServer(cursor?: string): Promise<FeedResponse> {
  try {
    const u = new URL(apiUrl("/v1/public/videos/feed"));
    u.searchParams.set("limit", "24");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await fetch(u.toString(), { next: { revalidate: defaultRevalidate } });
    if (!res.ok) {
      return { items: [], nextCursor: null };
    }
    return res.json() as Promise<FeedResponse>;
  } catch {
    return { items: [], nextCursor: null };
  }
}

export async function fetchVideoDetailServer(
  slugId: string,
): Promise<VideoDetailDto | null> {
  try {
    const res = await fetch(
      apiUrl(`/v1/public/videos/${encodeURIComponent(slugId)}`),
      { next: { revalidate: 120 } },
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
      apiUrl(`/v1/public/channels/${encodeURIComponent(handle)}/videos`),
    );
    u.searchParams.set("limit", "24");
    if (cursor) u.searchParams.set("cursor", cursor);
    const res = await fetch(u.toString(), { next: { revalidate: defaultRevalidate } });
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
    const res = await fetch(apiUrl(`/v1/playlists/${encodeURIComponent(id)}`), {
      next: { revalidate: 120 },
    });
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
    const u = new URL(apiUrl("/v1/public/search/videos"));
    u.searchParams.set("q", trimmed);
    u.searchParams.set("limit", "24");
    const res = await fetch(u.toString(), { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return res.json() as Promise<FeedResponse>;
  } catch {
    return null;
  }
}
