# Nomina Desktop (JavaFX)

Application bureau JavaFX connectée au backend `Nomina-backend`.

## Fonctionnalités incluses

- Connexion API avec token Bearer (`/auth/me`)
- Navigation multi-vues (Dashboard, Connexion, CRUD Concepts)
- CRUD complet sur `Concepts`
  - Create: `POST /concepts`
  - Read: `GET /concepts`
  - Update: `PUT /concepts/:id`
  - Delete: `DELETE /concepts/:id` avec confirmation
- Dashboard statistiques (`/concepts/total`, `/cultures/total`, `/categories/total`)
- Gestion d'erreurs HTTP lisibles
- Validation client des formulaires
- États de chargement (ProgressIndicator + désactivation des actions)

## Structure

```
src/
└── main/
    ├── java/
    │   └── com/nomina/desktop/
    │       ├── MainApp.java
    │       ├── AppState.java
    │       ├── controller/
    │       ├── model/
    │       ├── service/
    │       └── util/
    └── resources/
        └── com/nomina/desktop/
            ├── view/
            └── css/
```

## Prérequis

- JDK 21
- Maven 3.9+
- Backend Nomina en marche (`Nomina-backend`)

## Lancer

Depuis `Nomina-desktop`:

```bash
mvn clean javafx:run
```

## Utilisation rapide

1. Ouvre `Connexion / Token`.
2. L'URL API est prechargee depuis `app.properties` (ex: `http://localhost:3000/api`).
   - Override possible via la variable d'environnement `NOMINA_API_URL`.
3. Colle un token Bearer valide (Clerk).
4. Clique `Valider /auth/me`.
5. Va dans `CRUD Concepts` pour créer/modifier/supprimer.

> Note: les routes d'écriture exigent un utilisateur admin côté backend.
