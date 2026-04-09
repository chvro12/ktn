import {
  PrismaClient,
  UserRole,
  UserStatus,
  VideoModerationState,
  VideoProcessingStatus,
  VideoVisibility,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@katante.local";
  const password = "DemoKatante12345";
  const adminEmail = "admin@katante.local";
  const adminPassword = "AdminKatante12345";

  const passwordHash = bcrypt.hashSync(password, 12);
  const adminPasswordHash = bcrypt.hashSync(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      username: "katante_admin",
      displayName: "Administrateur",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
    update: {
      role: UserRole.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      username: "demokatante",
      displayName: "Chaîne démo Katante",
      passwordHash,
      role: UserRole.CREATOR,
      status: UserStatus.ACTIVE,
    },
    update: {},
  });

  const channel = await prisma.channel.upsert({
    where: { ownerUserId: user.id },
    create: {
      ownerUserId: user.id,
      handle: "demokatante",
      name: "Katante démo",
      description:
        "Chaîne de démonstration pour le fil d’accueil, les pages watch et chaîne.",
    },
    update: {
      name: "Katante démo",
      description:
        "Chaîne de démonstration pour le fil d’accueil, les pages watch et chaîne.",
    },
  });

  const demos = [
    {
      slug: "decouvrir-katante",
      title: "Découvrir Katante en deux minutes",
      description:
        "Présentation rapide de la plateforme : vision viewer, chaîne, et prochaines étapes produit.",
      durationSec: 125,
      thumb: "https://picsum.photos/seed/katante1/640/360",
    },
    {
      slug: "architecture-pipeline-video",
      title: "Architecture d’un pipeline vidéo réaliste",
      description:
        "Upload signé, transcodage, HLS et CDN : les briques techniques derrière une VOD crédible.",
      durationSec: 842,
      thumb: "https://picsum.photos/seed/katante2/640/360",
    },
    {
      slug: "ux-plateforme-media",
      title: "UX d’une plateforme média premium",
      description:
        "Densité, hiérarchie et états vides : ce qui différencie un produit d’une démo « vibe coded ».",
      durationSec: 418,
      thumb: "https://picsum.photos/seed/katante3/640/360",
    },
  ];

  for (const d of demos) {
    const existing = await prisma.video.findFirst({
      where: { channelId: channel.id, slug: d.slug },
    });
    if (existing) continue;

    await prisma.video.create({
      data: {
        channelId: channel.id,
        slug: d.slug,
        title: d.title,
        description: d.description,
        durationSec: d.durationSec,
        thumbnailUrl: d.thumb,
        visibility: VideoVisibility.PUBLIC,
        processingStatus: VideoProcessingStatus.READY,
        moderationState: VideoModerationState.NONE,
        publishedAt: new Date(),
        viewsCount: Math.floor(Math.random() * 12_000),
      },
    });
  }

  // eslint-disable-next-line no-console
  console.info(
    "Seed OK — démo",
    email,
    "/",
    password,
    "— admin",
    adminEmail,
    "/",
    adminPassword,
    "— chaîne @",
    channel.handle,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
