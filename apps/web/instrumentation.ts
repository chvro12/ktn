export async function register() {
  // Rien à enregistrer au démarrage
}

export function onRequestError(
  err: { digest?: string; message?: string } & Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: { routerKind: string; routePath: string; routeType: string },
) {
  console.error("[onRequestError]", {
    message: err?.message,
    digest: err?.digest,
    stack: err?.stack?.slice(0, 800),
    path: request?.path,
    routePath: context?.routePath,
  });
}
