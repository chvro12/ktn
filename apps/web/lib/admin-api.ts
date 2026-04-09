import { apiFetch } from "@/lib/api";
import type { AuthMeUser } from "@/lib/auth-me";

export type AdminStats = {
  userCount: number;
  videoCount: number;
  channelCount: number;
  openReportsCount: number;
  flaggedVideoCount: number;
};

export type AdminUserRow = Pick<
  AuthMeUser,
  "id" | "email" | "username" | "displayName" | "role" | "status" | "createdAt"
>;

export type AdminReportRow = {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  reporter: { id: string; displayName: string; email: string };
  targetLabel: string;
  targetPath: string | null;
};

export type AdminVideoModRow = {
  id: string;
  slug: string;
  title: string;
  moderationState: string;
  processingStatus: string;
  visibility: string;
  publishedAt: string | null;
  updatedAt: string;
  channel: { handle: string; name: string };
  watchPath: string;
};

export type AdminVideoDetail = {
  video: {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnailUrl: string | null;
    hlsUrl: string | null;
    durationSec: number | null;
    viewsCount: number;
    likesCount: number;
    moderationState: string;
    processingStatus: string;
    visibility: string;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
    watchPath: string;
    publicWatchPath: string;
    isPubliclyVisible: boolean;
    openReportsCount: number;
    totalReportsCount: number;
    channel: {
      id: string;
      handle: string;
      name: string;
      avatarUrl: string | null;
      verified: boolean;
    };
  };
};

export type AdminModerationActionRow = {
  id: string;
  targetType: string;
  targetId: string;
  actionType: string;
  notes: string | null;
  createdAt: string;
  admin: { id: string; displayName: string; email: string };
};

async function readApiError(res: Response, fallback: string): Promise<never> {
  const j = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
  };
  throw new Error(j.error?.message ?? fallback);
}

export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await apiFetch("/v1/admin/stats");
  if (!res.ok) await readApiError(res, "Statistiques indisponibles");
  return res.json() as Promise<AdminStats>;
}

export async function fetchAdminUsers(cursor?: string): Promise<{
  items: AdminUserRow[];
  nextCursor: string | null;
}> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await apiFetch(`/v1/admin/users${q}`);
  if (!res.ok) await readApiError(res, "Liste des utilisateurs indisponible");
  return res.json() as Promise<{
    items: AdminUserRow[];
    nextCursor: string | null;
  }>;
}

export async function patchAdminUser(
  userId: string,
  body: { role?: string; status?: string },
): Promise<{ user: AdminUserRow }> {
  const res = await apiFetch(`/v1/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) await readApiError(res, "Mise à jour impossible");
  return res.json() as Promise<{ user: AdminUserRow }>;
}

export async function fetchAdminReports(
  cursor?: string,
  status?: string,
): Promise<{ items: AdminReportRow[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (status) params.set("status", status);
  const qs = params.toString();
  const res = await apiFetch(`/v1/admin/reports${qs ? `?${qs}` : ""}`);
  if (!res.ok) await readApiError(res, "Signalements indisponibles");
  return res.json() as Promise<{
    items: AdminReportRow[];
    nextCursor: string | null;
  }>;
}

export async function patchAdminReport(
  reportId: string,
  body: { status: string; notes?: string },
): Promise<{ report: AdminReportRow }> {
  const res = await apiFetch(`/v1/admin/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) await readApiError(res, "Mise à jour impossible");
  return res.json() as Promise<{ report: AdminReportRow }>;
}

export async function fetchAdminVideosModeration(cursor?: string): Promise<{
  items: AdminVideoModRow[];
  nextCursor: string | null;
}> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await apiFetch(`/v1/admin/videos/moderation${q}`);
  if (!res.ok) await readApiError(res, "Liste vidéo indisponible");
  return res.json() as Promise<{
    items: AdminVideoModRow[];
    nextCursor: string | null;
  }>;
}

export async function patchAdminVideoModeration(
  videoId: string,
  body: { moderationState: string; notes?: string },
): Promise<{ video: AdminVideoModRow }> {
  const res = await apiFetch(`/v1/admin/videos/${videoId}/moderation`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) await readApiError(res, "Modération impossible");
  return res.json() as Promise<{ video: AdminVideoModRow }>;
}

export async function fetchAdminVideoDetail(
  videoId: string,
): Promise<AdminVideoDetail> {
  const res = await apiFetch(`/v1/admin/videos/${videoId}`);
  if (!res.ok) await readApiError(res, "Détail vidéo indisponible");
  return res.json() as Promise<AdminVideoDetail>;
}

export async function fetchModerationActions(cursor?: string): Promise<{
  items: AdminModerationActionRow[];
  nextCursor: string | null;
}> {
  const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
  const res = await apiFetch(`/v1/admin/moderation-actions${q}`);
  if (!res.ok) await readApiError(res, "Journal indisponible");
  return res.json() as Promise<{
    items: AdminModerationActionRow[];
    nextCursor: string | null;
  }>;
}
