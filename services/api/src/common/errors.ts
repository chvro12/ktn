import type { FastifyReply } from "fastify";
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
  console.error(err);
  sendError(reply, 500, "INTERNAL_ERROR", "Erreur serveur");
}
