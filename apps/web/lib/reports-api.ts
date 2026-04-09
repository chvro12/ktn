import { apiFetch } from "@/lib/api";

export type CreateReportBody = {
  targetType: "VIDEO" | "COMMENT" | "CHANNEL" | "USER";
  targetId: string;
  reason: string;
  details?: string;
};

export async function submitReport(
  body: CreateReportBody,
): Promise<{ report: { id: string; status: string; createdAt: string } }> {
  const res = await apiFetch("/v1/reports", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const j = (await res.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(j.error?.message ?? "Envoi du signalement impossible");
  }
  return res.json() as Promise<{
    report: { id: string; status: string; createdAt: string };
  }>;
}
