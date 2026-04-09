/** Origine du site Next (SEO, JSON-LD). Jamais chaîne vide / URL invalide. */
export function getMetadataBaseUrl(): URL {
  const fallback = "http://localhost:3000";
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return new URL(fallback);
  try {
    return new URL(raw);
  } catch {
    return new URL(fallback);
  }
}

export function getPublicSiteOrigin(): string {
  return getMetadataBaseUrl().origin;
}
