# Phase 1 — Architecture globale (plateforme vidéo)

Document de référence : aligné sur `.cursor/rules/*` et le cahier des charges produit (viewer + studio + admin + pipeline média + SEO + analytics).

---

## 1. Principes

- **Produit réel** : domaines découplés, services métier explicites, pas de logique critique dans le client.
- **Async first** : upload signé, traitement média en workers, transitions de statut observables et idempotentes.
- **SEO public** : pages vidéo chaîne / playlist en SSR ou ISR avec `VideoObject`, hors index pour compte / studio / admin.
- **Sécurité** : session serveur, RBAC, validation Zod côté API, rate limiting (Redis), signed URLs à durée courte.

---

## 2. Vue d’ensemble (runtime)

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Next.js (web)  │ ◄────────────► │  API Node (HTTP)  │
│  App Router BFF │   cookies      │  modules métier   │
└────────┬────────┘                └────────┬─────────┘
         │                                   │
         │ TanStack Query                    │ Prisma
         ▼                                   ▼
┌─────────────────┐                ┌──────────────────┐
│  CDN + assets   │                │   PostgreSQL     │
└─────────────────┘                └────────┬─────────┘
         ▲                                  │
         │ HLS / thumbs                     │
┌────────┴────────┐                ┌────────▼─────────┐
│  Object storage │ ◄──────────────│  Redis (+queue) │
│  (S3 compat)    │   workers      │  BullMQ jobs    │
└─────────────────┘                └────────┬─────────┘
                                            │
                                   ┌────────▼─────────┐
                                   │ Worker(s) média   │
                                   │ FFmpeg → HLS      │
                                   └──────────────────┘
```

- Le **frontend** appelle des **Route Handlers** ou un **BFF** Next pour les actions qui doivent partager la session ; l’**API Node** (ou modules montés derrière le même dépôt) concentre Prisma, files signés, enqueue jobs.
- Les **workers** consomment Redis/BullMQ : transcodage, thumbnails, (plus tard) sprites timeline — **même code métier** de transition de statut, appelé idempotent (ex. `completeProcessing(videoId, assetVersion)`).

---

## 3. Domaines métier (découpage obligatoire)

| Domaine             | Responsabilité principale |
|--------------------|----------------------------|
| **identity**       | Comptes, sessions, rôles RBAC, profil viewer/creator |
| **channels**       | Chaîne, handle, branding, compteur abonnés (cache/dénormalisation + vérité relationnelle) |
| **videos**         | Métadonnées, slug, visibilité, statut pipeline, pub/dépub |
| **upload-processing** | Draft, URL signée, clés objet, orchestration jobs, idempotence |
| **playback**       | Résolution URL HLS/CDN, contrôles d’accès (privé / non listé / bloqué) |
| **search-discovery** | FTS Postgres MVP, filtres tri, pagination curseur ; façade pour Meilisearch plus tard |
| **engagement**     | Commentaires, réactions (likes), modèle anti-spam, compteurs |
| **playlists-library** | Playlists, watch later, historique, reprise lecture |
| **notifications**  | Outbox / in-app, types typés |
| **moderation**     | Signalements, files admin, actions tracées |
| **analytics**      | Événements bruts + agrégats journaliers (`videoAnalyticsDaily`) |
| **admin**          | RBAC admin, gestion utilisateurs, overrides modération |

Chaque domaine = **service(s)** + accès données (repository ou Prisma encapsulé) + **DTO Zod** pour les entrées/sorties API. Pas de « god service » transversal.

---

## 4. Structure de dossiers recommandée (monorepo)

Adaptation de `.cursor/rules/22_project_structure.md` + séparation API/workers explicite.

```
apps/
  web/                          # Next.js App Router
    app/
      (public)/                 # routes SEO-friendly
      (app)/                    # shell connecté
      api/                      # route handlers BFF si besoin
    components/
      ui/                       # shadcn
      layout/
      video/
      channel/
      comments/
      playlists/
    features/
      auth/
      home/
      watch/
      search/
      channel/
      studio/
      admin/
      engagement/
    lib/                        # clients API typés, query keys
    hooks/

services/
  api/
    src/
      main.ts                   # bootstrap HTTP (Fastify ou Express)
      config/
      modules/
        identity/
        channels/
        videos/
        uploads/
        playback/
        search/
        comments/
        subscriptions/
        playlists/
        notifications/
        moderation/
        analytics/
        admin/
      common/                   # erreurs, pagination curseur, guards RBAC

workers/
  media/
    src/
      processors/
        transcode.ts
        thumbnails.ts
  analytics/
    src/
      aggregate-daily.ts

packages/
  db/
    prisma/
      schema.prisma
  types/                        # enums + types partagés (si hors Prisma client)
  config/
