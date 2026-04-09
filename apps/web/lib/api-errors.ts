/** Réponse d’erreur normalisée de l’API Katante. */
export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

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
