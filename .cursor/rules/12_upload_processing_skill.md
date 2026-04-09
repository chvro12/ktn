# Upload & processing

Le flow upload doit ressembler à un vrai studio créateur.

## Étapes

1. sélection fichier
2. validation type/poids/durée
3. upload avec progression
4. saisie metadata
5. miniature
6. visibilité
7. checks automatiques
8. publication ou sauvegarde en draft

## Backend flow

- créer draft vidéo,
- émettre URL signée,
- upload source,
- marquer uploaded,
- enqueue transcoding,
- générer HLS + thumbnails,
- extraire metadata,
- update video status,
- notifier créateur si success/failed.

## États UI

- pending
- uploading
- processing
- ready
- failed

Le flow doit être résistant aux refresh, reprise, erreurs réseau.
