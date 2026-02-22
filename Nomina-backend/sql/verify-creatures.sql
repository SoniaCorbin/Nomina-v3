-- Audit rapide des créatures
-- Exécution (PowerShell/Bash):
-- npx prisma db execute --schema prisma/schema.prisma --file docs/sql/verify-creatures.sql

-- 1) Compte total
SELECT COUNT(*) AS total_creatures
FROM "Creature";

-- 2) Doublons par valeur
SELECT
  "valeur",
  COUNT(*) AS occurrences
FROM "Creature"
GROUP BY "valeur"
HAVING COUNT(*) > 1
ORDER BY occurrences DESC, "valeur" ASC;

-- 3) Intégrité FK: culture inexistante
SELECT c."id", c."valeur", c."cultureId"
FROM "Creature" c
LEFT JOIN "Culture" u ON u."id" = c."cultureId"
WHERE c."cultureId" IS NOT NULL
  AND u."id" IS NULL
ORDER BY c."id";

-- 4) Intégrité FK: catégorie inexistante
SELECT c."id", c."valeur", c."categorieId"
FROM "Creature" c
LEFT JOIN "Categorie" k ON k."id" = c."categorieId"
WHERE c."categorieId" IS NOT NULL
  AND k."id" IS NULL
ORDER BY c."id";

-- 5) Intégrité FK: personnage inexistant
SELECT c."id", c."valeur", c."personnageId"
FROM "Creature" c
LEFT JOIN "Personnage" p ON p."id" = c."personnageId"
WHERE c."personnageId" IS NOT NULL
  AND p."id" IS NULL
ORDER BY c."id";

-- 6) Échantillon lisible
SELECT
  c."id",
  c."valeur",
  c."type",
  c."cultureId",
  c."categorieId",
  c."personnageId",
  c."createdAt"
FROM "Creature" c
ORDER BY c."id" ASC
LIMIT 200;

-- 7) Vérification de présence des 150 attendues (par valeur)
WITH expected(valeur) AS (
  VALUES
    ('Aegirion'),('Brûle-Saule'),('Cendrelin'),('Dorselune'),('Echine-de-Givre'),
    ('Fauche-Orage'),('Gourel'),('Harpie d’Écume'),('Ivoire-Rouge'),('Jaseuse'),
    ('Korr des Ruches'),('Lézard-Étincelle'),('Morne-Broute'),('Nacre-Voile'),('Ombre-Bourdon'),
    ('Pilleur de Songes'),('Quartz-Fendu'),('Rictus des Caves'),('Sangsue-Charme'),('Tisseur d’Aube'),
    ('Umbrelame'),('Vigie-Brume'),('Wyrm de Tourbe'),('Xylophage'),('Yeux-Deux-Fois'),
    ('Zéphyrin'),('Aurore-Mangeuse'),('Bec-de-Fer'),('Cavalier Sans-Peu'),('Dent-de-Sel'),
    ('Échine-Fougère'),('Fiole-Fauve'),('Givrelaine'),('Hurle-Cendre'),('Iconophage'),
    ('Jument d’Obsidienne'),('Képi-Gris'),('Lanterne-Vivante'),('Mante-Prière'),('Nid-aux-Os'),
    ('Orgueil-Ronce'),('Porte-Écho'),('Queue-de-Braise'),('Ronge-Serment'),('Sablier'),
    ('Tambour-Foudre'),('Urne-Rampante'),('Vermine-Satin'),('Wisp d’Encre'),('Xénial'),
    ('Yokelame'),('Zar-Moiré'),('Ardent-Mycèle'),('Basilic des Miroirs'),('Croc-Équinoxe'),
    ('Drille-Charbon'),('Écaille-Rumeur'),('Faucon-Voilé'),('Galet-Roi'),('Houle-Feutrée'),
    ('Inciseur'),('Jade-Épine'),('Kraket'),('Liseur-de-Peau'),('Murmure-Roc'),
    ('Négatif'),('Ogre des Vignes'),('Pique-Feuille'),('Quenouille'),('Râle-de-Vase'),
    ('Siffle-Quai'),('Tonne-Corne'),('Usure'),('Vitrail'),('Warg-Clos'),
    ('Xarque'),('Ysil'),('Zinzolin'),('Aile-Scorie'),('Boue-Drôle'),
    ('Corne-Grêle'),('Dague-Épine'),('Éther-Glouton'),('Fossile-Errant'),('Garde-Écarlate'),
    ('Haleine-Bleue'),('Inflexion'),('Jarre-aux-Mouches'),('Kite-Sombre'),('Lame-de-Récif'),
    ('Mange-Suif'),('Nœud-de-Foudre'),('Oiseau-Charte'),('Poussière-Guide'),('Quêteuse'),
    ('Roule-Épave'),('Suaire'),('Trancheronce'),('Usurpateur d’Air'),('Vase-Couronne'),
    ('Wolfram'),('Xylo-Oracle'),('Yokeur'),('Zèle-Glace'),('Amas-Sucre'),
    ('Braise-Moine'),('Cierge-Errant'),('Doreur de Peaux'),('Épine-Couronne'),('Fauve-Sel'),
    ('Garde-Feu'),('Hématite'),('Iris-Double'),('Jonc-Siffleur'),('Kermès'),
    ('Lige-Tempête'),('Miroitante'),('Nerf-Noir'),('Ossuaire'),('Pique-Quai'),
    ('Quasi-Nuit'),('Racine-Longue'),('Scellement'),('Trébuchet'),('Ulcère'),
    ('Verrier'),('Wadi'),('Xénogriffe'),('Yolande la Pâle'),('Zarath-Boue'),
    ('Astra-Pique'),('Bec-aux-Runes'),('Claque-Braise'),('Dune-Rouge'),('Écoute-Terre'),
    ('Fiel-de-Lys'),('Griffe-Lagon'),('Horizon-Cassé'),('Insolent'),('Jarre-aux-Serments'),
    ('Krohn'),('Lueur-Fiel'),('Mèche-Longue'),('Nacréon'),('Ocre-Soleil'),
    ('Panse-Givre'),('Quenotte')
)
SELECT e.valeur AS missing_valeur
FROM expected e
LEFT JOIN "Creature" c ON c."valeur" = e.valeur
WHERE c."id" IS NULL
ORDER BY e.valeur;

