import type { FastifyReply } from "fastify";
import { Prisma } from "@katante/db";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
): void {
  void reply.status(statusCode).send({ error: { code, message } });
}

export function handleRouteError(reply: FastifyReply, err: unknown): void {
  if (err instanceof ZodError) {
    void reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Paramètres invalides",
        details: err.flatten(),
      },
    });
    return;
  }
  if (err instanceof AppError) {
    sendError(reply, err.statusCode, err.code, err.message);
    return;
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    console.error(err);
    sendError(
      reply,
      503,
      "DATABASE_UNAVAILABLE",
      "Connexion à la base impossible. Vérifie DATABASE_URL sur Railway (Neon : hôte pooler + paramètre pgbouncer=true).",
    );
    return;
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(err);
    const hint =
      err.code === "P2021" || err.code === "P2010"
        ? "Table ou colonne manquante : lance les migrations sur cette base (pnpm db:migrate:deploy)."
        : err.meta && typeof err.meta === "object" && "message" in err.meta
          ? String((err.meta as { message?: unknown }).message ?? err.code)
          : err.code;
    sendError(reply, 503, "DATABASE_ERROR", hint);
    return;
  }
  console.error(err);
  sendError(reply, 500, "INTERNAL_ERROR", "Erreur serveur");
}
