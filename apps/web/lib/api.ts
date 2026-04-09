/**
 * Client HTTP vers l’API Katante (cookies session sur le domaine / port API).
 */

const DEFAULT_API = "http://localhost:4000";

/**
 * Base absolue de l’API. Les chaînes vides ou invalides (ex. sans schéma)
 * seraient interprétées comme URL relatives et cassent `new URL(...)` côté SSR.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";
  if (!raw) return DEFAULT_API;
  try {
    new URL(raw);
    return raw;
  } catch {
    return DEFAULT_API;
  }
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers,
  });
}
