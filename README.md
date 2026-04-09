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

## Documentation technique

Référence d’architecture, routes HTTP et schéma de données : `docs/PHASE1_ARCHITECTURE.md`, `packages/db/prisma/schema.prisma`.
