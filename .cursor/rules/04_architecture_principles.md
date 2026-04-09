# Architecture produit à respecter

La plateforme doit être pensée par domaines métier.

## Domaines principaux

- Identity & Accounts
- Channels
- Videos
- Upload & Processing
- Playback
- Search & Discovery
- Engagement (likes, comments, subscriptions)
- Playlists & Library
- Notifications
- Moderation
- Analytics
- Admin / CMS

## Règles d’architecture

- séparer clairement UI, logique métier, accès données,
- éviter les composants fourre-tout,
- utiliser des services métier explicites,
- isoler les workflows async de traitement vidéo,
- gérer les statuts métier de façon stricte,
- toute action critique doit être idempotente,
- tout workflow async doit être observable.

## Exemple de flux upload

1. créateur crée un draft vidéo,
2. backend génère URL d’upload signée,
3. client upload la source,
4. backend enregistre réception,
5. job de transcodage déclenché,
6. génération thumbnails / durée / metadata,
7. vidéo passe en READY ou FAILED,
8. publication si validée.

## États vidéo recommandés

- DRAFT
- UPLOADING
- UPLOADED
- PROCESSING
- READY
- PUBLISHED
- PRIVATE
- UNLISTED
- BLOCKED
- DELETED
- FAILED

Ne jamais coder une plateforme vidéo sans state model explicite.
