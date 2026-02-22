-- Seed robuste: insère 200 personnages dans "Personnage"
-- Basé sur les données existantes de "NomPersonnage" (modèle Prisma: Prenom), "NomFamille", "Titre", "Lieux".
-- Compatible PostgreSQL.

BEGIN;

DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "NomPersonnage") = 0 THEN
    RAISE EXCEPTION 'Impossible de seed Personnage: la table "NomPersonnage" est vide.';
  END IF;
END $$;

INSERT INTO "Personnage"
(
  "prenomId",
  "nomFamilleId",
  "titreId",
  "genre",
  "biographie",
  "cultureId",
  "categorieId",
  "createdAt",
  "updatedAt"
)
SELECT
  p.id AS "prenomId",
  COALESCE(p."nomFamilleId", nf.id) AS "nomFamilleId",
  t.id AS "titreId",
  COALESCE(NULLIF(p.genre, ''), t.genre, 'NB') AS "genre",
  (
    CASE
      WHEN t.id IS NOT NULL AND nf.id IS NOT NULL THEN
        CONCAT(
          COALESCE(t.valeur || ' ', ''),
          COALESCE(p.valeur, 'Inconnu'),
          ' ',
          COALESCE(nf.valeur, ''),
          ' protège les siens avec sang-froid et discipline.'
        )
      WHEN t.id IS NOT NULL THEN
        CONCAT(
          COALESCE(t.valeur || ' ', ''),
          COALESCE(p.valeur, 'Inconnu'),
          ' est reconnu(e) pour sa rigueur et son sens du devoir.'
        )
      ELSE
        CONCAT(
          COALESCE(p.valeur, 'Inconnu'),
          ' trace sa route entre loyauté, ambition et mystères anciens.'
        )
    END
  )
  ||
  ' Son objectif est de préserver l''équilibre autour de '
  || COALESCE(l.value, 'sa région')
  || '.' AS "biographie",
  COALESCE(p."cultureId", t."cultureId", nf."cultureId") AS "cultureId",
  COALESCE(p."categorieId", t."categorieId", nf."categorieId") AS "categorieId",
  NOW() AS "createdAt",
  NOW() AS "updatedAt"
FROM generate_series(1, 200) AS g(n)
JOIN LATERAL (
  SELECT id, valeur, genre, "cultureId", "categorieId", "nomFamilleId"
  FROM "NomPersonnage"
  ORDER BY id
  OFFSET (
    (g.n - 1)
    % GREATEST((SELECT COUNT(*) FROM "NomPersonnage"), 1)
  )
  LIMIT 1
) AS p ON TRUE
LEFT JOIN LATERAL (
  SELECT id, valeur, genre, "cultureId", "categorieId"
  FROM "NomFamille"
  ORDER BY id
  OFFSET (
    (g.n - 1)
    % GREATEST((SELECT COUNT(*) FROM "NomFamille"), 1)
  )
  LIMIT 1
) AS nf ON TRUE
LEFT JOIN LATERAL (
  SELECT id, valeur, genre, "cultureId", "categorieId"
  FROM "Titre"
  ORDER BY id
  OFFSET (
    (g.n - 1)
    % GREATEST((SELECT COUNT(*) FROM "Titre"), 1)
  )
  LIMIT 1
) AS t ON TRUE
LEFT JOIN LATERAL (
  SELECT value
  FROM "Lieux"
  ORDER BY id
  OFFSET (
    (g.n - 1)
    % GREATEST((SELECT COUNT(*) FROM "Lieux"), 1)
  )
  LIMIT 1
) AS l ON TRUE;

COMMIT;

-- Vérification rapide:
-- SELECT COUNT(*) AS total_personnages FROM "Personnage";
