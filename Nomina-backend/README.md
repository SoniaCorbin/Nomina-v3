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

---

## Commandes utiles

```bash
npm run dev              # développement
npm run build            # build TypeScript + génération Prisma
npm start                # exécution en production (dist)
npm run migrate          # migration locale Prisma
npm run migrate:deploy   # migration de déploiement
npm run seed             # seed principal
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

Paramètres query fréquents: `count`, `cultureId`, `categorieId`, `genre`, `seed`.

### Données (CRUD)

Routes CRUD disponibles pour plusieurs ressources (`cultures`, `categories`, `concepts`, `titres`, `lieux`, `fragmentsHistoire`, `univers`, etc.).

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
