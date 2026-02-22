# NOMINA — Dossier de présentation
API de génération narrative (noms & micro‑récits)

Présenté par : Sonia Corbin
Date : 31/01/2026

---

## 1. Présentation générale

Nomina est un service de génération de contenu destiné à accélérer la création d’univers et de récits.
Le projet propose une API qui produit des noms (personnages, lieux, titres) et, selon le type demandé, des fragments narratifs permettant de composer des mini‑histoires.

Nomina vise un usage concret : fournir rapidement des éléments cohérents pour des jeux, romans, scénarios, ou supports pédagogiques, tout en conservant une logique de filtrage (culture, catégorie, genre) et de reproductibilité (graine/seed).

Slogan : Créez, Nommez, Racontez.

---

## 2. Public cible

Nomina s’adresse notamment à :

- Développeurs (jeux, outils d’écriture, applications, chatbots)
- Auteurs et scénaristes (romans, BD, nouvelles)
- Maîtres de jeu et joueurs de jeux de rôle (PNJ, lieux, accroches narratives)
- Créateurs de contenu (stream, podcast, YouTube)
- Équipes créatives (brainstorming de concepts, titres, idées d’univers)

---

## 3. Objectifs du projet

- Offrir une API simple et rapide pour générer du contenu inspirant.
- Permettre des filtres thématiques et culturels afin de produire des résultats plus cohérents.
- Produire des sorties structurées (format JSON côté API) faciles à intégrer dans d’autres projets.
- Rendre la génération reproductible grâce à une graine (seed).
- Proposer une expérience utilisateur via une application desktop dédiée.

---

## 4. Fonctionnalités principales

### 4.1 Génération via API

- Génération de noms de personnages depuis une base de données.
- Génération de lieux depuis une base de données.
- Génération de titres depuis une base de données.
- Génération de fragments d’histoire (extraits narratifs) depuis une base de données.
- Génération de PNJ (idées complètes) en combinant un nom avec plusieurs fragments d’histoire, pour produire une mini‑backstory.

### 4.2 Paramétrage et cohérence

- Filtres : culture, catégorie, genre.
- Quantité : génération en lot (plusieurs résultats en une requête).
- Reproductibilité : une seed permet de rejouer la même sélection.

### 4.3 Application desktop (complément)

- Interface graphique pour déclencher des générations et exploiter les résultats.
- Possibilité de fonctionnement offline : l’application desktop peut démarrer une API locale minimale pour conserver une expérience utilisable hors‑ligne (selon les modules).

---

## 5. Aperçu des endpoints

L’API expose notamment :

- Santé du service : GET /healthz
- Génération de PNJ : GET /generate/npcs
- Génération de personnages (format court) : GET /generate/nom-personnages
- Génération de lieux : GET /generate/lieux
- Génération de fragments d’histoire : GET /generate/fragments-histoire
- Génération de titres : GET /generate/titres

Les paramètres varient selon la route, mais incluent typiquement :

- count (quantité)
- cultureId, categorieId (filtres)
- genre (filtre)
- appliesTo (filtre pour fragments)
- seed (reproductibilité)

---

## 6. Architecture technique

### 6.1 Backend

- Langage : TypeScript
- Serveur : Node.js + Express
- Accès aux données : Prisma
- Base de données : PostgreSQL
- Authentification : Clerk (token Bearer) et contrôle d’accès administrateur via configuration
- Compatibilité : CORS configurable et support des contextes sans en‑tête Origin (ex. application desktop)

### 6.2 Desktop

- UI : React + TypeScript
- Packaging : Electron
- Build : Vite
- Fonctionnement offline : démarrage optionnel d’un serveur local (API offline) au lancement de l’application

### 6.3 Schéma simplifié

Utilisateur → UI (web/desktop) → API Nomina (Express) → PostgreSQL (Prisma) → Résultat

---

## 7. Sécurité et fiabilité

- Authentification via jeton (Clerk).
- Contrôle d’accès administrateur pour les opérations sensibles.
- Endpoint de health check pour la supervision.
- Configuration CORS pour limiter les origines autorisées.

---

## 8. Déploiement

- Déploiement API serverless sur Vercel (`vercel.json`).
- Option alternative : déploiement conteneurisé Docker sur Fly.io (`fly.toml`).
- Migrations Prisma exécutables au déploiement (`npm run migrate:deploy`).

---

## 9. Design & branding (pistes)

### Palette

- Fond : bleu nuit / gris foncé
- Couleur principale : bleu‑turquoise / vert d’eau
- Accent : blanc cassé ou doré léger

### Typographies

- Montserrat, Poppins, Lora

### Iconographie

- Plume stylisée (écriture)
- Encrier + élément mécanique discret (tech/API)
- Étoile/pixel (inspiration)

---

## 10. Évolutions possibles

- Internationalisation : nouvelles langues et variantes culturelles.
- Enrichissement des datasets (noms, cultures, fragments).
- Paramètres avancés (contraintes de longueur, style, tonalité).
- Export (PDF/CSV) côté application desktop.
- Observabilité (logs structurés, métriques) et limitation de débit si exposition publique.

---

## 11. Contribution & contact

- Contributions via issues et pull requests.
- Dépôt : https://github.com/Nocturne1975/Nomina-v3
- Contact : soniacorbin4@gmail.com

---

## 12. Licence

Licence non définie dans le dépôt à ce jour.