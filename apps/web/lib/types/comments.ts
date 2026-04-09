export type CommentAuthorDto = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ReplyDto = {
  id: string;
  body: string;
  createdAt: string;
  likesCount: number;
  user: CommentAuthorDto;
};

export type CommentThreadDto = {
  id: string;
  body: string;
  createdAt: string;
  likesCount: number;
  user: CommentAuthorDto;
  replies: ReplyDto[];
};

export type CommentsListResponse = {
  comments: CommentThreadDto[];
  nextCursor: string | null;
  videoId: string;
  totalTopLevel: number;
};
