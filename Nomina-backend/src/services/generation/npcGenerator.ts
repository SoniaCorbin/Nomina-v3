import prisma from "../../utils/prisma";
import { createRng } from "./rng";

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function capFirst(s: string) {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function composeFullName(prenom: string, nomFamille: string | null | undefined) {
  const first = (prenom ?? "").trim();
  const family = (nomFamille ?? "").trim();
  if (!family) return first;

  const firstNorm = normalizeName(first);
  const familyNorm = normalizeName(family);

  if (firstNorm.includes(familyNorm)) return first;
  return `${first} ${family}`.trim();
}

type GenerateNpcOptions = {
  count: number;
  cultureId?: number;
  categorieId?: number;
  universId?: number;
  socialClassId?: number;
  occupationId?: number;
  organizationId?: number;
  relationTypeId?: number;
  eventId?: number;
  genre?: string;
  seed?: string;
};

export async function generateNpcIdeas(options: GenerateNpcOptions) {
  const rng = createRng(options.seed);
  const seed = options.seed ?? rng.seed;

  const genreIn = options.genre ? normalizeGenreValues(options.genre) : undefined;
  const isCreatureGenreRequest = (genreIn ?? []).some(isCreatureGenreValue);

  const linkFiltersRequested =
    options.organizationId !== undefined ||
    options.relationTypeId !== undefined ||
    options.eventId !== undefined;

  const baseWhere: any = {
    cultureId: options.cultureId,
    categorieId: options.categorieId,
    socialClassId: options.socialClassId,
    occupationId: options.occupationId,
    ...(options.universId !== undefined
      ? {
          categorie: {
            universId: options.universId,
          },
        }
      : {}),
    genre: genreIn && genreIn.length > 0 ? { in: genreIn } : options.genre,
  };

  const strictWhere: any = {
    ...baseWhere,
    ...(options.organizationId !== undefined
      ? {
          memberships: {
            some: {
              organizationId: options.organizationId,
            },
          },
        }
      : {}),
    ...(options.relationTypeId !== undefined
      ? {
          OR: [
            {
              fromRelations: {
                some: {
                  relationTypeId: options.relationTypeId,
                },
              },
            },
            {
              toRelations: {
                some: {
                  relationTypeId: options.relationTypeId,
                },
              },
            },
          ],
        }
      : {}),
    ...(options.eventId !== undefined
      ? {
          events: {
            some: {
              eventId: options.eventId,
            },
          },
        }
      : {}),
  };

  let personnages = await prisma.personnage.findMany({
    where: strictWhere,
    select: {
      id: true,
      genre: true,
      cultureId: true,
      categorieId: true,
      prenom: { select: { valeur: true, genre: true, cultureId: true, categorieId: true } },
      nomFamille: { select: { valeur: true } },
    },
  });

  let relaxedLinkFilters = false;
  if (personnages.length === 0 && linkFiltersRequested) {
    personnages = await prisma.personnage.findMany({
      where: baseWhere,
      select: {
        id: true,
        genre: true,
        cultureId: true,
        categorieId: true,
        prenom: { select: { valeur: true, genre: true, cultureId: true, categorieId: true } },
        nomFamille: { select: { valeur: true } },
      },
    });
    relaxedLinkFilters = personnages.length > 0;
  }

  const enforcePersonnageFilters =
    options.socialClassId !== undefined ||
    options.occupationId !== undefined;

  let names = personnages.length > 0
    ? personnages
        .map((p) => ({
          id: p.id,
          valeur: p.prenom?.valeur ?? null,
          genre: p.genre ?? p.prenom?.genre ?? null,
          cultureId: p.cultureId ?? p.prenom?.cultureId ?? null,
          categorieId: p.categorieId ?? p.prenom?.categorieId ?? null,
          familyName: p.nomFamille?.valeur ?? null,
        }))
        .filter((p) => !!p.valeur)
    : enforcePersonnageFilters
      ? []
      : await prisma.prenom.findMany({
        where: {
          valeur: { not: null },
          cultureId: options.cultureId,
          categorieId: options.categorieId,
          ...(options.universId !== undefined
            ? {
                categorie: {
                  universId: options.universId,
                },
              }
            : {}),
          genre: genreIn && genreIn.length > 0 ? { in: genreIn } : options.genre,
        },
        select: {
          id: true,
          valeur: true,
          genre: true,
          cultureId: true,
          categorieId: true,
          nomFamille: { select: { valeur: true } },
        },
      }).then((rows) =>
        rows.map((r) => ({
          id: r.id,
          valeur: r.valeur,
          genre: r.genre,
          cultureId: r.cultureId,
          categorieId: r.categorieId,
          familyName: r.nomFamille?.valeur ?? null,
        }))
      );

  if (names.length === 0 && isCreatureGenreRequest && !enforcePersonnageFilters) {
    const creatures = await prisma.creature.findMany({
      where: {
        valeur: { not: "" },
        cultureId: options.cultureId,
        categorieId: options.categorieId,
        ...(options.universId !== undefined
          ? {
              categorie: {
                universId: options.universId,
              },
            }
          : {}),
      },
      select: {
        id: true,
        valeur: true,
        cultureId: true,
        categorieId: true,
      },
    });

    names = creatures.map((c) => ({
      id: c.id,
      valeur: c.valeur,
      genre: "créature",
      cultureId: c.cultureId,
      categorieId: c.categorieId,
      familyName: null,
    }));
  }

  if (names.length === 0) {
    return {
      seed,
      count: 0,
      filters: {
        cultureId: options.cultureId ?? null,
        categorieId: options.categorieId ?? null,
        socialClassId: options.socialClassId ?? null,
        occupationId: options.occupationId ?? null,
        organizationId: options.organizationId ?? null,
        relationTypeId: options.relationTypeId ?? null,
        eventId: options.eventId ?? null,
        genre: options.genre ?? null,
      },
      items: [],
      warning: enforcePersonnageFilters
        ? "Aucun Personnage ne match les filtres réalistes (classe sociale/métier)."
        : isCreatureGenreRequest
          ? "Aucune Créature ne match les filtres."
        : "Aucun Prénom ne match les filtres.",
    };
  }
  const uniqueNames = dedupeBy(names, (n) => normalizeName(composeFullName(n.valeur ?? "", n.familyName)));
    
  const fragmentWhere: any = {
    OR: [
      { appliesTo: null },
      { appliesTo: { in: ["npc", "personnage", "nomPersonnage"] } },
    ],
  };

  if (options.cultureId !== undefined) {
    fragmentWhere.AND = [...(fragmentWhere.AND ?? []), { OR: [{ cultureId: options.cultureId }, { cultureId: null }] }];
  }
  if (options.categorieId !== undefined) {
    fragmentWhere.AND = [...(fragmentWhere.AND ?? []), { OR: [{ categorieId: options.categorieId }, { categorieId: null }] }];
  }
  // NB: FragmentsHistoire ne sont pas liés directement à UniversThematique.
  // On laisse la sélection via categorieId (ou sans catégorie) pour les fragments.
  if (options.genre !== undefined) {
    const genreValues = normalizeGenreValues(options.genre);
    if (genreValues.length > 0) {
      fragmentWhere.AND = [
        ...(fragmentWhere.AND ?? []),
        { OR: [{ genre: { in: genreValues } }, { genre: null }] },
      ];
    } else {
      fragmentWhere.AND = [...(fragmentWhere.AND ?? []), { OR: [{ genre: options.genre }, { genre: null }] }];
    }
  }

  const fragments = await prisma.fragmentsHistoire.findMany({
    where: fragmentWhere,
    select: { id: true, texte: true, minNameLength: true, maxNameLength: true },
  });

  const items = [];
  const usedNameIds = new Set<number>();

  for (let i = 0; i < options.count; i++) {
    const name = pickUnique(uniqueNames, usedNameIds, rng.next);
    const nameText = name.valeur ?? "Inconnu";
    const familyText = (name.familyName ?? "").trim();
    const fullName = composeFullName(nameText, familyText);
    const nameLen = fullName.length;

    const eligibleFragments = fragments.filter(f => {
      if (f.minNameLength !== null && f.minNameLength !== undefined && nameLen < f.minNameLength) return false;
      if (f.maxNameLength !== null && f.maxNameLength !== undefined && nameLen > f.maxNameLength) return false;
      return true;
    });

    const fragmentCount = eligibleFragments.length >= 3 ? (rng.next() < 0.5 ? 2 : 3) : Math.min(2, eligibleFragments.length);
    const picked = sampleWithoutReplacement(eligibleFragments, fragmentCount, rng.next);

    const baseBackstory = picked
      .map(p => p.texte)
      .join(" ")
      .replaceAll("{name}", fullName)
      .trim();

    // Enrichissement: texte FR déterministe (évite lorem/latin)
    const roles = [
      "cartographe",
      "archiviste",
      "éclaireur",
      "forgeron",
      "messager",
      "médecin de campagne",
      "érudit itinérant",
      "marchande",
      "gardien",
      "diplomate",
    ];

    const traits = [
      "pragmatique",
      "audacieux",
      "méfiant",
      "loyal",
      "curieux",
      "imprévisible",
      "patient",
      "ambitieux",
      "mélancolique",
      "rusé",
    ];

    const hooks = [
      "une dette ancienne",
      "un pacte qu'il regrette",
      "un héritage interdit",
      "un secret de famille",
      "un nom qu'on lui a volé",
      "une promesse jamais tenue",
      "un crime dont il n'est pas sûr",
      "une prophétie incomplète",
    ];

    const lieux = [
      "les ruines",
      "les bas-fonds",
      "la frontière",
      "les archives",
      "les ports",
      "les montagnes",
      "les plaines",
      "les marchés",
    ];

    const role = capFirst(pick(roles, rng.next));
    const trait1 = pick(traits, rng.next);
    const trait2 = pick(traits, rng.next);
    const hook = capFirst(`Porte ${pick(hooks, rng.next)}.`);
    const extra = capFirst(
      `On le dit ${trait1} mais parfois ${trait2}; on l'a aperçu près de ${pick(lieux, rng.next)}.`
    );

    const backstory = [baseBackstory, `Rôle: ${role}.`, `Traits: ${trait1}, ${trait2}.`, hook, extra]
      .filter((s) => typeof s === "string" && s.trim().length > 0)
      .join(" ")
      .replaceAll("{name}", fullName)
      .trim();

    items.push({
      nameId: name.id,
      name: nameText,
      familyName: familyText || null,
      fullName: fullName || nameText,
      genre: name.genre ?? null,
      cultureId: name.cultureId ?? null,
      categorieId: name.categorieId ?? null,
      fragmentIds: picked.map(p => p.id),
      backstory,
      role,
      traits: [trait1, trait2],
      hook,
    });
  }

  return {
    seed,
    count: items.length,
    filters: {
      universId: options.universId ?? null,
      cultureId: options.cultureId ?? null,
      categorieId: options.categorieId ?? null,
      socialClassId: options.socialClassId ?? null,
      occupationId: options.occupationId ?? null,
      organizationId: options.organizationId ?? null,
      relationTypeId: options.relationTypeId ?? null,
      eventId: options.eventId ?? null,
      genre: options.genre ?? null,
    },
    items,
    warning: relaxedLinkFilters
      ? "Aucun Personnage ne match les filtres Organisation/Relation/Événement. Résultats élargis avec les autres filtres."
      : undefined,
  };
}

function normalizeGenreValues(input: string): string[] {
  const raw = input.trim();
  if (!raw) return [];
  const lc = raw.toLowerCase();

  const out = new Set<string>();
  const add = (s: string) => {
    if (s && s.trim()) out.add(s);
  };

  if (["m", "masculin", "male", "homme"].includes(lc)) {
    ["M", "m", "Masculin", "masculin", "Male", "male", "Homme", "homme"].forEach(add);
  } else if (["f", "féminin", "feminin", "female", "femme"].includes(lc)) {
    ["F", "f", "Féminin", "féminin", "Feminin", "feminin", "Female", "female", "Femme", "femme"].forEach(add);
  } else if (["nb", "non-binaire", "non binaire", "nonbinaire", "neutre", "neutral", "neutre."].includes(lc)) {
    [
      "NB",
      "nb",
      "Non-binaire",
      "non-binaire",
      "Non binaire",
      "non binaire",
      "Nonbinaire",
      "nonbinaire",
      "Neutre",
      "neutre",
      "Neutral",
      "neutral",
    ].forEach(add);
  } else if (isCreatureGenreValue(lc)) {
    [
      "Creature",
      "creature",
      "Créature",
      "créature",
      "Creatures",
      "creatures",
      "Créatures",
      "créatures",
      "Monster",
      "monster",
      "Monstre",
      "monstre",
      "Monstres",
      "monstres",
      "Bestiaire",
      "bestiaire",
    ].forEach(add);
  } else {
    add(raw);
  }

  return Array.from(out);
}

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function dedupeBy<T>(arr: T[], key: (x: T) => string) {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!k) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

function pickUnique<T extends { id: number }>(arr: T[], used: Set<number>, rnd: () => number): T {
  if (used.size >= arr.length) return arr[Math.floor(rnd() * arr.length)];
  let candidate = arr[Math.floor(rnd() * arr.length)];
  while (used.has(candidate.id)) candidate = arr[Math.floor(rnd() * arr.length)];
  used.add(candidate.id);
  return candidate;
}

function sampleWithoutReplacement<T>(arr: T[], k: number, rnd: () => number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < k && copy.length > 0; i++) {
    const idx = Math.floor(rnd() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

function isCreatureGenreValue(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  return ["creature", "creatures", "monster", "monstre", "monstres", "bestiaire"].includes(normalized);
}