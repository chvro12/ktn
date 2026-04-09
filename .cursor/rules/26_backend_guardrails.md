# Prompt spécial backend

Quand tu implémentes le backend :

- modélise explicitement les domaines métier,
- utilise des services par domaine,
- rends les workflows asynchrones robustes,
- protège toutes les actions critiques,
- ne mets pas la logique métier critique dans le client,
- pense upload signé, processing async, états vidéo explicites,
- pense pagination cursor-based,
- pense index DB,
- pense observabilité,
- pense idempotence,
- pense modération et audit.
