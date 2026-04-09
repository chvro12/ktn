# Conventions code

## Frontend

- composants UI petits et composables,
- composants métier séparés,
- hooks personnalisés propres,
- éviter logique lourde dans page.tsx,
- types explicites,
- aucun any inutile,
- dossier par domaine quand pertinent.

## Backend

- routes/controllers minces,
- services métier explicites,
- repository/data access séparé,
- erreurs normalisées,
- idempotence sur actions critiques,
- tests sur logique sensible.

## Naming

- noms métier réels,
- pas de noms flous type data2, temp, thing,
- états et enums centralisés.