```

**Justification** : `apps/web` reste focalisé UI + accès données via API ; `services/api` garde toute règle métier et secrets (signatures S3, clés worker) ; `workers` scale indépendamment.

---

## 5. Stack — justification courte

| Couche | Choix | Pourquoi |
|--------|--------|----------|
| UI | Next.js App Router, Tailwind, shadcn | SSR/ISR SEO, layouts imbriqués, ecosystem mature |
| Data fetching | TanStack Query | Cache, stale-while-revalidate, mutations orchestrées |
| API | Node modulaire (Fastify recommandé) + Zod | Performant, schémas partageables, services clairs |
| ORM | Prisma | Migrations, typage, bon DX multi-package |
| DB | PostgreSQL | FTS intégré, intégrité relationnelle, agrégats analytics |
| Cache / queue | Redis + BullMQ | Sessions optionnelles, rate limit, jobs média avec retry |
| Auth | Session cookie (httpOnly, secure) | Pas d’exposition tokens au client ; RBAC côté serveur |
| Média | S3 + FFmpeg workers + HLS | Standard industrie, CDN-ready |

---

## 6. RBAC (rôles)

Enum `UserRole` : `VIEWER` | `CREATOR` | `ADMIN`.

- **VIEWER** : consommation, engagement (selon règles), playlists perso.
- **CREATOR** : tout viewer + studio + upload + métadonnées de ses vidéos/chaîne.
- **ADMIN** : moderation, users, actions audit — **guards dédiés** sur routes `/admin` et modules `moderation`, `admin`.

Les permissions fines (ex. éditer une vidéo) : **ownership** `channel.ownerUserId === session.userId` ou admin.

---

## 7. Modèle de statuts vidéo (enums distincts)

Conformément aux règles projet, **ne pas mélanger** visibilité et pipeline.

- **`VideoProcessingStatus`** : cycle de vie technique — `DRAFT`, `UPLOADING`, `UPLOADED`, `PROCESSING`, `READY`, `FAILED`, `DELETED`.
- **`VideoVisibility`** : `PUBLIC`, `UNLISTED`, `PRIVATE`.
- **`VideoModerationState`** (optionnel mais recommandé) : `NONE`, `LIMITED`, `BLOCKED` — ou intégrer `BLOCKED` dans un statut métier séparé pour ne pas polluir le pipeline FFmpeg.

**Publication** : ex. `publishedAt` non null + `processingStatus === READY` + `moderationState !== BLOCKED` — ou enum `VideoPublishState` si tu préfères expliciter `PUBLISHED` côté métier.

Le schéma Prisma dans `prisma/schema.prisma` matérialise ces enums (voir fichier).

---

## 8. Pagination curseur

 Convention : tri stable `(createdAt DESC, id DESC)` (ou `publishedAt`). Réponse API : `{ items, nextCursor }` où `nextCursor` encode le dernier couple (timestamp, id). Index composites sur les tables listées en feed (vidéos par chaîne, commentaires par vidéo, etc.).

---

## 9. Idempotence pipeline upload

- Clé idempotence : `videoId` + `assetType` + `uploadSessionId` (UUID côté client ou serveur).
- Webhook / callback worker : **upsert** `VideoAsset` et transition `PROCESSING → READY | FAILED` avec contrainte « une seule transition gagnante » (version ou `processingJobId`).
- Jobs BullMQ : `jobId` dérivé de `videoId:transcode:v{n}` pour éviter doublons.

---

## 10. Search (MVP)

- Colonne `tsvector` (ex. sur `videos.title`, `description`, `channels.name`) + index GIN (migration SQL brute si besoin au-delà de Prisma).
- Module `search` exposant un seul use-case « query + filtres + curseur » ; **interface** permettant de brancher Meilisearch sans changer les consumers front.

---

## 11. SEO (couche prévue dès Phase 1 design)

- URLs : `/video/[slug]-[id]`, `/channel/[handle]`, `/playlist/[slug]-[id]`, `/category/[slug]`.
- `noindex` pour `/studio`, `/admin`, `/watch-later`, `/history`, `/settings`, `/library`, `/notifications`.
- Embed : `/embed/[videoId]` avec canonical vers page vidéo.

---

## 12. Analytics (couche prévue)

- Tables événements bruts (optionnel MVP) ou envoi direct vers agrégation + **jobs daily** pour `VideoAnalyticsDaily`.
- Événements minimaux : `watch_start`, `progress` (paliers 25/50/75/100), `watch_complete`, clics engagement.

---

## 13. Prochaine étape d’implémentation

1. Initialiser le monorepo (pnpm workspaces), `packages/db`, migrations Prisma.
2. Bootstrap `services/api` avec module `identity` + session.
3. `apps/web` : shell + design tokens + routes publiques squelette.

Le schéma DB initial est dans **`packages/db/prisma/schema.prisma`** (migrations sous `packages/db/prisma/migrations/`).
