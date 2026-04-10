export function formatViewCount(n: number | null | undefined): string {
  if (n == null) return "0 vue";
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    const label =
      v >= 10 ? String(Math.round(v)) : v.toFixed(1).replace(/\.0$/, "");
    return `${label} M vues`;
  }
  if (n >= 10_000) {
    const v = n / 1000;
    return `${Math.round(v)} k vues`;
  }
  if (n >= 1000) {
    const v = n / 1000;
    const label = v.toFixed(1).replace(/\.0$/, "");
    return `${label} k vues`;
  }
  if (n <= 1) return `${n} vue`;
  return `${new Intl.NumberFormat("fr-FR").format(n)} vues`;
}

export function formatDurationSec(sec: number | null | undefined): string {
  if (sec == null || sec < 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPublishedShort(iso: string | null | undefined | Date): string {
  if (!iso) return "";
  try {
    const d = iso instanceof Date ? iso : new Date(iso as string);
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return "";
  }
}

/** Durée ISO 8601 pour schema.org VideoObject (ex. PT4M12S). */
export function secondsToIso8601Duration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  let out = "PT";
  if (h > 0) out += `${h}H`;
  if (m > 0) out += `${m}M`;
  if (s > 0 || out === "PT") out += `${s}S`;
  return out;
}
