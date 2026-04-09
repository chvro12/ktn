/**
 * Crée ou promeut un compte administrateur.
 *
 * Usage (à la racine du monorepo, avec .env contenant DATABASE_URL) :
 *   ADMIN_EMAIL=user@example.com ADMIN_PASSWORD='…' pnpm db:create-admin
 */
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

function baseUsernameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "admin";
  const safe = local.replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase();
  return safe.slice(0, 24) || "admin";
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email || !password) {
    console.error(
      "Variables requises : ADMIN_EMAIL et ADMIN_PASSWORD (ex. pnpm db:create-admin)",
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash,
      },
    });
    // eslint-disable-next-line no-console
    console.info("Compte existant mis à jour : ADMIN + mot de passe réinitialisé —", email);
    return;
  }

  let username = baseUsernameFromEmail(email);
  let suffix = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${baseUsernameFromEmail(email)}_${suffix}`.slice(0, 30);
  }

  const displayName =
    email
      .split("@")[0]
      ?.replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Administrateur";

  await prisma.user.create({
    data: {
      email,
      username,
      displayName,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  // eslint-disable-next-line no-console
  console.info("Compte admin créé —", email, "— username :", username);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
