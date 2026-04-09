/**
 * Client HTTP vers l’API Katante (cookies session sur le domaine / port API).
 *
 * - **Serveur Next** : `API_URL` (runtime, prioritaire) puis `NEXT_PUBLIC_API_URL`.
 * - **Navigateur** : charge `/api/public-config` une fois pour obteni `API_URL` à jour (évite les previews
 *   bloquées sur une ancienne URL figée au build).
 */

const DEFAULT_API = "http://localhost:4000";

/** Réservé au code serveur (RSC, routes) : pas de fetch client. */
export function getServerApiBaseUrl(): string {
  const raw =
    process.env.API_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
    "";
  if (!raw) return DEFAULT_API;
  try {
    new URL(raw);
    return raw;
  } catch {
    return DEFAULT_API;
  }
}

/** URL absolue pour fetch / liens côté **serveur uniquement**. */
export function serverApiUrl(path: string): string {
  const base = getServerApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Valeur inlinée au build client (fallback si `/api/public-config` échoue). */
function getBuildTimeClientBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ?? "";
  if (!raw) return DEFAULT_API;
  try {
    new URL(raw);
    return raw;
  } catch {
    return DEFAULT_API;
  }
}

let clientBasePromise: Promise<string> | null = null;

async function getBrowserApiBaseUrl(): Promise<string> {
  if (clientBasePromise) return clientBasePromise;
  clientBasePromise = (async () => {
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${origin}/api/public-config`, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.ok) {
        const json = (await res.json()) as { apiBaseUrl?: string | null };
        if (json.apiBaseUrl) {
          const b = json.apiBaseUrl.trim().replace(/\/$/, "");
          try {
            new URL(b);
            return b;
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* réseau / offline */
    }
    return getBuildTimeClientBase();
  })();
  return clientBasePromise;
}

export async function apiUrlForRequest(path: string): Promise<string> {
  const base =
    typeof window === "undefined"
      ? getServerApiBaseUrl()
      : await getBrowserApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base =
    typeof window === "undefined"
      ? getServerApiBaseUrl()
      : await getBrowserApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${base}${p}`;

  const headers = new Headers(init.headers);
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, {
    ...init,
    credentials: "include",
    headers,
  });
}
