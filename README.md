# Nomina — Projet de session (Lab 3)

Ce dépôt contient un **backend** (API) et un **frontend web** (interface React).

Application **full‑stack** :
- **Backend** : API REST Node.js/Express + Prisma
- **Frontend** : React (Vite)
- **Auth** : Clerk (inscription / connexion / déconnexion)

## Fonctionnalités (Lab 3)

- Auth complète : inscription, connexion, déconnexion, session persistante, routes protégées
- UI : navigation cohérente, page d’accueil, dashboard après connexion, feedback (loading/erreurs/succès)
- Intégration API : appels HTTP, gestion d’erreurs, formulaires avec validation
- CRUD complet (exigence) : ressource **Cultures** (Create/Read/Update/Delete)
- Génération enrichie : filtres avancés (`univers`, `catégorie`, `culture`, mots-clés) + fallback de suggestions si aucun match strict
- Réalisme (backend + UI) : classes sociales, métiers, organisations, types de relation, événements

## Technologies (versions)

- Node.js : >= 20
- Backend : Express 5, Prisma 7
- Frontend : React 18, Vite 6, React Router (BrowserRouter)
- Auth : Clerk
- Styles/UI : Tailwind + composants UI déjà présents dans le projet

## Démarrage local

### 1) Backend

```bash
cd Nomina-backend
npm install
npm run dev
# optionnel: injecter les données de réalisme
npm run seed:realism
```

Backend : `http://localhost:3000`

### 2) Frontend (web)

```bash
cd Nomina-frontend
npm install
npm run dev
```

Frontend : `http://localhost:5173`

## Variables d’environnement (sans secrets)

### Backend (Nomina-backend/.env)

- `DATABASE_URL` : connexion Prisma
- `CLERK_SECRET_KEY` : clé serveur Clerk
- `ADMIN_CLERK_USER_IDS` (ou `ADMIN_CLERK_USER_ID`) : userId Clerk admin (CSV possible)
- `CORS_ORIGINS` : origins autorisées, ex. `http://localhost:5173,https://nomina-v3.vercel.app`
- `FRONTEND_URL` : origin principale du frontend (optionnel)
- `PORT` : port du backend

### Frontend (Nomina-frontend/.env.local)

- `VITE_CLERK_PUBLISHABLE_KEY` : clé publique Clerk
- `VITE_API_URL` : URL du backend (ex. `http://localhost:3000`)

## Checklist de validation (inscription + rôles)

- [ ] **Inscription Client** : créer un compte via “Inscription Client”, valider le courriel, puis vérifier que le dashboard affiche **Utilisateur** (pas **Administrateur**).
- [ ] **Vérification API** : sur la session client, appeler `GET /auth/me` et confirmer `isAdmin: false`.
- [ ] **Routes protégées** : avec un compte client, tenter `/admin` et `/users` → accès refusé/redirection attendue.
- [ ] **Inscription Administrateur** : créer un compte via “Inscription Administrateur”, valider le courriel, puis confirmer qu’il reste en attente d’approbation (pas d’accès admin immédiat).
- [ ] **Username à l’inscription** : tester une inscription avec username saisi, puis une inscription avec username vide (génération auto).
- [ ] **Username modifiable plus tard** : depuis le dashboard, utiliser “Modifier mon profil” et confirmer que le username peut être changé.

## Captures d’écran (à inclure pour la remise)

Ajoute au moins **3 captures** montrant :
1. Page de connexion / inscription
2. Dashboard après connexion
3. CRUD Cultures (liste + formulaire)

> Astuce : tu peux créer un dossier `docs/screenshots/` et y mettre tes images, puis les référencer ici.

## Auteurs

- Projet académique — section à compléter par l’équipe de remise (nom et matricule).

## Dépôt

- Monorepo : https://github.com/Nocturne1975/Nomina-v3

## Notes de mise à jour (février 2026)

- Nouveaux endpoints backend: `/socialClasses`, `/occupations`, `/organizations`, `/relationTypes`, `/events`
- Nouvelle commande backend: `npm run seed:realism`
- Page Génération mise à jour: filtres réalisme (`socialClassId`, `occupationId`) et meilleure gestion des résultats par mots-clés
