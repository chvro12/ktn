import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../common/errors.js";
import { getPublicChannelByHandle } from "../channels/channel-public.service.js";

export async function getSubscriptionStatus(userId: string, handle: string) {
  const channel = await getPublicChannelByHandle(handle);
  const row = await prisma.subscription.findUnique({
    where: {
      followerUserId_channelId: {
        followerUserId: userId,
        channelId: channel.id,
      },
    },
    select: { followerUserId: true },
  });
  return {
    subscribed: row != null,
    subscriberCount: channel.subscriberCount,
    channelId: channel.id,
    ownerUserId: channel.ownerUserId,
  };
}

export async function subscribeToChannel(userId: string, handle: string) {
  const channel = await getPublicChannelByHandle(handle);
  if (channel.ownerUserId === userId) {
    throw new AppError(
      400,
      "SUBSCRIBE_SELF",
      "Tu ne peux pas t’abonner à ta propre chaîne",
    );
  }

  const existing = await prisma.subscription.findUnique({
    where: {
      followerUserId_channelId: {
        followerUserId: userId,
        channelId: channel.id,
      },
    },
  });

  if (existing) {
    return {
      subscribed: true,
      subscriberCount: channel.subscriberCount,
    };
  }

  await prisma.$transaction([
    prisma.subscription.create({
      data: { followerUserId: userId, channelId: channel.id },
    }),
    prisma.channel.update({
      where: { id: channel.id },
      data: { subscriberCount: { increment: 1 } },
    }),
  ]);

  const updated = await prisma.channel.findUniqueOrThrow({
    where: { id: channel.id },
    select: { subscriberCount: true },
  });

  return { subscribed: true, subscriberCount: updated.subscriberCount };
}

export async function unsubscribeFromChannel(userId: string, handle: string) {
  const channel = await getPublicChannelByHandle(handle);
  const existing = await prisma.subscription.findUnique({
    where: {
      followerUserId_channelId: {
        followerUserId: userId,
        channelId: channel.id,
      },
    },
  });

  if (!existing) {
    return {
      subscribed: false,
      subscriberCount: channel.subscriberCount,
    };
  }

  await prisma.$transaction([
    prisma.subscription.delete({
      where: {
        followerUserId_channelId: {
          followerUserId: userId,
          channelId: channel.id,
        },
      },
    }),
    prisma.channel.update({
      where: { id: channel.id },
      data: {
        subscriberCount: { decrement: 1 },
      },
    }),
  ]);

  const updated = await prisma.channel.findUniqueOrThrow({
    where: { id: channel.id },
    select: { subscriberCount: true },
  });

  const safe = Math.max(0, updated.subscriberCount);
  if (safe !== updated.subscriberCount) {
    await prisma.channel.update({
      where: { id: channel.id },
      data: { subscriberCount: safe },
    });
  }

  return { subscribed: false, subscriberCount: safe };
}
