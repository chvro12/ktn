# Katante

Plateforme vidéo — dépôt applicatif (site, API, base de données, traitement des médias).

## Prérequis

- Node 20+
- [Corepack](https://nodejs.org/api/corepack.html) activé (`corepack enable`)
- PostgreSQL (machine locale ou Docker)

Configuration : copie `.env.example` vers **`.env`** à la racine du dépôt (une seule fois), puis adapte les valeurs si besoin.

### PostgreSQL avec Docker

```bash
docker compose up -d
```

Quand la base est prête : migrations, optionnellement jeu de données de démo, puis lancement des services.

## Démarrage

```bash
cp .env.example .env
pnpm install
pnpm db:migrate
pnpm dev
```

- **Web** : http://localhost:3000  
- **API** : http://localhost:4000 (contrôle : `GET /health`)

Données de démo après migration : `pnpm db:seed`.  
Transcodage vidéo (optionnel, autre terminal) : `pnpm dev:worker`.  
Fichiers média : par défaut `data/media/` (voir `.env.example` pour les réglages).

## Déploiement Vercel (frontend)

Le fichier **`vercel.json` à la racine** force le preset **Next.js** et le build `pnpm --filter @katante/web build` (la racine du monorepo n’a pas `next` dans `package.json`, sans quoi Vercel peut se tromper et demander un dossier de sortie **`public`**).

Dans le tableau de bord Vercel → *Project Settings* → *Build & Development* :

- **Root Directory** : laisse vide (racine du dépôt) **ou** mets `apps/web` ; dans ce second cas, le `vercel.json` utile est surtout celui dans `apps/web/`.
- **Output Directory** : laisse le champ **vide** / désactive l’override (ne mets pas `public`).
- **Framework Preset** : Next.js (souvent déduit après correction ci‑dessus).

Variables d’environnement côté production : `NEXT_PUBLIC_SITE_URL` ; pour l’API, **`API_URL`** (https, lue au runtime — idéal pour les previews sans rebuild) et/ou **`NEXT_PUBLIC_API_URL`** (même valeur).

## Documentation technique

Référence d’architecture, routes HTTP et schéma de données : `docs/PHASE1_ARCHITECTURE.md`, `packages/db/prisma/schema.prisma`.
