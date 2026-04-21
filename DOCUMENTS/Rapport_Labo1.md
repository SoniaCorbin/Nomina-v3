# Rapport — Laboratoire 1
## Analyse et base de données transactionnelle

**Cours :** Services Web 1 — `420-941-MA`  
**Session :** Hiver 2026  
**Projet :** Nomina — API de génération narrative (Parcours A — Backend Node.js + Frontend React)  
**Auteure :** Sonia Corbin  
**Date de remise :** Début séance 7

---

## Table des matières

1. [Cahier des charges complet](#1-cahier-des-charges-complet)  
   1.1 [Présentation du projet](#11-présentation-du-projet)  
   1.2 [Public cible](#12-public-cible)  
   1.3 [Objectifs et contraintes](#13-objectifs-et-contraintes)  
   1.4 [User stories et backlog produit](#14-user-stories-et-backlog-produit)  
   1.5 [Maquettes des pages principales](#15-maquettes-des-pages-principales)  
2. [Schéma Prisma avec relations avancées](#2-schéma-prisma-avec-relations-avancées)  
3. [Migration fonctionnelle](#3-migration-fonctionnelle)  
4. [Seed de données](#4-seed-de-données)  
5. [Démonstration de transactions ACID](#5-démonstration-de-transactions-acid)

---

## 1. Cahier des charges complet

### 1.1 Présentation du projet

**Nomina** est une application full-stack de génération et de gestion de contenus narratifs. Elle produit des noms de personnages, des noms de lieux, des titres honorifiques et des fragments d'histoire à partir d'une base de données structurée, en appliquant des filtres thématiques (univers, culture, catégorie, genre).

Le projet est organisé en monorepo avec trois modules :

| Module | Technologie | Rôle |
|---|---|---|
| `Nomina-backend` | Node.js + Express + TypeScript + Prisma + PostgreSQL | API REST, logique métier, accès données |
| `Nomina-frontend` | React + Vite + TypeScript + Tailwind CSS | Interface utilisateur, consommation de l'API |
| `Nomina-desktop2` | Java (JavaFX) | Application desktop autonome (usage hors-ligne) |

**Slogan :** _Créez, Nommez, Racontez._

---

### 1.2 Public cible

| Rôle | Besoin principal |
|---|---|
| Auteur / scénariste | Générer rapidement des noms cohérents pour des personnages ou des lieux dans un univers |
| Maître de jeu (JdR) | Créer des PNJ (personnages non-joueurs) avec une mini-backstory en une requête |
| Développeur | Intégrer l'API dans un outil d'écriture, un jeu ou un chatbot |
| Créateur de contenu | Brainstormer des accroches narratives et des concepts d'univers |
| Administrateur de contenu | Gérer et enrichir la base de données narrative (univers, cultures, catégories, lieux) |

---

### 1.3 Objectifs et contraintes

**Objectifs fonctionnels :**
- Générer des noms de personnages avec filtres (culture, catégorie, genre, quantité, seed).
- Générer des lieux, des titres et des fragments d'histoire avec les mêmes filtres.
- Générer des PNJ complets (prénom + nom + titre + biographie assemblée).
- Gérer les entités narratives via des endpoints CRUD sécurisés.
- Protéger les routes d'administration par authentification (Clerk).

**Objectifs non-fonctionnels :**
- Réponse API < 500 ms pour les endpoints de génération.
- Données cohérentes : intégrité référentielle garantie par Prisma + PostgreSQL.
- Reproductibilité : une même seed produit toujours les mêmes résultats.
- Déploiement continu : backend sur Fly.io, frontend sur Vercel/Netlify.

**Contraintes techniques :**
- PostgreSQL (pas SQLite) : propriétés ACID nécessaires pour la gestion des contenus.
- TypeScript côté backend et frontend : typage fort, maintenabilité.
- Prisma ORM : migrations versionnées, Prisma Studio pour l'exploration.

---

### 1.4 User stories et backlog produit

Les user stories suivent le format standard :  
**En tant que** [rôle], **je veux** [action] **afin de** [bénéfice].

#### Épopée (Epic) 1 — Génération de contenu (visiteur public)

| ID | User story | Priorité | Critères d'acceptation |
|---|---|---|---|
| US-01 | En tant qu'auteur, je veux générer des noms de personnages filtrés par culture et genre, afin d'obtenir des noms cohérents pour mon univers. | Haute | L'API retourne N noms (1 ≤ N ≤ 50) depuis la base ; les filtres `cultureId`, `categorieId`, `genre` sont optionnels ; format JSON. |
| US-02 | En tant qu'auteur, je veux générer des noms de lieux filtrés par catégorie, afin de nommer rapidement les décors de mon récit. | Haute | `GET /generate/lieux` retourne une liste ; filtre `categorieId` optionnel. |
| US-03 | En tant que maître de jeu, je veux générer des PNJ complets (prénom + nom + titre + biographie), afin de créer des personnages prêts à l'emploi. | Haute | `GET /generate/npcs` retourne des objets PNJ avec prénom, nom, titre et biographie assemblée. |
| US-04 | En tant que développeur, je veux spécifier une graine (seed) dans ma requête, afin de rejouer la même sélection de façon déterministe. | Moyenne | Paramètre `seed` optionnel ; même seed + même ensemble de données = même résultat. |
| US-05 | En tant qu'utilisateur, je veux générer des fragments d'histoire filtrés par culture et genre, afin d'obtenir des accroches narratives adaptées à mon contexte. | Moyenne | `GET /generate/fragments-histoire` ; filtres `cultureId`, `genre`, `appliesTo` optionnels. |
| US-06 | En tant qu'utilisateur, je veux générer des titres honorifiques filtrés par type et genre, afin d'enrichir mes personnages nobles ou militaires. | Basse | `GET /generate/titres` ; filtres `type`, `genre` optionnels. |

#### Épopée (Epic) 2 — Gestion de l'univers narratif (éditeur authentifié)

| ID | User story | Priorité | Critères d'acceptation |
|---|---|---|---|
| US-07 | En tant qu'éditeur, je veux créer, modifier ou supprimer des univers thématiques, afin de structurer le contenu par monde fictif. | Haute | CRUD complet sur `/univers` ; authentification requise ; unicité du nom garantie. |
| US-08 | En tant qu'éditeur, je veux gérer des catégories rattachées à un univers, afin de regrouper les contenus par sous-thème (Médiéval, SF, Fantaisie, etc.). | Haute | CRUD sur `/categories` ; champ `universId` requis. |
| US-09 | En tant qu'éditeur, je veux gérer des cultures (ex. Elfique, Nordique), afin de donner une cohérence linguistique et culturelle aux noms générés. | Haute | CRUD sur `/cultures` ; nom unique. |
| US-10 | En tant qu'éditeur, je veux ajouter des prénoms et des noms de famille liés à une culture ou une catégorie, afin d'enrichir la base de génération. | Haute | CRUD sur `/prenoms` et `/noms-famille` ; liaisons optionnelles vers `Culture` et `Categorie`. |
| US-11 | En tant qu'éditeur, je veux gérer des lieux avec une hiérarchie parent-enfant (continent > pays > ville), afin de créer une géographie cohérente. | Moyenne | `parentId` optionnel ; relation auto-référentielle `LieuxHierarchy`. |
| US-12 | En tant qu'éditeur, je veux gérer des personnages complets (prénom, nom, titre, classe sociale, occupation, lieu de naissance), afin de construire un registre de personnages cohérent. | Moyenne | CRUD sur `/personnages` ; toutes les FK sont optionnelles sauf `prenomId`. |

#### Épopée (Epic) 3 — Structure narrative avancée (éditeur)

| ID | User story | Priorité | Critères d'acceptation |
|---|---|---|---|
| US-13 | En tant qu'éditeur, je veux définir des classes sociales (avec rang) par univers, afin de structurer la hiérarchie de la société dans mes récits. | Moyenne | CRUD sur `/social-classes` ; contrainte d'unicité `(name, universId, categorieId, cultureId)`. |
| US-14 | En tant qu'éditeur, je veux définir des occupations (métiers) par univers, afin d'assigner une fonction à chaque personnage. | Moyenne | CRUD sur `/occupations` ; même contrainte d'unicité que `SocialClass`. |
| US-15 | En tant qu'éditeur, je veux gérer des organisations (guildes, ordres, armées) et y rattacher des personnages avec un rôle et une période, afin de modéliser les appartenances. | Basse | Table pivot `PersonnageOrganization` avec `role`, `startYear`, `endYear`. |
| US-16 | En tant qu'éditeur, je veux définir des types de relations (allié, ennemi, mentor), afin de modéliser les liens entre personnages. | Basse | `RelationType` + table pivot `PersonnageRelation` avec `strength` et `note`. |
| US-17 | En tant qu'éditeur, je veux créer des événements historiques liés à un lieu, un univers et des personnages participants, afin de tisser une chronologie narrative. | Basse | Modèle `Event` + table pivot `PersonnageEvent` avec `role`. |
| US-18 | En tant qu'éditeur, je veux associer des créatures à des personnages et une catégorie, afin d'enrichir la faune de mon univers. | Basse | Modèle `Creature` ; `personnageId` optionnel. |

#### Épopée (Epic) 4 — Administration et sécurité (administrateur)

| ID | User story | Priorité | Critères d'acceptation |
|---|---|---|---|
| US-19 | En tant qu'administrateur, je veux gérer les comptes utilisateurs (rôle Admin / Editor / Viewer), afin de contrôler les accès à l'API. | Haute | Modèle `User` avec champ `role` et `isActive` ; authentification via Clerk. |
| US-20 | En tant qu'administrateur, je veux que la suppression d'une culture désengage automatiquement tous les enregistrements liés, afin d'éviter les orphelins en base. | Haute | Suppression transactionnelle atomique (voir US-22). |
| US-21 | En tant qu'administrateur, je veux importer des données en lot (concepts, titres, fragments), afin d'initialiser rapidement une nouvelle base. | Moyenne | Scripts `seed.ts`, `import-concepts.ts`, `import-titres.ts`, `import-fragments-histoire.ts`. |
| US-22 | En tant que développeur, je veux que toutes les opérations multi-tables s'exécutent en transaction atomique, afin de garantir la cohérence des données. | Haute | Utilisation de `prisma.$transaction([...])` pour toutes les suppressions en cascade. |

---

### 1.5 Maquettes des pages principales

Les maquettes suivantes décrivent les écrans principaux de l'application frontend. Elles ont été conçues avec Excalidraw et sont reproduites ici sous forme textuelle.

---

#### Page 1 — Accueil / Landing Page

```
┌─────────────────────────────────────────────────────────┐
│  NOMINA                             [Connexion]  [Docs] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│         Créez, Nommez, Racontez.                        │
│                                                         │
│   Générez des noms de personnages, lieux et             │
│   fragments d'histoire pour vos univers fictifs.        │
│                                                         │
│        [ Commencer à générer → ]                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│[🧙 Personnages]  [🗺️ Lieux]  [📜 Fragments]  [⚔️ PNJ] │
└─────────────────────────────────────────────────────────┘
```

**Description :** Page d'accueil publique. Présente le projet, ses cas d'usage et oriente l'utilisateur vers l'outil de génération. Pas d'authentification requise.

---

#### Page 2 — Outil de génération

```
┌─────────────────────────────────────────────────────────┐
│  NOMINA > Générer                                       │
├──────────────────┬──────────────────────────────────────┤
│  FILTRES         │  RÉSULTATS                           │
│                  │                                      │
│  Type :          │  ┌─────────────────────────────┐     │
│  ○ Personnages   │  │ Adalric von Rheinnacht        │   │
│  ● PNJ complet   │  │ Chevalier | Culture Germanique│   │
│  ○ Lieux         │  │ "Gardien des Marches du Nord" │   │
│  ○ Fragments     │  └─────────────────────────────┘     │
│                  │                                      │
│  Univers :       │  ┌─────────────────────────────┐     │
│  [Médiéval ▼]    │  │ Elara Moonweave             │     │
│                  │  │ Archimage | Culture Elfique │     │
│  Culture :       │  │ "Gardienne des secrets..."  │     │
│  [Elfique  ▼]    │  └─────────────────────────────┘     │
│                  │                                      │
│  Genre :         │  ┌─────────────────────────────┐     │
│  [Tous  ▼]       │  │ Thorgal Ironshield          │     │
│                  │  │ Guerrier | Culture Nordique │     │
│  Quantité : [5]  │  │ "Né dans les fjords..."     │     │
│                  │  └─────────────────────────────┘     │
│  Seed : [____]   │                                      │
│                  │  [ ↻ Régénérer ]  [ 📋 Copier tout ]│
│  [ Générer ]     │                                      │
└──────────────────┴──────────────────────────────────────┘
```

**Description :** Interface principale de génération. Panneau de filtres à gauche, résultats à droite. Les résultats s'affichent instantanément après appel API. Accessible sans connexion.

---

#### Page 3 — Dashboard administrateur

```
┌─────────────────────────────────────────────────────────┐
│  NOMINA > Admin Dashboard          [Sonia Corbin ▼]     │
├──────────────┬──────────────────────────────────────────┤
│  NAVIGATION  │  VUE D'ENSEMBLE                          │
│              │                                          │
│  📊 Dashboard│  ┌────────┐ ┌────────┐ ┌────────┐       │
│  🌍 Univers  │  │  3     │ │  12    │ │  847   │       │
│  📂 Catégories│ │Univers │ │Cultures│ │Prénoms │       │
│  🎭 Cultures │  └────────┘ └────────┘ └────────┘       │
│  👤 Prénoms  │                                         │
│  🏠 NomFamille│ ┌────────┐ ┌────────┐ ┌────────┐       │
│  🗺️ Lieux    │  │  234   │ │  78    │ │  56    │       │
│  📜 Fragments│  │Lieux   │ │Titres  │ │Concepts│       │
│  ⚔️ Titres   │  └────────┘ └────────┘ └────────┘       │
│  🧑 Personnages│                                        │
│  🐉 Créatures│  ACTIONS RAPIDES                         │
│  🏰 Org.     │  [ + Ajouter un univers ]                │
│  🗓️ Événements│  [ + Importer des prénoms ]             │
│  👥 Relations│  [ ⚙️ Prisma Studio ]                    │
│  👤 Users    │                                          │
└──────────────┴──────────────────────────────────────────┘
```

**Description :** Dashboard réservé aux utilisateurs authentifiés avec le rôle `Admin` ou `Editor`. Donne accès au CRUD de toutes les entités. Les compteurs sont fournis par des endpoints d'agrégation dédiés.

---

#### Page 4 — Gestion d'une entité (ex. Cultures)

```
┌─────────────────────────────────────────────────────────┐
│  NOMINA > Admin > Cultures                              │
│                                      [ + Nouvelle ]     │
├────────┬───────────────────┬──────────┬─────────────────┤
│  ID    │  Nom              │  Prénoms │  Actions        │
├────────┼───────────────────┼──────────┼─────────────────┤
│  1     │  Elfique          │  127     │ [✏️] [🗑️]      │
│  2     │  Nordique         │  89      │ [✏️] [🗑️]      │
│  3     │  Germanique       │  64      │ [✏️] [🗑️]      │
│  4     │  Japonais         │  201     │ [✏️] [🗑️]      │
│  ...   │  ...              │  ...     │  ...            │
├────────┴───────────────────┴──────────┴─────────────────┤
│  Affichage : 1-10 / 12       [ < Préc. ]   [ Suiv. > ]  │
└─────────────────────────────────────────────────────────┘
```

**Description :** Table paginée avec tri et édition en ligne (modale). La suppression d'une culture déclenche une confirmation explicite : le système avertit l'utilisateur que tous les liens vers cette culture seront retirés (transaction atomique côté API).

---

## 2. Schéma Prisma avec relations avancées

### 2.1 Vue d'ensemble du schéma

Le schéma Prisma couvre **16 modèles** organisés autour des concepts narratifs :

```
UniversThematique (1) ──── (N) Categorie
                               │
                     ┌─────────┼──────────────────┐
                     │         │                  │
                  Prenom    NomFamille          Lieux
                     │         │              (auto-ref)
                     └────┬────┘
                          │
                      Personnage ──── SocialClass
                          │    ──── Occupation
                          │    ──── Titre
                          │    ──────────────────────────────
                          ├──── PersonnageOrganization (N-N)
                          ├──── PersonnageRelation (N-N auto)
                          └──── PersonnageEvent (N-N)

Culture ──── (N) Prenom, NomFamille, Titre, FragmentsHistoire,
                 Personnage, Creature, SocialClass, Occupation,
                 Organization, RelationType
```

### 2.2 Concepts avancés utilisés

#### Relations 1-N
```prisma
// UniversThematique possède plusieurs Categorie
model UniversThematique {
  id         Int         @id @default(autoincrement())
  name       String      @unique
  categories Categorie[]
}

model Categorie {
  universId Int
  univers   UniversThematique @relation(fields: [universId], references: [id])
}
```

#### Relation auto-référentielle (hiérarchie de lieux)
```prisma
model Lieux {
  id       Int     @id @default(autoincrement())
  value    String
  parentId Int?
  parent   Lieux?  @relation("LieuxHierarchy", fields: [parentId], references: [id])
  children Lieux[] @relation("LieuxHierarchy")
}
```
> Permet une hiérarchie continent → pays → région → ville sans limite de profondeur.

#### Relation N-N explicite avec table pivot enrichie
```prisma
// Un personnage peut appartenir à plusieurs organisations, avec un rôle et une période
model PersonnageOrganization {
  personnageId   Int
  personnage     Personnage   @relation(fields: [personnageId], references: [id])
  organizationId Int
  organization   Organization @relation(fields: [organizationId], references: [id])
  role           String?
  startYear      Int?
  endYear        Int?

  @@unique([personnageId, organizationId])
}
```

#### Relation N-N auto-référentielle (relations entre personnages)
```prisma
model PersonnageRelation {
  fromPersonnageId Int
  fromPersonnage   Personnage @relation("FromRelations", fields: [fromPersonnageId], references: [id])
  toPersonnageId   Int
  toPersonnage     Personnage @relation("ToRelations", fields: [toPersonnageId], references: [id])
  relationTypeId   Int
  strength         Int?
  note             String?
}
```

#### Index composites et contraintes d'unicité
```prisma
model SocialClass {
  name        String
  universId   Int?
  categorieId Int?
  cultureId   Int?

  // Empêche les doublons par contexte (même nom acceptable dans des univers différents)
  @@unique([name, universId, categorieId, cultureId])
  // Index pour les requêtes filtrées
  @@index([universId, categorieId])
  @@index([universId])
  @@index([categorieId])
  @@index([cultureId])
}
```

#### Mapping de table avec @@map
```prisma
model Prenom {
  // Le modèle Prisma s'appelle "Prenom" mais la table SQL s'appelle "NomPersonnage"
  @@map("NomPersonnage")
}
```
> Permet de conserver un nom de modèle Prisma lisible tout en respectant un nom de table SQL déjà en place.

#### Valeurs par défaut et timestamps automatiques
```prisma
model User {
  role      String   @default("Editor")
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // mis à jour automatiquement à chaque modification
}
```

### 2.3 Récapitulatif des modèles

| Modèle | Type de relation principale | Particularités |
|---|---|---|
| `UniversThematique` | 1-N vers `Categorie` | Racine thématique ; nom unique |
| `Categorie` | N-1 vers `UniversThematique` | Rattachement obligatoire à un univers |
| `Culture` | 1-N vers de nombreux modèles | Dimension linguistique/culturelle partagée |
| `Prenom` | N-1 vers `Culture`, `Categorie`, `NomFamille` | `@@map("NomPersonnage")` |
| `NomFamille` | N-1 vers `Culture`, `Categorie` | Optionnel ; lié aux prénoms |
| `Lieux` | Auto-référentielle | Hiérarchie parent-enfant illimitée |
| `Personnage` | N-1 vers de nombreux modèles | Modèle central ; 7 index |
| `SocialClass` | N-1 vers `Univers`, `Categorie`, `Culture` | Contrainte `@@unique` sur 4 champs |
| `Occupation` | Même structure que `SocialClass` | Métiers par contexte |
| `Organization` | 1-N vers `PersonnageOrganization` | Guildes, ordres, armées |
| `PersonnageOrganization` | N-N pivot enrichi | `role`, `startYear`, `endYear` |
| `RelationType` | 1-N vers `PersonnageRelation` | Types de relations (allié, ennemi…) |
| `PersonnageRelation` | N-N auto entre `Personnage` | `strength`, `note`, période |
| `Event` | N-N vers `Personnage` via `PersonnageEvent` | Événements chronologiques |
| `Creature` | N-1 vers `Personnage` | Faune de l'univers |
| `FragmentsHistoire` | N-1 vers `Culture`, `Categorie` | Textes narratifs réutilisables |

---

## 3. Migration fonctionnelle

### 3.1 Démarche

Les migrations sont gérées par `prisma migrate dev`, qui :
1. Compare le schéma `schema.prisma` courant à l'état de la base.
2. Génère un fichier SQL de migration daté et nommé.
3. Applique la migration à la base de développement.
4. Met à jour la table `_prisma_migrations` (journal interne).

### 3.2 Historique des migrations

```
prisma/migrations/
├── 20251212171807_init/           ← Schéma initial (User, Prenom, Culture)
├── 20251216152955_init/           ← Ajout NomFamille, Lieux, Titre
├── 20260128135405_add_univers_thematique/  ← Modèle UniversThematique
├── 20260128142059_make_univers_required/   ← universId NOT NULL dans Categorie
├── 20260129190000_baseline_drift/          ← Réconciliation de dérive
├── 20260129220359_init/           ← Réinitialisation complète
├── 20260129220711_init/           ← Finalisation du schéma de base
├── 20260218145233_prenom_personnage/       ← Lien Prenom ↔ Personnage
├── 20260221120000_add_image_fields_to_models/  ← Champs imageUrl
├── 20260221152823_add_creature_model/     ← Modèle Creature
├── 20260221153253_link_creature_personnage/  ← Creature.personnageId FK
├── 20260221160420_add_creature_image_url/    ← imageUrl sur Creature
├── 20260222172132_init/           ← Ajout modèles relationnels (Event, Org.)
└── 20260222172318_scope_integrity_and_composite_indexes/  ← Index composites
```

### 3.3 Exemple de migration générée

Extrait de la migration `20260222172318_scope_integrity_and_composite_indexes` :

```sql
-- Ajout des contraintes d'unicité par contexte sur SocialClass
ALTER TABLE "SocialClass"
ADD CONSTRAINT "SocialClass_name_universId_categorieId_cultureId_key"
UNIQUE ("name", "universId", "categorieId", "cultureId");

-- Index composites pour les requêtes filtrées
CREATE INDEX "SocialClass_universId_categorieId_idx"
ON "SocialClass"("universId", "categorieId");

CREATE INDEX "SocialClass_universId_idx"
ON "SocialClass"("universId");
```

### 3.4 Commandes utilisées

```bash
# Générer et appliquer une nouvelle migration en développement
npx prisma migrate dev --name add_creature_model

# Consulter l'état des migrations
npx prisma migrate status

# Appliquer les migrations en production (sans prompts)
npx prisma migrate deploy

# Explorer les données en GUI
npx prisma studio
```

---

## 4. Seed de données

### 4.1 Structure du seed

Le seed principal (`src/scripts/seed.ts`) orchestre plusieurs imports séquentiels :

```typescript
async function main() {
  console.log("=== Nomina seed ===");
  await importConcepts({ apply: true });          // Import des concepts narratifs
  await importTitres({ apply: true });            // Import des titres honorifiques
  await importFragmentsHistoire({ apply: true }); // Import des fragments d'histoire
  await seedPersonnages({ count: 20 });           // Génération de 20 personnages
  await seedCreatures();                          // Génération de créatures
  console.log("=== Seed terminé ===");
}
```

### 4.2 Seed SQL robuste (200 personnages)

Le fichier `sql/seed-200-personnages.sql` utilise des fonctionnalités PostgreSQL avancées pour insérer 200 personnages sans données statiques :

```sql
BEGIN;

-- Vérification préalable : la table source doit contenir des données
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "NomPersonnage") = 0 THEN
    RAISE EXCEPTION 'Impossible de seed Personnage: la table "NomPersonnage" est vide.';
  END IF;
END $$;

-- Insertion de 200 personnages par rotation cyclique des données existantes
INSERT INTO "Personnage" ("prenomId", "nomFamilleId", "titreId", "genre", "biographie", ...)
SELECT
  p.id AS "prenomId",
  nf.id AS "nomFamilleId",
  -- Biographie assemblée dynamiquement
  CONCAT(
    COALESCE(t.valeur || ' ', ''),
    COALESCE(p.valeur, 'Inconnu'),
    ' protège les siens avec sang-froid et discipline.'
  ) AS "biographie",
  ...
FROM generate_series(1, 200) AS g(n)
-- Rotation cyclique des prénoms disponibles
JOIN LATERAL (
  SELECT id, valeur, genre, "cultureId", "categorieId", "nomFamilleId"
  FROM "NomPersonnage"
  ORDER BY id
  OFFSET ((g.n - 1) % GREATEST((SELECT COUNT(*) FROM "NomPersonnage"), 1))
  LIMIT 1
) AS p ON TRUE
...

COMMIT;
```

**Points clés :**
- `generate_series(1, 200)` : génère 200 lignes numérées sans données statiques.
- `LATERAL JOIN` avec `OFFSET ... LIMIT 1` : rotation cyclique sur les tables source.
- `GREATEST(..., 1)` : protège contre la division par zéro si une table est vide.
- `BEGIN / COMMIT` : tout le seed est atomique (rollback automatique en cas d'erreur).

---

## 5. Démonstration de transactions ACID

### 5.1 Propriétés ACID dans Nomina

| Propriété | Explication | Mise en œuvre dans Nomina |
|---|---|---|
| **Atomicité** | Toutes les opérations d'un bloc réussissent ou aucune n'est appliquée | `prisma.$transaction([...])` — si une opération échoue, toutes sont annulées |
| **Cohérence** | La base reste dans un état valide après chaque transaction | Contraintes FK, `@@unique`, `NOT NULL` gérées par Prisma + PostgreSQL |
| **Isolation** | Les transactions concurrentes ne se voient pas mutuellement | Niveau d'isolation par défaut PostgreSQL : `READ COMMITTED` |
| **Durabilité** | Une fois validée (COMMIT), la transaction survit aux pannes | Assuré par PostgreSQL (WAL — Write-Ahead Log) |

### 5.2 Transaction séquentielle — Suppression d'une culture

Lorsqu'un administrateur supprime une culture, **12 opérations** doivent se faire en un seul bloc atomique pour éviter les références orphelines :

```typescript
// src/controllers/CultureController.ts
export const deleteCulture = async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  await prisma.$transaction([
    // Étape 1-11 : désengager toutes les références vers cette culture
    prisma.prenom.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.fragmentsHistoire.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.titre.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.nomFamille.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.personnage.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.creature.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.event.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.socialClass.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.occupation.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.organization.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    prisma.relationType.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
    // Étape 12 : supprimer la culture elle-même
    prisma.culture.delete({ where: { id } }),
  ]);

  res.status(204).end();
};
```

**Pourquoi c'est ACID :**
- **Atomique** : si l'une des 12 opérations échoue (ex. contrainte violée), aucune modification n'est appliquée.
- **Cohérent** : la base ne peut pas terminer dans un état où des prénoms pointent vers une culture supprimée.
- **Isolé** : d'autres requêtes simultanées ne voient pas l'état intermédiaire (culture à moitié déreférencée).
- **Durable** : une fois les 12 opérations validées, elles survivent à un redémarrage du serveur.

### 5.3 Transaction interactive — Fusion/nettoyage d'univers doublons

La transaction interactive (callback `async (tx) => {...}`) permet une logique conditionnelle à l'intérieur de la transaction :

```typescript
// src/scripts/clean-univers.ts
await prisma.$transaction(async (tx) => {
  // Lire l'état de la base à l'intérieur de la transaction
  const cible = await tx.universThematique.findUnique({ where: { id: canonical.id } });
  
  if (!cible) throw new Error(`Univers canonique #${canonical.id} introuvable`);

  // Réaffecter toutes les entités des doublons vers le canonique
  for (const dup of group.duplicates) {
    await tx.categorie.updateMany({
      where: { universId: dup.id },
      data:  { universId: canonical.id },
    });
    // ... autres modèles
    
    // Supprimer le doublon
    await tx.universThematique.delete({ where: { id: dup.id } });
  }

  // Renommer le canonique (nom normalisé)
  await tx.universThematique.update({
    where: { id: canonical.id },
    data:  { name: canonicalCleanName },
  });
});
```

**Différence avec la transaction séquentielle :**
- La transaction **séquentielle** (`$transaction([...])`) exécute un tableau d'opérations Prisma en un seul aller-retour BD — plus performante pour des opérations fixes.
- La transaction **interactive** (`$transaction(async (tx) => {...})`) permet des lectures intermédiaires et une logique conditionnelle — plus flexible pour des flux complexes comme une fusion de données.

### 5.4 Transaction de seed atomique (SQL)

Le fichier `sql/seed-200-personnages.sql` encapsule toute l'insertion dans une transaction SQL native :

```sql
BEGIN;
  -- Vérification + insertion de 200 personnages
  -- Si une erreur survient à n'importe quelle étape :
  -- → PostgreSQL annule TOUT le bloc automatiquement
COMMIT;
```

Cela garantit que l'on ne se retrouve jamais avec 73 personnages insérés sur 200 en cas d'erreur à mi-chemin.

---

## Conclusion

Le Laboratoire 1 a permis d'établir les fondations solides du projet Nomina :

1. **Cahier des charges** : 22 user stories couvrant 4 épopées (génération, gestion éditoriale, structure narrative, administration), avec maquettes ASCII des 4 pages principales.

2. **Schéma Prisma avancé** : 16 modèles avec relations 1-N, N-N explicites, auto-référentielle (Lieux), contraintes `@@unique` composites, `@@map`, index multiples et timestamps automatiques.

3. **Migrations fonctionnelles** : 14 migrations versionnées, documentant l'évolution itérative du schéma depuis la version initiale jusqu'aux index composites finaux.

4. **Seed de données** : seed TypeScript orchestré + seed SQL pur avec rotation cyclique `generate_series` + `LATERAL JOIN`, entièrement atomique.

5. **Transactions ACID** : démonstration de `$transaction` séquentielle (suppression cascade en 12 opérations) et interactive (fusion d'univers doublons), plus transaction SQL native dans le seed.
