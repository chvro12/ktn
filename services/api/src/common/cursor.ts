import { AppError } from "./errors.js";

export type TimeIdCursor = { t: string; id: string };

/** Curseur stable (date DESC, id DESC) — publications, commentaires, etc. */
export function encodeTimeIdCursor(date: Date, id: string): string {
  const payload: TimeIdCursor = { t: date.toISOString(), id };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function encodeCursor(row: { publishedAt: Date | null; id: string }): string {
  if (!row.publishedAt) {
    throw new Error("encodeCursor: publishedAt manquant");
  }
  return encodeTimeIdCursor(row.publishedAt, row.id);
}

export function decodeCursor(raw: string): TimeIdCursor {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const data = JSON.parse(json) as TimeIdCursor;
    if (
      typeof data?.t !== "string" ||
      typeof data?.id !== "string" ||
      Number.isNaN(Date.parse(data.t))
    ) {
      throw new Error("invalid");
    }
    return data;
  } catch {
    throw new AppError(400, "INVALID_CURSOR", "Curseur de pagination invalide");
  }
}
