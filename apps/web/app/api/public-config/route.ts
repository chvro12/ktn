import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * URL d’API lue au **runtime** sur Vercel (`API_URL`), sans être figée dans le bundle JS.
 * Le client appelle cette route pour savoir où envoyer les requêtes (previews, changement d’URL Railway).
 */
export async function GET() {
  const apiBaseUrl =
    process.env.API_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
    null;

  return NextResponse.json({ apiBaseUrl });
}
