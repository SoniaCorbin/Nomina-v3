# NOMINA Backend

API Node.js/TypeScript pour générer des idées de noms, personnages, lieux, concepts et fragments d’histoire.

- Stack: Express + Prisma + PostgreSQL
- Auth: Clerk (optionnel selon les routes)
- Référence projet: `docs/Dossier_Presentation_Nomina.md`

---

## Prérequis

- Node.js 20+
- PostgreSQL accessible via `DATABASE_URL`

---

## Installation

```bash
npm install
```

---

## Variables d’environnement

Créer `Nomina-backend/.env` avec les variables suivantes:

### Obligatoire

- `DATABASE_URL` : chaîne de connexion PostgreSQL

### Recommandées

- `PORT` : port du serveur (défaut: `3000`)
- `CORS_ORIGINS` : liste d’origins autorisées, séparées par des virgules
- `FRONTEND_URL` : URL principale du frontend

### Authentification Clerk (routes protégées)

- `CLERK_SECRET_KEY` : requis pour `/auth/*`
- `ADMIN_CLERK_USER_IDS` (ou `ADMIN_CLERK_USER_ID`) : requis pour `/auth/admin/ping`
- `ALLOW_DEV_ADMIN_BYPASS` : laisser `false` en usage normal (si `true`, seul `DEV_ADMIN_USER_ID` peut bypass en local)
- `BOOTSTRAP_FIRST_ADMIN` : laisser `false` pour éviter toute promotion admin implicite du premier compte

### Pack IA — OpenAI (optionnel)

- `OPENAI_API_KEY` : clé secrète OpenAI (requis pour l'endpoint `/generate-pack`)
- `OPENAI_MODEL` : modèle OpenAI à utiliser (défaut : `gpt-4o-mini`)

---

## Commandes utiles

```bash
npm run dev              # développement
npm run build            # build TypeScript + génération Prisma
npm start                # exécution en production (dist)
npm run migrate          # migration locale Prisma
npm run migrate:deploy   # migration de déploiement
npm run seed             # seed principal
npm run seed:realism     # seed des données de réalisme (classes, métiers, relations, etc.)
npm test                 # tests backend (Jest)
```

---

## Endpoints principaux

### Santé

- `GET /` : message de service
- `GET /healthz` : état de santé

### Génération (public)

- `GET /generate/npcs`
- `GET /generate/nom-personnages`
- `GET /generate/lieux`
- `GET /generate/fragments-histoire`
- `GET /generate/titres`
- `GET /generate/concepts`

### Pack IA — OpenAI

- `POST /generate-pack` : génère un pack narratif complet via OpenAI.

  **Corps de la requête (JSON) :**
  ```json
  {
    "language": "fr",
    "enabled": { "personnages": true, "lieux": true, "organizations": false, ... },
    "counts":  { "personnages": 3, "lieux": 2, "organizations": 0, ... },
    "inputs":  { "universThematique": "fantasy", "occupation": "alchimiste" },
    "description": "Un monde de magie et d'intrigues politiques"
  }
  ```

  **Limites max par section :** personnages=5, lieux=10, organizations=10, events=10, creatures=10, fragmentsHistoire=20, titres=20, concepts=20.

  **Réponse :**
  ```json
  {
    "meta": { "language": "fr", "model": "gpt-4o-mini" },
    "result": {
      "personnages": [...],
      "lieux": [...],
      "organizations": [],
      ...
    }
  }
  ```

  > ⚠️ Requiert la variable d'environnement `OPENAI_API_KEY`.

Paramètres query fréquents: `count`, `cultureId`, `categorieId`, `genre`, `seed`, `keywords`.

Paramètres additionnels (génération réaliste):
- `socialClassId` (PNJ)
- `occupationId` (PNJ)
- `universId` (ex. fragments d'histoire)

Comportement mots-clés: si aucun match strict n'est trouvé, l'API renvoie des suggestions triées par pertinence au lieu d'une réponse vide.

### Données (CRUD)

Routes CRUD disponibles pour plusieurs ressources (`cultures`, `categories`, `concepts`, `titres`, `lieux`, `fragmentsHistoire`, `univers`, etc.).

Nouvelles ressources réalisme:

- `GET/POST/PUT/DELETE /socialClasses`
- `GET/POST/PUT/DELETE /occupations`
- `GET/POST/PUT/DELETE /organizations`
- `GET/POST/PUT/DELETE /relationTypes`
- `GET/POST/PUT/DELETE /events`

Exemple:

- `GET /cultures`
- `POST /cultures`
- `PUT /cultures/:id`
- `DELETE /cultures/:id`
- `GET /cultures/total`

### Auth (protégé)

- `GET /auth/me` : token Bearer Clerk requis
- `GET /auth/admin/ping` : token Clerk + utilisateur admin requis

---

## Évolution réalisme (3 blocs)

Compatible avec le schéma actuel.

### Bloc 1 — Lieux réalistes reliés aux personnages

Objectif: représenter une géographie hiérarchique et situer les personnages dans le monde.

- Hiérarchie géographique via `Lieux.parentId`, `Lieux.parent`, `Lieux.children`
- Lien personnage-lieu de naissance via `Personnage.birthPlaceId`
- Lien personnage-lieu de résidence via `Personnage.residencePlaceId`

Exemples d’usage: pays → région → ville → quartier, puis “né à X, vit à Y”.

### Bloc 2 — Vie réelle: métier, organisation, statut social

Objectif: enrichir les personnages au-delà de “titre + bio”.

- `Occupation` (métier)
- `Organization` (guilde, compagnie, école, ordre, armée, etc.)
- `SocialClass` (classes paramétrables)
- FKs sur `Personnage`: `occupationId`, `socialClassId`
- Appartenance org via `PersonnageOrganization`

### Bloc 3 — Relations + événements

Objectif: générer des bios crédibles fondées sur des faits et des liens.

- Types de relation paramétrables via `RelationType`
- Relations entre personnages via `PersonnageRelation`
- Événements marquants via `Event`
- Participation d’un personnage à un événement via `PersonnageEvent`

### Pourquoi ce design est neutre et adaptable

- Types basés sur `String`/tables (pas d’enums figés “médiévaux”).
- Réutilisable en fantasy, contemporain, sci-fi, branding.
- Les packs de contenu (relations, classes, métiers) peuvent être spécialisés par catégorie/univers plus tard.

### Mini-plan d’utilisation pour des bios réalistes

1. Choisir `Occupation` + `SocialClass`.
2. Assigner `birthPlace` + `residencePlace`.
3. Créer 1–2 `PersonnageRelation` (mentor/rival/famille/associé).
4. Associer 1 `Event` marquant.
5. Injecter ensuite les `FragmentsHistoire` pour le style narratif.

---

## Exemples d’appel

### curl

```bash
curl "http://localhost:3000/generate/npcs?count=5&seed=demo"
```

### JavaScript

```js
const response = await fetch("http://localhost:3000/generate/concepts?count=10&seed=demo");
const data = await response.json();
console.log(data);
```

---

## Déploiement

- Vercel (configuration: `vercel.json`, entrée serverless: `api/index.ts`)
- Docker / Fly.io (configuration: `Dockerfile`, `fly.toml`)

---

## Documentation et contribution

- Dépôt: https://github.com/Nocturne1975/Nomina-v3
- Ouvrir une issue ou une PR pour proposer des changements.

---

## Licence

Aucune licence explicite n’est définie pour le moment dans ce dépôt.
