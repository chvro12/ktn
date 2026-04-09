# ─── Build ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Outils natifs (Prisma, bcrypt…) + ffmpeg au build pour vérifier la dispo
RUN apk add --no-cache openssl python3 make g++

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Manifests uniquement → meilleur cache Docker
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json             ./packages/db/
COPY packages/media-process/package.json  ./packages/media-process/
COPY services/api/package.json            ./services/api/
COPY workers/media/package.json           ./workers/media/

RUN pnpm install --frozen-lockfile

# Sources
COPY packages/   ./packages/
COPY services/   ./services/
COPY workers/    ./workers/

# Compile media-process puis api
RUN pnpm run build:api

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:22-alpine

# ffmpeg + ffprobe pour transcodage HLS et génération de miniatures
RUN apk add --no-cache ffmpeg openssl

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Manifests
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json             ./packages/db/
COPY packages/media-process/package.json  ./packages/media-process/
COPY services/api/package.json            ./services/api/
COPY workers/media/package.json           ./workers/media/

# Dépendances de production uniquement
RUN pnpm install --frozen-lockfile --prod

# Résultats du build + sources des packages non compilés (@katante/db)
COPY --from=builder /app/packages/              ./packages/
COPY --from=builder /app/services/api/dist/     ./services/api/dist/
COPY --from=builder /app/packages/media-process/dist/ ./packages/media-process/dist/

# Répertoire médias persistant — monter un Railway Volume ici : /data/media
RUN mkdir -p /data/media
ENV MEDIA_ROOT=/data/media
ENV NODE_ENV=production

EXPOSE 4000

CMD ["pnpm", "run", "start"]