-- 8) Résumé “attendus présents”
WITH expected(valeur) AS (
  VALUES
    ('Aegirion'),('Brûle-Saule'),('Cendrelin'),('Dorselune'),('Echine-de-Givre'),
    ('Fauche-Orage'),('Gourel'),('Harpie d’Écume'),('Ivoire-Rouge'),('Jaseuse'),
    ('Korr des Ruches'),('Lézard-Étincelle'),('Morne-Broute'),('Nacre-Voile'),('Ombre-Bourdon'),
    ('Pilleur de Songes'),('Quartz-Fendu'),('Rictus des Caves'),('Sangsue-Charme'),('Tisseur d’Aube'),
    ('Umbrelame'),('Vigie-Brume'),('Wyrm de Tourbe'),('Xylophage'),('Yeux-Deux-Fois'),
    ('Zéphyrin'),('Aurore-Mangeuse'),('Bec-de-Fer'),('Cavalier Sans-Peu'),('Dent-de-Sel'),
    ('Échine-Fougère'),('Fiole-Fauve'),('Givrelaine'),('Hurle-Cendre'),('Iconophage'),
    ('Jument d’Obsidienne'),('Képi-Gris'),('Lanterne-Vivante'),('Mante-Prière'),('Nid-aux-Os'),
    ('Orgueil-Ronce'),('Porte-Écho'),('Queue-de-Braise'),('Ronge-Serment'),('Sablier'),
    ('Tambour-Foudre'),('Urne-Rampante'),('Vermine-Satin'),('Wisp d’Encre'),('Xénial'),
    ('Yokelame'),('Zar-Moiré'),('Ardent-Mycèle'),('Basilic des Miroirs'),('Croc-Équinoxe'),
    ('Drille-Charbon'),('Écaille-Rumeur'),('Faucon-Voilé'),('Galet-Roi'),('Houle-Feutrée'),
    ('Inciseur'),('Jade-Épine'),('Kraket'),('Liseur-de-Peau'),('Murmure-Roc'),
    ('Négatif'),('Ogre des Vignes'),('Pique-Feuille'),('Quenouille'),('Râle-de-Vase'),
    ('Siffle-Quai'),('Tonne-Corne'),('Usure'),('Vitrail'),('Warg-Clos'),
    ('Xarque'),('Ysil'),('Zinzolin'),('Aile-Scorie'),('Boue-Drôle'),
    ('Corne-Grêle'),('Dague-Épine'),('Éther-Glouton'),('Fossile-Errant'),('Garde-Écarlate'),
    ('Haleine-Bleue'),('Inflexion'),('Jarre-aux-Mouches'),('Kite-Sombre'),('Lame-de-Récif'),
    ('Mange-Suif'),('Nœud-de-Foudre'),('Oiseau-Charte'),('Poussière-Guide'),('Quêteuse'),
    ('Roule-Épave'),('Suaire'),('Trancheronce'),('Usurpateur d’Air'),('Vase-Couronne'),
    ('Wolfram'),('Xylo-Oracle'),('Yokeur'),('Zèle-Glace'),('Amas-Sucre'),
    ('Braise-Moine'),('Cierge-Errant'),('Doreur de Peaux'),('Épine-Couronne'),('Fauve-Sel'),
    ('Garde-Feu'),('Hématite'),('Iris-Double'),('Jonc-Siffleur'),('Kermès'),
    ('Lige-Tempête'),('Miroitante'),('Nerf-Noir'),('Ossuaire'),('Pique-Quai'),
    ('Quasi-Nuit'),('Racine-Longue'),('Scellement'),('Trébuchet'),('Ulcère'),
    ('Verrier'),('Wadi'),('Xénogriffe'),('Yolande la Pâle'),('Zarath-Boue'),
    ('Astra-Pique'),('Bec-aux-Runes'),('Claque-Braise'),('Dune-Rouge'),('Écoute-Terre'),
    ('Fiel-de-Lys'),('Griffe-Lagon'),('Horizon-Cassé'),('Insolent'),('Jarre-aux-Serments'),
    ('Krohn'),('Lueur-Fiel'),('Mèche-Longue'),('Nacréon'),('Ocre-Soleil'),
    ('Panse-Givre'),('Quenotte')
),
present AS (
  SELECT DISTINCT c."valeur"
  FROM "Creature" c
)
SELECT
  (SELECT COUNT(*) FROM expected) AS expected_total,
  (SELECT COUNT(*) FROM present p JOIN expected e ON e.valeur = p."valeur") AS expected_present,
  (SELECT COUNT(*) FROM expected e LEFT JOIN present p ON p."valeur" = e.valeur WHERE p."valeur" IS NULL) AS expected_missing;
