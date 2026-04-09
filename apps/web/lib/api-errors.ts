/** Réponse d’erreur normalisée de l’API Katante. */
export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

/** Erreur réseau typique quand l’URL d’API est fausse ou encore en localhost dans le bundle. */
export function formatClientFetchErrorMessage(error: unknown): string {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return (
      "Connexion à l’API impossible. Sur Vercel : variable NEXT_PUBLIC_API_URL = URL HTTPS " +
      "de ton API Railway (ex. https://…-production.up.railway.app), sans / à la fin. " +
      "Enregistre puis redéploie le site pour appliquer la variable."
    );
  }
  if (error instanceof Error) return error.message;
  return "Erreur inconnue";
}

export async function readApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (body.error?.message) return body.error.message;
  } catch {
    /* ignore */
  }
  return fallback;
}
