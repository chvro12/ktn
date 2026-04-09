import { UserRole, UserStatus } from "@katante/db";
import bcrypt from "bcryptjs";
import type { FastifyReply } from "fastify";
import { prisma } from "../../lib/prisma.js";
import {
  createSessionSecretToken,
  hashSessionToken,
} from "../../lib/session-token.js";
import { AppError } from "../../common/errors.js";
import { SESSION_COOKIE } from "./auth.constants.js";
import type { LoginBody, RegisterBody } from "./auth.schemas.js";

const SESSION_DAYS = 14;

const BCRYPT_ROUNDS = 12;

// En prod, front et API sur des origines distinctes : Lax n’envoie pas le cookie sur fetch cross-site.
function sessionCookieOptions(maxAgeSec: number) {
  const isProd = process.env.NODE_ENV === "production";
  return {
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? "none" : "lax") as "lax" | "none",
    maxAge: maxAgeSec,
  };
}

export async function registerUser(body: RegisterBody) {
  const passwordHash = await bcrypt.hash(body.password, BCRYPT_ROUNDS);
  try {
    return await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        username: body.username.toLowerCase(),
        displayName: body.displayName,
        passwordHash,
        role: body.role ?? UserRole.VIEWER,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        createdAt: true,
      },
    });
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? (e as { code?: string }).code
        : undefined;
    if (code === "P2002") {
      throw new AppError(409, "DUPLICATE", "Email ou nom d’utilisateur déjà pris");
    }
    throw e;
  }
}

export async function loginUser(body: LoginBody) {
  const user = await prisma.user.findUnique({
    where: { email: body.email.toLowerCase() },
  });
  if (!user || !user.passwordHash) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Identifiants invalides");
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(403, "ACCOUNT_INACTIVE", "Compte inactif");
  }
  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Identifiants invalides");
  }
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function createSessionForUser(
  reply: FastifyReply,
  userId: string,
): Promise<void> {
  const raw = createSessionSecretToken();
  const tokenHash = hashSessionToken(raw);
  const expiresAt = new Date(
    Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  );
  await prisma.session.create({
    data: {
      userId,
      token: tokenHash,
      expiresAt,
    },
  });
  reply.setCookie(
    SESSION_COOKIE,
    raw,
    sessionCookieOptions(SESSION_DAYS * 24 * 60 * 60),
  );
}

export async function clearSession(reply: FastifyReply, rawCookie?: string) {
  if (rawCookie) {
    const tokenHash = hashSessionToken(rawCookie);
    await prisma.session.deleteMany({ where: { token: tokenHash } });
  }
  const isProd = process.env.NODE_ENV === "production";
  reply.clearCookie(SESSION_COOKIE, {
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
}

export async function getUserFromSession(
  rawCookie: string | undefined,
) {
  if (!rawCookie) return null;
  const tokenHash = hashSessionToken(rawCookie);
  const session = await prisma.session.findFirst({
    where: {
      token: tokenHash,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          role: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });
  if (!session || session.user.status !== UserStatus.ACTIVE) {
    return null;
  }
  return session.user;
}
