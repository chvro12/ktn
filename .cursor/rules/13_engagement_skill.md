# Commentaires et engagement

Inclure :

- commentaires hiérarchiques simples,
- likes/dislikes si choisi,
- réponses,
- tri top / recent,
- suppression/édition par auteur,
- modération,
- rate limiting.

Le système d’engagement ne doit pas être pensé comme un simple CRUD ; il faut gérer :

- anti-spam,
- soft delete,
- report,
- compteur asynchrone ou transactionnel selon charge,
- collapse thread.
