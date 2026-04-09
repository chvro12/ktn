# SEO — Plateforme vidéo

Objectif : construire une architecture SEO crédible pour une plateforme vidéo réelle (type YouTube/Vimeo), compatible croissance organique, indexation massive et performance web.

Le SEO doit être pensé comme une couche produit complète, pas comme une optimisation cosmétique tardive.

## 1. Pages indexables prioritaires

Toujours rendre indexables en priorité.

### Pages vidéo (critique)

Structure cible :

```
/video/[videoSlug]-[videoId]
```

Exemple :

```
/video/comment-apprendre-react-3jfk29
```

Doivent contenir :

- metadata complètes
- structured data VideoObject
- contenu texte réel (description)
- titre optimisé
- miniature indexable
- canonical URL

### Pages chaîne

Structure cible :

```
/channel/[handle]
```

Contenu SEO attendu : description chaîne, liste vidéos, metadata propres, Open Graph optimisé, structured data Organization ou Person.

### Pages playlists

Structure cible :

```
/playlist/[playlistSlug]-[playlistId]
```

Valeur SEO forte car contenu regroupé thématiquement.

### Pages catégories

Structure cible :

```
/category/[slug]
```

Permettent : navigation thématique, landing SEO, clustering sémantique.

## 2. Pages NON indexables

Toujours exclure :

```
/watch-later
/history
/studio
/admin
/settings
/library
/notifications
```

Méthodes : `meta robots = noindex` ou `X-Robots-Tag`.

## 3. Metadata dynamiques obligatoires

Chaque page vidéo doit générer dynamiquement :

### Title

Format recommandé : `Titre vidéo – Nom chaîne`  
Exemple : `Apprendre React en 20 minutes – CodeLab`

### Meta description

Toujours générée depuis `video.description`. Fallback : `video.title + channel.name`.

### Open Graph

Minimum requis : `og:title`, `og:description`, `og:image`, `og:type=video.other`, `og:url`.

### Twitter Cards

Toujours activer `twitter:card=player` si player embed disponible. Sinon : `twitter:card=summary_large_image`.

## 4. Structured data VideoObject (critique)

Chaque page vidéo doit inclure `VideoObject`.

Champs obligatoires : `name`, `description`, `thumbnailUrl`, `uploadDate`, `duration`, `contentUrl`, `embedUrl`, `publisher`.

Exemple JSON-LD :

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Titre vidéo",
  "description": "Description",
  "thumbnailUrl": "https://cdn.site/thumb.jpg",
  "uploadDate": "2026-04-09",
  "duration": "PT4M12S",
  "embedUrl": "https://site.com/embed/id"
}
```

Impact direct sur : Google Video Search, rich snippets, preview SERP enrichie.

## 5. Sitemap dynamique

Toujours générer `/sitemap.xml` contenant : pages vidéos, pages chaînes, playlists, catégories.

Structure recommandée :

```
sitemap-index.xml
  videos-sitemap.xml
  channels-sitemap.xml
  playlists-sitemap.xml
```

Pagination obligatoire si > 50k URLs.

## 6. URLs propres et stables

Toujours utiliser `kebab-case`. Jamais `?id=839292`.

Toujours inclure `slug + id` pour éviter conflits, ex. `/video/react-hooks-guide-82hd72`.

## 7. Canonical URLs

Toujours définir `<link rel="canonical" />`.

Cas critiques : embed, paramètres tracking, tri, pagination.

Exemple : `/watch?v=id&utm=ads` → canonical vers `/video/slug-id`.

## 8. SSR / ISR stratégie (Next.js recommandé)

- Pages vidéo : **ISR** (trafic élevé, contenu stable, refresh possible).
- Pages chaînes : **ISR**.
- Homepage : **SSR** (personnalisée).
- Search : **SSR** (dynamique).

## 9. Miniatures optimisées SEO

Chaque miniature doit : être accessible publiquement, compressée, dimensions fixes, CDN-served.

Structure recommandée : `/thumbnails/videoId/default.jpg`

Toujours ajouter `alt="Titre vidéo"`.

## 10. Indexation progressive plateforme

Ne jamais exposer 100% du catalogue immédiatement.

**Phase 1** : indexer top vidéos, populaires, chaînes principales.

**Phase 2** : indexer progressivement le reste du catalogue.

Permet : crawl budget optimisé, ranking plus stable.

## 11. Internal linking stratégique

Chaque page vidéo doit inclure liens internes vers : chaîne, playlist associée, vidéos similaires, catégorie.

Impact : profondeur crawl réduite, autorité redistribuée.

## 12. Video embed strategy

Créer endpoint embed dédié : `/embed/[videoId]`

Permet : partage externe, backlinks naturels, distribution player.

Toujours inclure `rel=canonical` vers page vidéo principale.

## 13. Performance SEO vidéo

Optimiser : LCP, CLS, hydration time, player lazy load.

Ne jamais charger player complet avant interaction si possible. Utiliser pattern : preview thumbnail → click → load player.

## 14. Multilingual SEO (architecture)

Prévoir structure `/fr/video/`, `/en/video/`, `/es/video/` avec `hreflang`. Anticiper même si MVP mono-langue.

## 15. SEO Analytics

Toujours mesurer : impressions Google, CTR SERP, watch start depuis search, landing pages principales.

Stack recommandée : Search Console, Plausible ou PostHog.

## 16. Anti-patterns SEO à éviter

Ne jamais :

- utiliser seulement CSR,
- cacher description vidéo,
- générer URLs instables,
- oublier canonical,
- oublier structured data,
- indexer pages studio/admin,
- dupliquer pages vidéo,
- charger player trop tôt,
- oublier sitemap dynamique.
