import { apiFetch } from "./api";

export type VideoLibraryStateDto = {
  inWatchLater: boolean;
  videoId: string;
  progressSec: number;
  completed: boolean;
};

export async function fetchVideoLibraryState(
  slugId: string,
): Promise<VideoLibraryStateDto> {
  const res = await apiFetch(
    `/v1/library/video-state/${encodeURIComponent(slugId)}`,
  );
  if (!res.ok) throw new Error("video-state");
  return res.json() as Promise<VideoLibraryStateDto>;
}
