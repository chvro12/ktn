export type ChannelSummary = {
  handle: string;
  name: string;
  avatarUrl: string | null;
};

export type VideoCardDto = {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  publishedAt: string | null;
  viewsCount: number;
  channel: ChannelSummary;
};

export type FeedResponse = {
  items: VideoCardDto[];
  nextCursor: string | null;
};

export type VideoDetailDto = {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  durationSec: number | null;
  publishedAt: string | null;
  viewsCount: number;
  likesCount: number;
  hlsUrl: string | null;
  language: string | null;
  channel: {
    id: string;
    handle: string;
    name: string;
    avatarUrl: string | null;
    subscriberCount: number;
    verified: boolean;
  };
};

export type ChannelPageDto = {
  id: string;
  handle: string;
  name: string;
  description: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  verified: boolean;
  subscriberCount: number;
  createdAt: string;
};
