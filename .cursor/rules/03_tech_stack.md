# Stack cible recommandée

Toujours justifier les choix par : simplicité MVP, coût, maintenabilité, scalabilité.

## Frontend web

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui pour certains primitives
- Zustand ou TanStack Query selon usage
- React Hook Form + Zod
- Framer Motion avec modération
- Video player custom sur base HTML5 / hls.js

## Backend

- Next.js server actions pour petites actions ou API route BFF
- Backend principal en NestJS ou Express structuré si séparation nécessaire
- PostgreSQL
- Prisma ou Drizzle
- Redis pour cache, sessions, compteurs, rate limiting
- Queue: BullMQ / Redis ou RabbitMQ selon complexité

## Média

- Stockage objet: S3 compatible
- CDN
- Transcoding via FFmpeg workers / Mux / Cloudflare Stream / AWS MediaConvert selon budget
- HLS comme format principal de diffusion
- génération thumbnails + preview sprites

## Search

- PostgreSQL FTS pour MVP
- Meilisearch / OpenSearch si montée en charge

## Auth / sécurité

- Clerk / Auth.js / custom auth
- JWT + refresh ou session server-side
- RBAC
- anti-abuse / rate limiting

## Observabilité

- Sentry
- logs structurés
- metrics
- tracing minimal

## Déploiement

- Vercel pour frontend si pertinent
- backend/worker sur Railway / Fly / Render / AWS / GCP
- stockage cloud + CDN
