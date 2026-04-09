import { UserRole } from "@katante/db";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../common/errors.js";
import type { CreateChannelBody } from "./channel.schemas.js";

export async function getChannelForOwner(userId: string) {
  return prisma.channel.findUnique({
    where: { ownerUserId: userId },
    select: {
      id: true,
      handle: true,
      name: true,
      description: true,
      avatarUrl: true,
      bannerUrl: true,
      verified: true,
      subscriberCount: true,
      createdAt: true,
    },
  });
}

export async function createChannel(userId: string, body: CreateChannelBody) {
  const handle = body.handle.toLowerCase();

  const existingOwner = await prisma.channel.findUnique({
    where: { ownerUserId: userId },
  });
  if (existingOwner) {
    throw new AppError(
      409,
      "CHANNEL_EXISTS",
      "Tu as déjà une chaîne pour ce compte",
    );
  }

  const handleTaken = await prisma.channel.findUnique({
    where: { handle },
  });
  if (handleTaken) {
    throw new AppError(409, "HANDLE_TAKEN", "Ce handle est déjà utilisé");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { role: true },
  });

  const channel = await prisma.$transaction(async (tx) => {
    const ch = await tx.channel.create({
      data: {
        ownerUserId: userId,
        handle,
        name: body.name.trim(),
        description: body.description?.trim() ?? "",
      },
      select: {
        id: true,
        handle: true,
        name: true,
        description: true,
        avatarUrl: true,
        bannerUrl: true,
        verified: true,
        subscriberCount: true,
        createdAt: true,
      },
    });

    if (user.role === UserRole.VIEWER) {
      await tx.user.update({
        where: { id: userId },
        data: { role: UserRole.CREATOR },
      });
    }

    return ch;
  });

  return channel;
}
