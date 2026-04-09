# ─── Build ───────────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl python3 make g++
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Manifests d'abord pour le cache Docker
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/db/package.json             ./packages/db/
COPY packages/db/prisma/                  ./packages/db/prisma/
COPY packages/media-process/package.json  ./packages/media-process/
# Le postinstall racine build aussi media-process (tsc) → source requise avant install
COPY packages/media-process/tsconfig.json ./packages/media-process/
COPY packages/media-process/src/          ./packages/media-process/src/
COPY services/api/package.json            ./services/api/
COPY workers/media/package.json           ./workers/media/

# Install complet — postinstall : prisma generate + build media-process
RUN pnpm install --frozen-lockfile

# Sources restantes (api, workers)
COPY services/ ./services/
COPY workers/  ./workers/

# Compile @katante/api (media-process déjà compilé par postinstall)
RUN pnpm --filter @katante/api build

# ─── Runtime ─────────────────────────────────────────────────────────────────
FROM node:22-alpine

# ffmpeg + ffprobe pour transcodage HLS et miniatures
RUN apk add --no-cache ffmpeg openssl

WORKDIR /app

# node_modules entier depuis le builder (évite de relancer postinstall --prod
# qui échoue car prisma est une devDep absente)
COPY --from=builder /app/node_modules       ./node_modules

# Sources des packages workspace (dont @katante/db non compilé)
COPY --from=builder /app/packages/          ./packages/

# API compilée
COPY --from=builder /app/services/api/dist/ ./services/api/dist/

# Fichiers workspace nécessaires à la résolution pnpm au runtime
COPY pnpm-workspace.yaml package.json ./

# Répertoire médias — monter un Railway Volume ici : /data/media
RUN mkdir -p /data/media
ENV MEDIA_ROOT=/data/media
ENV NODE_ENV=production

EXPOSE 4000

# Lance directement node sans passer par pnpm
CMD ["node", "services/api/dist/main.js"]
