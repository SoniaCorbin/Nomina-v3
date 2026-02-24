# NOMINA Frontend

Interface web React/TypeScript de Nomina. Elle consomme l’API backend pour générer et administrer des contenus narratifs (personnages, lieux, concepts, titres, cultures, catégories, univers, créatures).

---

## Stack

- React 18 + TypeScript
- Vite 6
- React Router
- Tailwind CSS
- Clerk (authentification)
- Vitest (tests)

---

## Prérequis

- Node.js 20+
- Backend Nomina disponible (par défaut: `http://localhost:3000`)

---

## Installation

```bash
npm install
```

---

## Variables d’environnement

Créer un fichier `.env.local` à la racine de `Nomina-frontend`.

```env
VITE_API_URL=http://localhost:3000/api
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

Notes:
- `VITE_API_URL` pointe vers le préfixe API du backend (`/api`).
- `VITE_CLERK_PUBLISHABLE_KEY` est requis pour les pages/auth flows Clerk.

**Clerk redirect URLs** : pour que la connexion et le SSO fonctionnent en prod et en local, ajoute les URLs listées dans [CLERK_REDIRECT_URLS.md](./CLERK_REDIRECT_URLS.md) dans le Clerk Dashboard (Configure → Paths / Allowed redirect URLs).

---

## Commandes utiles

```bash
npm run dev                 # serveur de dev
npm run build               # build production
npm run preview             # prévisualiser le build
npm test                    # lancer les tests frontend
npm run test:watch          # tests en mode watch
```

Commandes proxy vers le backend (depuis ce dossier):

```bash
npm run backend:migrate
npm run backend:migrate:deploy
npm run backend:seed
npm run backend:seed:realism
```

---

## Démarrage local rapide

1. Démarrer le backend (`Nomina-backend`).
2. Dans ce dossier:

```bash
npm run dev
```

3. Ouvrir l’URL affichée par Vite (généralement `http://localhost:5173`).

---

## Pages principales

- Accueil / présentation
- Génération créative (filtres avancés: univers, catégorie, culture, mots-clés, et filtres réalisme selon le type)
- Tableau de bord (stats + raccourcis)
- Authentification (login/register, Clerk)
- Gestion des entités (cultures, catégories, concepts, titres, lieux, créatures, etc.)

### Détails page Génération

- Les résultats PNJ peuvent être filtrés avec `socialClassId` et `occupationId`.
- Les fragments d'histoire utilisent aussi le filtre `universId`.
- Les recherches par mots-clés affichent maintenant des suggestions pertinentes même sans match exact.

---

## Structure

- `src/pages` : pages applicatives
- `src/components` : composants UI/sections
- `src/lib` : helpers (API, utilitaires)
- `src/styles` : styles globaux Tailwind
- `assets` : images et ressources statiques

---

## Déploiement

- Build: `npm run build`
- Déploiement statique possible via Netlify (`netlify.toml`) ou Vercel selon la configuration du projet.

---

## Références

- Dépôt: https://github.com/Nocturne1975/Nomina-v3
- Issues: https://github.com/Nocturne1975/Nomina-v3/issues
