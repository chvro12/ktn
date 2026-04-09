import { apiFetch } from "@/lib/api";

export type AuthMeUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export type AuthMeResponse =
  | { user: AuthMeUser }
  | { error: { code: string; message: string } };

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<AuthMeResponse>;
}
