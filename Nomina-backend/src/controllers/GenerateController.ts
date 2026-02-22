import type { Request, Response } from "express";
import { z } from "zod";
import { generateNpcIdeas } from "../services/generation/npcGenerator";
import prisma from "../utils/prisma";
import { createRng } from "../services/generation/rng";

function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function splitKeywords(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeTextKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function uniqueByNormalizedText<T>(items: T[], getText: (item: T) => string | null | undefined): T[] {
  const seen = new Set<string>();
  const out: T[] = [];

  for (const item of items) {
    const raw = getText(item) ?? "";
    const key = normalizeTextKey(raw);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function scoreKeywordMatch(text: string, keywords: string[]): number {
  const source = (text || "").toLowerCase();
  if (!source || keywords.length === 0) return 0;

  let score = 0;
  for (const kwRaw of keywords) {
    const kw = kwRaw.toLowerCase();
    if (!kw) continue;
    if (source === kw) score += 200;
    else if (source.includes(kw)) score += 60;
  }
  return score;
}

function expandTitreKeywordTerms(keywords: string[]): string[] {
  const out = new Set<string>();

  const add = (v: string) => {
    const s = v.trim().toLowerCase();
    if (s) out.add(s);
  };

  for (const kw of keywords) {
    const k = kw.trim().toLowerCase();
    if (!k) continue;
    add(k);

    if (k.includes("feu") || k.includes("incend")) {
      ["pompier", "incendie", "brasier", "flamme", "secours"].forEach(add);
    }
    if (k.includes("comba") || k.includes("guer") || k.includes("bata")) {
      ["combat", "armée", "armee", "guerrier", "soldat", "sécurité", "securite"].forEach(add);
    }
  }

  return Array.from(out);
}

const countQuerySchema = z.coerce.number().int().min(1).max(200).default(10);
const optionalIdQuerySchema = z.coerce.number().int().optional();
const optionalStringQuerySchema = z
  .string()
  .transform((s) => s.trim())
  .optional()
  .transform((s) => (s && s.length > 0 ? s : undefined));

function normalizeAppliesToValues(input?: string): string[] | undefined {
  if (!input) return undefined;

  const raw = input.trim();
  if (!raw) return undefined;

  const key = raw.toLowerCase();
  const map: Record<string, string[]> = {
    npc: ["npc", "personnage", "nomPersonnage"],
    personnage: ["personnage", "nomPersonnage", "npc"],
    nompersonnage: ["nomPersonnage", "personnage", "npc"],
    lieu: ["lieu", "lieux"],
    lieux: ["lieux", "lieu"],
    objet: ["objet"],
    intrigue: ["intrigue", "quete", "quête"],
    quete: ["quete", "quête", "intrigue"],
    "quête": ["quête", "quete", "intrigue"],
    univers: ["univers"],
    fragmentshistoire: ["fragmentsHistoire"],
  };

  return map[key] ?? [raw];
}

export const generateNpcs = async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({
        count: countQuerySchema,
        cultureId: optionalIdQuerySchema,
        categorieId: optionalIdQuerySchema,
        genre: optionalStringQuerySchema,
        seed: optionalStringQuerySchema,
        keywords: optionalStringQuerySchema,
      })
      .safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Paramètres invalides",
        issues: parsed.error.issues,
      });
    }

    const { count, cultureId, categorieId, genre, seed, keywords } = parsed.data;

    const kws = splitKeywords(keywords);
    const requestedCount = Math.min(count * 4, 120);

    const result = await generateNpcIdeas({ count: requestedCount, cultureId, categorieId, genre, seed });
    const baseItems = Array.isArray((result as any).items) ? (result as any).items : [];
    const uniqueBaseItems = uniqueByNormalizedText(baseItems, (it: any) => `${it?.fullName ?? it?.name ?? ""}`);

    if (kws.length === 0) {
      const items = uniqueBaseItems.slice(0, count);
      return res.json({
        ...(result as any),
        count: items.length,
        items,
      });
    }

    const ranked = uniqueBaseItems
      .map((it: any) => ({
        item: it,
        score: scoreKeywordMatch(`${it?.name ?? ""} ${it?.backstory ?? ""}`, kws),
      }))
      .sort((a: any, b: any) => b.score - a.score);

    const matched = ranked.filter((x: any) => x.score > 0).map((x: any) => x.item);
    const fallback = ranked.map((x: any) => x.item);
    const items = (matched.length > 0 ? matched : fallback).slice(0, count);

    return res.json({
      ...(result as any),
      count: items.length,
      filters: {
        ...((result as any).filters ?? {}),
        keywords: kws.join(", "),
      },
      items,
      info: matched.length > 0 ? `Résultats classés par pertinence pour: ${kws.join(", ")}` : undefined,
      warning:
        matched.length === 0
          ? `Aucun PNJ ne matche directement: ${kws.join(", ")}. Suggestions affichées.`
          : (result as any).warning,
    });
  } catch (error) {
    console.error("Erreur generateNpcs:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

function normalizeGenreValues(input: string): string[] {
  const raw = input.trim();
  if (!raw) return [];
  const lc = raw.toLowerCase();

  const m = new Set<string>();
  const add = (s: string) => {
    if (s && s.trim()) m.add(s);
  };

  // Ajout des variantes courantes (la BD peut contenir "M"/"F"/"NB" OU des libellés).
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
  } else if (["creature", "créature", "monster", "monstre", "beast", "bête"].includes(lc)) {
    ["Creature", "creature", "Créature", "créature", "Monster", "monster", "Monstre", "monstre", "Beast", "beast", "Bête", "bête"].forEach(add);
  } else {
    // Si c'est une valeur custom (ex: "androgyne"), on la garde telle quelle.
    add(raw);
  }

  return Array.from(m);
}

function buildGenreWhere(input?: string): { in: string[] } | undefined {
  if (input === undefined) return undefined;
  const values = normalizeGenreValues(input);
  return values.length > 0 ? { in: values } : undefined;
}

function toTitleCase(input: string): string {
  const s = input.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateRealisticConceptIdeas(params: {
  count: number;
  seed?: string;
  topic: string;
  categorieId?: number;
  rng: ReturnType<typeof createRng>;
}) {
  const { count, seed, topic, categorieId, rng } = params;
  const effectiveSeed = seed ?? rng.seed;

  const normalizedTopic = topic.trim();
  const topicLabel = toTitleCase(normalizedTopic);

  const angles = [
    "durabilité",
    "confort",
    "performance",
    "style",
    "innovation",
    "accessibilité",
    "personnalisation",
    "éthique",
    "prix malin",
    "communauté",
  ];

  const formats = [
    "challenge UGC",
    "expérience retail",
    "campagne social-first",
    "partenariat influence",
    "activation événementielle",
    "mini-série vidéo",
    "test AR / try-on",
    "programme d'ambassadeurs",
    "stunt PR",
    "produit-service (abonnement)",
  ];

  const audiences = [
    "étudiants",
    "jeunes actifs",
    "sportifs",
    "parents",
    "professionnels",
    "urbains",
    "randonneurs",
    "créatifs",
    "fans de mode",
  ];

  const channels = [
    "TikTok",
    "Instagram",
    "YouTube Shorts",
    "affichage (OOH)",
    "podcasts",
    "newsletter",
    "pop-up store",
    "partenariats locaux",
    "événements",
    "site + landing",
  ];

  const deliverables = [
    "3 vidéos courtes (15–30s)",
    "1 landing page",
    "1 kit influence",
    "1 plan media",
    "1 concept visuel (key visual)",
    "1 slogan + variantes",
    "1 mécanique UGC",
    "1 activation terrain",
  ];

  const verbs = ["réinventer", "simplifier", "réduire", "améliorer", "déclencher", "transformer", "réconcilier"];
  const benefits = [
    "le quotidien",
    "la mobilité",
    "la confiance",
    "la liberté",
    "le bien-être",
    "la créativité",
    "l'engagement",
  ];

  const items = Array.from({ length: Math.min(count, 50) }).map((_, i) => {
    const angle = pick(angles, rng.next);
    const format = pick(formats, rng.next);
    const audience = pick(audiences, rng.next);
    const primaryChannel = pick(channels, rng.next);
    const verb = pick(verbs, rng.next);
    const benefit = pick(benefits, rng.next);

    const title = `${topicLabel} — ${toTitleCase(angle)}`;
    const insight = `Les gens veulent ${verb} ${benefit} sans sacrifier ${angle}.`;
    const hook = `Accroche: et si vos ${normalizedTopic} prouvaient (en 10 secondes) la différence ?`;
    const elevatorPitch =
      `Concept ${format} pour ${topicLabel}, centré sur ${angle}, ciblant ${audience}. ` +
      `On déclenche l'essai via ${primaryChannel}, puis on convertit avec une promesse simple et mesurable.`;

    const slogans = [
      `${topicLabel}. ${toTitleCase(angle)} qui se voit.`,
      `Marchez plus loin, pensez ${toTitleCase(angle)}.`,
      `${toTitleCase(angle)} sans compromis.`,
    ];

    const kpis = [
      "Taux de visionnage (VTR)",
      "CTR vers la landing",
      "Taux d'ajout au panier",
      "Coût par lead",
      "UGC créés",
      "Trafic en boutique",
    ];

    return {
      id: `prompt-${i + 1}`,
      valeur: title,
      type: "Concept réaliste (brief)" as const,
      mood: "innovant" as const,
      keywords: [normalizedTopic, angle, audience, primaryChannel].join(", "),
      categorieId: categorieId ?? null,
      elevatorPitch,
      insight,
      hook,
      channels: [primaryChannel, pick(channels, rng.next), pick(channels, rng.next)].filter(Boolean),
      deliverables: [pick(deliverables, rng.next), pick(deliverables, rng.next), pick(deliverables, rng.next)],
      slogans,
      kpis: [pick(kpis, rng.next), pick(kpis, rng.next), pick(kpis, rng.next)],
    };
  });

  return {
    seed: effectiveSeed,
    count: items.length,
    filters: { categorieId: categorieId ?? null, topic: normalizedTopic },
    items,
  };
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

// GET /generate/nom-personnages
export const generateNomPersonnages = async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({
        count: countQuerySchema,
        cultureId: optionalIdQuerySchema,
        universId: optionalIdQuerySchema,
        categorieId: optionalIdQuerySchema,
        titreId: optionalIdQuerySchema,
        genre: optionalStringQuerySchema,
        seed: optionalStringQuerySchema,
        keywords: optionalStringQuerySchema,
      })
      .safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Paramètres invalides",
        issues: parsed.error.issues,
      });
    }

    const { count, cultureId, universId, categorieId, titreId, genre, seed, keywords } = parsed.data;

    const kws = splitKeywords(keywords);
    const requestedCount = kws.length > 0 ? Math.min(count * 3, 60) : count;

    let effectiveCultureId = cultureId;
    let effectiveCategorieId = categorieId;
    let effectiveGenre = genre;
    let selectedTitre: {
      id: number;
      valeur: string;
      genre: string | null;
      cultureId: number | null;
      categorieId: number | null;
      categorieUniversId: number | null;
    } | null = null;

    if (titreId !== undefined) {
      const t = await prisma.titre.findUnique({
        where: { id: titreId },
        select: {
          id: true,
          valeur: true,
          genre: true,
          cultureId: true,
          categorieId: true,
          categorie: { select: { universId: true } },
        },
      });

      if (!t) {
        return res.status(404).json({ error: "Titre introuvable" });
      }

      selectedTitre = {
        id: t.id,
        valeur: t.valeur,
        genre: t.genre ?? null,
        cultureId: t.cultureId ?? null,
        categorieId: t.categorieId ?? null,
        categorieUniversId: t.categorie?.universId ?? null,
      };

      // Compatibilités strictes si l'utilisateur a déjà choisi un filtre.
      if (effectiveCultureId !== undefined && selectedTitre.cultureId !== null && effectiveCultureId !== selectedTitre.cultureId) {
        return res.status(400).json({ error: "Titre incompatible avec la culture sélectionnée" });
      }
      if (effectiveCategorieId !== undefined && selectedTitre.categorieId !== null && effectiveCategorieId !== selectedTitre.categorieId) {
        return res.status(400).json({ error: "Titre incompatible avec la catégorie sélectionnée" });
      }
      if (universId !== undefined && selectedTitre.categorieUniversId !== null && universId !== selectedTitre.categorieUniversId) {
        return res.status(400).json({ error: "Titre incompatible avec l'univers sélectionné" });
      }
      if (effectiveGenre !== undefined && selectedTitre.genre !== null) {
        const want = new Set(normalizeGenreValues(effectiveGenre));
        const have = new Set(normalizeGenreValues(selectedTitre.genre));
        const ok = Array.from(have).some((v) => want.has(v));
        if (!ok) {
          return res.status(400).json({ error: "Titre incompatible avec le genre sélectionné" });
        }
      }

      // Defaults: si le titre porte déjà des contraintes, on s'aligne.
      if (effectiveCultureId === undefined && selectedTitre.cultureId !== null) effectiveCultureId = selectedTitre.cultureId;
      if (effectiveCategorieId === undefined && selectedTitre.categorieId !== null) effectiveCategorieId = selectedTitre.categorieId;
      if (effectiveGenre === undefined && selectedTitre.genre !== null) effectiveGenre = selectedTitre.genre;
    }

    const generated = await generateNpcIdeas({
      count: requestedCount,
      cultureId: effectiveCultureId,
      categorieId: effectiveCategorieId,
      universId,
      genre: effectiveGenre,
      seed,
    });

    const toMiniBio = (text: string | undefined): string | null => {
      if (!text) return null;
      const trimmed = text.trim();
      if (!trimmed) return null;

      // Mini-bio: 3–5 phrases max, mais on évite les pavés.
      const parts = trimmed
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const maxSentences = 5;
      const maxChars = 420;

      const out: string[] = [];
      for (const sentence of parts.slice(0, maxSentences)) {
        const candidate = [...out, sentence].join(" ");
        if (candidate.length > maxChars) break;
        out.push(sentence);
      }

      const take = out.join(" ").trim();
      return take.length > 0 ? take : null;
    };

    const mappedItems = Array.isArray((generated as any).items)
      ? (generated as any).items.map((it: any) => ({
          nameId: it.nameId ?? null,
          name: it.name ?? null,
          displayName:
            selectedTitre && it.name
              ? `${selectedTitre.valeur} ${it.name}`
              : (it.name ?? null),
          titreId: selectedTitre?.id ?? null,
          titreValeur: selectedTitre?.valeur ?? null,
          genre: it.genre ?? null,
          cultureId: it.cultureId ?? null,
          categorieId: it.categorieId ?? null,
          miniBio: toMiniBio(it.backstory),
        }))
      : [];

    const uniqueMappedItems = uniqueByNormalizedText(mappedItems, (it: any) => `${it?.displayName ?? it?.name ?? ""}`);

    const ranked = uniqueMappedItems
      .map((it: any) => ({
        item: it,
        score: scoreKeywordMatch(`${it?.name ?? ""} ${it?.displayName ?? ""} ${it?.miniBio ?? ""}`, kws),
      }))
      .sort((a: any, b: any) => b.score - a.score);

    const matched = kws.length > 0 ? ranked.filter((x: any) => x.score > 0).map((x: any) => x.item) : [];
    const fallback = kws.length > 0 ? ranked.map((x: any) => x.item) : uniqueMappedItems;
    const items = (kws.length > 0 ? (matched.length > 0 ? matched : fallback) : uniqueMappedItems).slice(0, count);

    res.json({
      seed: (generated as any).seed,
      count: items.length,
      filters: {
        ...((generated as any).filters ?? {
          cultureId: effectiveCultureId ?? null,
          categorieId: effectiveCategorieId ?? null,
          genre: effectiveGenre ?? null,
        }),
        universId: universId ?? null,
        titreId: selectedTitre?.id ?? (titreId ?? null),
        keywords: kws.length > 0 ? kws.join(", ") : null,
      },
      items,
      warning:
        kws.length > 0 && matched.length === 0
          ? `Aucun nom de personnage ne matche directement: ${kws.join(", ")}. Suggestions affichées.`
          : (generated as any).warning,
      info: kws.length > 0 && matched.length > 0 ? `Résultats classés par pertinence pour: ${kws.join(", ")}` : undefined,
    });
  } catch (error) {
    console.error("Erreur generateNomPersonnages:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /generate/nom-famille
export const generateNomFamille = async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({
        count: countQuerySchema,
        cultureId: optionalIdQuerySchema,
        categorieId: optionalIdQuerySchema,
        seed: optionalStringQuerySchema,
        keywords: optionalStringQuerySchema,
      })
      .safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Paramètres invalides",
        issues: parsed.error.issues,
      });
    }

    const { count, cultureId, categorieId, seed, keywords } = parsed.data;

    const rng = createRng(seed);
    const effectiveSeed = seed ?? rng.seed;

    // Mode recherche par keywords
    if (keywords && keywords.trim()) {
      const kws = keywords
        .split(/[,;]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      if (kws.length > 0) {
        const rows = await prisma.nomFamille.findMany({
          where: {
            ...(cultureId ? { cultureId } : {}),
            ...(categorieId ? { categorieId } : {}),
            OR: kws.map((kw) => ({
              valeur: { contains: kw, mode: "insensitive" },
            })),
          },
          select: { id: true, valeur: true, cultureId: true, categorieId: true },
          orderBy: { id: "asc" },
        });

        if (rows.length > 0) {
          const uniqueRows = uniqueByNormalizedText(rows, (nf) => nf.valeur);
          const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map((nf) => ({
            id: nf.id,
            valeur: nf.valeur,
            cultureId: nf.cultureId ?? null,
            categorieId: nf.categorieId ?? null,
          }));

          return res.json({
            seed: effectiveSeed,
            count: items.length,
            filters: {
              cultureId: cultureId ?? null,
              categorieId: categorieId ?? null,
              keywords: kws.join(", "),
            },
            items,
            info: `Résultats trouvés pour: ${kws.join(", ")}`,
          });
        } else {
          const fallbackRows = await prisma.nomFamille.findMany({
            where: {
              ...(cultureId ? { cultureId } : {}),
              ...(categorieId ? { categorieId } : {}),
            },
            select: { id: true, valeur: true, cultureId: true, categorieId: true },
            orderBy: { id: "asc" },
          });

          const uniqueFallbackRows = uniqueByNormalizedText(fallbackRows, (nf) => nf.valeur);
          const items = sampleWithoutReplacement(uniqueFallbackRows, Math.min(count, uniqueFallbackRows.length), rng.next).map((nf) => ({
            id: nf.id,
            valeur: nf.valeur,
            cultureId: nf.cultureId ?? null,
            categorieId: nf.categorieId ?? null,
          }));

          return res.json({
            seed: effectiveSeed,
            count: items.length,
            filters: {
              cultureId: cultureId ?? null,
              categorieId: categorieId ?? null,
              keywords: kws.join(", "),
            },
            items,
            warning:
              items.length === 0
                ? `Aucun nom de famille disponible avec les filtres demandés.`
                : `Aucun match exact pour "${kws.join(", ")}". Suggestions affichées.`,
          });
        }
      }
    }

    const rows = await prisma.nomFamille.findMany({
      where: {
        ...(cultureId ? { cultureId } : {}),
        ...(categorieId ? { categorieId } : {}),
      },
      select: { id: true, valeur: true, cultureId: true, categorieId: true },
      orderBy: { id: "asc" },
    });

    const uniqueRows = uniqueByNormalizedText(rows, (nf) => nf.valeur);
    const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map((nf) => ({
      id: nf.id,
      valeur: nf.valeur,
      cultureId: nf.cultureId ?? null,
      categorieId: nf.categorieId ?? null,
    }));

    res.json({
      seed: effectiveSeed,
      count: items.length,
      filters: {
        cultureId: cultureId ?? null,
        categorieId: categorieId ?? null,
      },
      items,
      warning: uniqueRows.length === 0 ? "Aucun nom de famille ne match les filtres." : undefined,
    });
  } catch (error) {
    console.error("Erreur generateNomFamille:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /generate/lieux
export const generateLieux = async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({
        count: countQuerySchema,
        categorieId: optionalIdQuerySchema,
        seed: optionalStringQuerySchema,
        keywords: optionalStringQuerySchema,
      })
      .safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Paramètres invalides",
        issues: parsed.error.issues,
      });
    }

    const { count, categorieId, seed, keywords } = parsed.data;

    const rng = createRng(seed);
    const effectiveSeed = seed ?? rng.seed;

    // Mode recherche par keywords
    if (keywords && keywords.trim()) {
      const kws = keywords
        .split(/[,;]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      if (kws.length > 0) {
        const rows = await prisma.lieux.findMany({
          where: {
            ...(categorieId ? { categorieId } : {}),
            OR: kws.map((kw) => ({
              OR: [
                { value: { contains: kw, mode: "insensitive" } },
                { type: { contains: kw, mode: "insensitive" } },
              ],
            })),
          },
          select: { id: true, value: true, type: true, categorieId: true },
          orderBy: { id: "asc" },
        });

        if (rows.length > 0) {
          const uniqueRows = uniqueByNormalizedText(rows, (l) => `${l.value ?? ""} ${l.type ?? ""}`);
          const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map((l) => ({
            id: l.id,
            value: l.value,
            type: l.type ?? null,
            categorieId: l.categorieId ?? null,
          }));

          return res.json({
            seed: effectiveSeed,
            count: items.length,
            filters: {
              categorieId: categorieId ?? null,
              keywords: kws.join(", "),
            },
            items,
            info: `Résultats trouvés pour: ${kws.join(", ")}`,
          });
        } else {
          const fallbackRows = await prisma.lieux.findMany({
            where: {
              ...(categorieId ? { categorieId } : {}),
            },
            select: { id: true, value: true, type: true, categorieId: true },
            orderBy: { id: "asc" },
          });

          const uniqueFallbackRows = uniqueByNormalizedText(fallbackRows, (l) => `${l.value ?? ""} ${l.type ?? ""}`);
          const items = sampleWithoutReplacement(uniqueFallbackRows, Math.min(count, uniqueFallbackRows.length), rng.next).map((l) => ({
            id: l.id,
            value: l.value,
            type: l.type ?? null,
            categorieId: l.categorieId ?? null,
          }));

          return res.json({
            seed: effectiveSeed,
            count: items.length,
            filters: {
              categorieId: categorieId ?? null,
              keywords: kws.join(", "),
            },
            items,
            warning:
              uniqueFallbackRows.length === 0
                ? `Aucun lieu disponible avec les filtres demandés.`
                : `Aucun lieu trouvé pour "${kws.join(", ")}". Voici des suggestions proches de votre univers.`,
          });
        }
      }
    }

    const rows = await prisma.lieux.findMany({
      where: {
        categorieId,
      },
      select: { id: true, value: true, type: true, categorieId: true },
      orderBy: { id: "asc" },
    });

    const uniqueRows = uniqueByNormalizedText(rows, (l) => `${l.value ?? ""} ${l.type ?? ""}`);
    const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map((l) => ({
      id: l.id,
      value: l.value,
      type: l.type ?? null,
      categorieId: l.categorieId ?? null,
    }));

    res.json({
      seed: effectiveSeed,
      count: items.length,
      filters: { categorieId: categorieId ?? null },
      items,
      warning: uniqueRows.length === 0 ? "Aucun Lieu ne match les filtres." : undefined,
    });
  } catch (error) {
    console.error("Erreur generateLieux:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /generate/fragments-histoire
export const generateFragmentsHistoire = async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({
        count: countQuerySchema,
        universId: optionalIdQuerySchema,
        cultureId: optionalIdQuerySchema,
        categorieId: optionalIdQuerySchema,
        genre: optionalStringQuerySchema,
        appliesTo: optionalStringQuerySchema,
        seed: optionalStringQuerySchema,
        keywords: optionalStringQuerySchema,
      })
      .safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Paramètres invalides",
        issues: parsed.error.issues,
      });
    }

    const { count, universId, cultureId, categorieId, genre, appliesTo, seed, keywords } = parsed.data;

    const rng = createRng(seed);
    const effectiveSeed = seed ?? rng.seed;

    const kws = splitKeywords(keywords);

    const appliesToValues = normalizeAppliesToValues(appliesTo);

    const rows = await prisma.fragmentsHistoire.findMany({
      where: {
        cultureId,
        categorieId,
        ...(universId !== undefined
          ? {
              categorie: {
                universId,
              },
            }
          : {}),
        genre: buildGenreWhere(genre),
        appliesTo: appliesToValues ? { in: appliesToValues } : undefined,
      },
      select: { id: true, texte: true, appliesTo: true, genre: true, cultureId: true, categorieId: true },
      orderBy: { id: "asc" },
    });

    const uniqueRows = uniqueByNormalizedText(rows, (f) => f.texte);
    const ranked = uniqueRows
      .map((f) => ({
        item: f,
        score:
          kws.length > 0
            ? scoreKeywordMatch(`${f.texte ?? ""} ${f.appliesTo ?? ""} ${f.genre ?? ""}`, kws)
            : 0,
      }))
      .sort((a, b) => b.score - a.score);

    const matched = kws.length > 0 ? ranked.filter((x) => x.score > 0).map((x) => x.item) : [];
    const sourceRows = kws.length > 0 ? (matched.length > 0 ? matched : ranked.map((x) => x.item)) : uniqueRows;

    const items = sampleWithoutReplacement(sourceRows, Math.min(count, sourceRows.length), rng.next).map((f) => ({
      id: f.id,
      texte: f.texte,
      appliesTo: f.appliesTo ?? null,
      genre: f.genre ?? null,
      cultureId: f.cultureId ?? null,
      categorieId: f.categorieId ?? null,
    }));

    res.json({
      seed: effectiveSeed,
      count: items.length,
      filters: {
        universId: universId ?? null,
        cultureId: cultureId ?? null,
        categorieId: categorieId ?? null,
        genre: genre ?? null,
        appliesTo: appliesTo ?? null,
        keywords: kws.length > 0 ? kws.join(", ") : null,
      },
      items,
      warning: uniqueRows.length === 0
        ? "Aucun Fragment d'histoire ne match les filtres."
        : kws.length > 0 && matched.length === 0
          ? `Aucun match exact pour "${kws.join(", ")}". Suggestions affichées.`
        : undefined,
      info: kws.length > 0 && matched.length > 0 ? `Résultats classés par pertinence pour: ${kws.join(", ")}` : undefined,
    });
  } catch (error) {
    console.error("Erreur generateFragmentsHistoire:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /generate/titres
export const generateTitres = async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({
        count: countQuerySchema,
        cultureId: optionalIdQuerySchema,
        categorieId: optionalIdQuerySchema,
        genre: optionalStringQuerySchema,
        seed: optionalStringQuerySchema,
        keywords: optionalStringQuerySchema,
      })
      .safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Paramètres invalides",
        issues: parsed.error.issues,
      });
    }

    const { count, cultureId, categorieId, genre, seed, keywords } = parsed.data;

    const rng = createRng(seed);
    const effectiveSeed = seed ?? rng.seed;

    if (keywords && keywords.trim()) {
      const kws = splitKeywords(keywords);
      const expandedTerms = expandTitreKeywordTerms(kws);

      if (expandedTerms.length > 0) {
        const rows = await prisma.titre.findMany({
          where: {
            cultureId,
            categorieId,
            genre: buildGenreWhere(genre),
            OR: expandedTerms.map((term) => ({
              OR: [
                { valeur: { contains: term, mode: "insensitive" } },
                { type: { contains: term, mode: "insensitive" } },
              ],
            })),
          },
          select: { id: true, valeur: true, type: true, genre: true, cultureId: true, categorieId: true },
          orderBy: { id: "asc" },
        });

        const lcBase = kws.map((k) => k.toLowerCase());
        const lcExpanded = expandedTerms;

        const scoreTitre = (t: { valeur: string; type: string | null }) => {
          const v = t.valeur.toLowerCase();
          const ty = (t.type ?? "").toLowerCase();
          let score = 0;

          const containsWord = (source: string, term: string) =>
            new RegExp(`(^|[^\\p{L}])${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}(?=$|[^\\p{L}])`, "iu").test(source);

          for (const kw of lcBase) {
            if (v === kw) score += 200;
            else if (v.startsWith(kw)) score += 120;
            else if (v.includes(kw)) score += 90;
            if (ty.includes(kw)) score += 45;
          }

          for (const term of lcExpanded) {
            if (lcBase.includes(term)) continue;
            if (v === term) score += 180;
            else if (containsWord(v, term)) score += 140;
            else if (v.startsWith(term)) score += 120;
            else if (v.includes(term)) score += 100;

            if (containsWord(ty, term)) score += 12;
            else if (ty.includes(term)) score += 8;
          }

          // Bonus métier explicite: "feu/combat" doit privilégier "pompier".
          if ((lcBase.some((k) => k.includes("feu") || k.includes("incend")) || lcExpanded.includes("pompier")) && containsWord(v, "pompier")) {
            score += 220;
          }

          return score;
        };

        const uniqueRows = uniqueByNormalizedText(rows, (t) => `${t.valeur ?? ""} ${t.type ?? ""}`);
        const ranked = uniqueRows
          .map((t) => ({ t, score: scoreTitre({ valeur: t.valeur, type: t.type ?? null }) }))
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.t.valeur.localeCompare(b.t.valeur, "fr");
          })
          .map((x) => x.t);

        let sourceRows = ranked;
        let usedFallbackSuggestions = false;

        if (sourceRows.length === 0) {
          const fallbackRows = await prisma.titre.findMany({
            where: {
              cultureId,
              categorieId,
              genre: buildGenreWhere(genre),
            },
            select: { id: true, valeur: true, type: true, genre: true, cultureId: true, categorieId: true },
            orderBy: { id: "asc" },
          });

          sourceRows = uniqueByNormalizedText(fallbackRows, (t) => `${t.valeur ?? ""} ${t.type ?? ""}`);
          usedFallbackSuggestions = sourceRows.length > 0;
        }

        const items = sourceRows.slice(0, count).map((t) => ({
          id: t.id,
          valeur: t.valeur,
          type: t.type ?? null,
          genre: t.genre ?? null,
          cultureId: t.cultureId ?? null,
          categorieId: t.categorieId ?? null,
        }));

        return res.json({
          seed: effectiveSeed,
          count: items.length,
          filters: { cultureId: cultureId ?? null, categorieId: categorieId ?? null, genre: genre ?? null, keywords: kws.join(", ") },
          items,
          warning:
            items.length === 0
              ? `Aucun titre trouvé pour: ${kws.join(", ")}`
              : usedFallbackSuggestions
                ? `Aucun match exact pour "${kws.join(", ")}". Suggestions affichées.`
                : undefined,
          info: uniqueRows.length > 0 ? `Titres classés par pertinence pour: ${kws.join(", ")}` : undefined,
        });
      }
    }

    const rows = await prisma.titre.findMany({
      where: {
        cultureId,
        categorieId,
        genre: buildGenreWhere(genre),
      },
      select: { id: true, valeur: true, type: true, genre: true, cultureId: true, categorieId: true },
      orderBy: { id: "asc" },
    });

    const uniqueRows = uniqueByNormalizedText(rows, (t) => `${t.valeur ?? ""} ${t.type ?? ""}`);
    const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map((t) => ({
      id: t.id,
      valeur: t.valeur,
      type: t.type ?? null,
      genre: t.genre ?? null,
      cultureId: t.cultureId ?? null,
      categorieId: t.categorieId ?? null,
    }));

    res.json({
      seed: effectiveSeed,
      count: items.length,
      filters: { cultureId: cultureId ?? null, categorieId: categorieId ?? null, genre: genre ?? null },
      items,
      warning: uniqueRows.length === 0 ? "Aucun Titre ne match les filtres." : undefined,
    });
  } catch (error) {
    console.error("Erreur generateTitres:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /generate/concepts
export const generateConcepts = async (req: Request, res: Response) => {
  try {
    const parsed = z
      .object({
        count: countQuerySchema,
        categorieId: optionalIdQuerySchema,
        conceptId: optionalIdQuerySchema,
        topic: optionalStringQuerySchema,
        seed: optionalStringQuerySchema,
        keywords: optionalStringQuerySchema,
      })
      .safeParse(req.query);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Paramètres invalides",
        issues: parsed.error.issues,
      });
    }

    const { count, categorieId, conceptId, topic, seed, keywords } = parsed.data;

    const requestedCategorieId = categorieId ?? null;

    const rng = createRng(seed);
    const effectiveSeed = seed ?? rng.seed;

    // Mode recherche par keywords
    if (keywords && keywords.trim()) {
      const kws = keywords
        .split(/[,;]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      if (kws.length > 0) {
        const rows = await prisma.concept.findMany({
          where: {
            ...(requestedCategorieId ? { categorieId: requestedCategorieId } : {}),
            OR: kws.map((kw) => ({
              OR: [
                { keywords: { contains: kw, mode: "insensitive" } },
                { valeur: { contains: kw, mode: "insensitive" } },
                { type: { contains: kw, mode: "insensitive" } },
              ],
            })),
          },
          select: {
            id: true,
            valeur: true,
            type: true,
            mood: true,
            keywords: true,
            categorieId: true,
          },
          orderBy: { id: "asc" },
        });

        if (rows.length > 0) {
          const uniqueRows = uniqueByNormalizedText(rows, (c) => `${c.valeur ?? ""} ${c.type ?? ""}`);
          const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map((c) => {
            const mood = c.mood ?? pick(["mystérieux", "épique", "sombre", "onirique", "tendu", "lumineux"], rng.next);
            const ckws = splitKeywords(c.keywords);
            const k1 = ckws[0] ?? pick(["secret", "quête", "rituel", "héritage", "frontière", "anomalie"], rng.next);
            const k2 = ckws[1] ?? pick(["alliance", "trahison", "mémoire", "artefact", "serment", "mensonge"], rng.next);
            const k3 = ckws[2] ?? pick(["prix", "conséquence", "danger", "révélation", "dilemme", "menace"], rng.next);

            return {
              id: c.id,
              valeur: c.valeur,
              type: c.type ?? null,
              mood,
              keyword1: k1,
              keyword2: k2,
              keyword3: k3,
              categorieId: c.categorieId ?? null,
            };
          });

          return res.json({
            seed: effectiveSeed,
            count: items.length,
            filters: {
              categorieId: requestedCategorieId,
              keywords: kws.join(", "),
            },
            items,
            info: `Résultats trouvés pour: ${kws.join(", ")}`,
          });
        } else {
          let fallbackRows = await prisma.concept.findMany({
            where: {
              ...(requestedCategorieId ? { categorieId: requestedCategorieId } : {}),
            },
            select: {
              id: true,
              valeur: true,
              type: true,
              mood: true,
              keywords: true,
              categorieId: true,
            },
            orderBy: { id: "asc" },
          });

          if (requestedCategorieId && fallbackRows.length === 0) {
            fallbackRows = await prisma.concept.findMany({
              select: {
                id: true,
                valeur: true,
                type: true,
                mood: true,
                keywords: true,
                categorieId: true,
              },
              orderBy: { id: "asc" },
            });
          }

          const uniqueFallbackRows = uniqueByNormalizedText(fallbackRows, (c) => `${c.valeur ?? ""} ${c.type ?? ""}`);
          const items = sampleWithoutReplacement(uniqueFallbackRows, Math.min(count, uniqueFallbackRows.length), rng.next).map((c) => {
            const mood = c.mood ?? pick(["mystérieux", "épique", "sombre", "onirique", "tendu", "lumineux"], rng.next);
            const ckws = splitKeywords(c.keywords);
            const k1 = ckws[0] ?? pick(["secret", "quête", "rituel", "héritage", "frontière", "anomalie"], rng.next);
            const k2 = ckws[1] ?? pick(["alliance", "trahison", "mémoire", "artefact", "serment", "mensonge"], rng.next);
            const k3 = ckws[2] ?? pick(["prix", "conséquence", "danger", "révélation", "dilemme", "menace"], rng.next);

            return {
              id: c.id,
              valeur: c.valeur,
              type: c.type ?? null,
              mood,
              keyword1: k1,
              keyword2: k2,
              keyword3: k3,
              categorieId: c.categorieId ?? null,
            };
          });

          return res.json({
            seed: effectiveSeed,
            count: items.length,
            filters: {
              categorieId: requestedCategorieId,
              keywords: kws.join(", "),
            },
            items,
            warning:
              items.length === 0
                ? `Aucun concept disponible avec les filtres demandés.`
                : `Aucun match exact pour "${kws.join(", ")}". Suggestions affichées.`,
          });
        }
      }
    }

    // Mode "brief" réaliste sur un sujet (ex: pub → chaussures)
    if (topic && topic.length > 0) {
      const generated = generateRealisticConceptIdeas({
        count,
        seed,
        topic,
        categorieId: requestedCategorieId ?? undefined,
        rng,
      });

      return res.json({
        ...generated,
        warning: requestedCategorieId ? undefined : "Astuce: sélectionnez une catégorie pour organiser vos concepts.",
      });
    }

    let usedFallback = false;

    let rows = await prisma.concept.findMany({
      where: {
        ...(requestedCategorieId ? { categorieId: requestedCategorieId } : {}),
        ...(conceptId ? { id: conceptId } : {}),
      },
      select: {
        id: true,
        valeur: true,
        type: true,
        mood: true,
        keywords: true,
        categorieId: true,
      },
      orderBy: { id: "asc" },
    });

    // Si la catégorie n'a aucun concept, on retombe sur tous les concepts pour éviter un "0 résultat" frustrant.
    // (On ne fait PAS de fallback si conceptId est fourni: dans ce cas, c'est une sélection explicite.)
    if (!conceptId && requestedCategorieId && rows.length === 0) {
      usedFallback = true;
      rows = await prisma.concept.findMany({
        select: {
          id: true,
          valeur: true,
          type: true,
          mood: true,
          keywords: true,
          categorieId: true,
        },
        orderBy: { id: "asc" },
      });
    }

    const uniqueRows = uniqueByNormalizedText(rows, (c) => `${c.valeur ?? ""} ${c.type ?? ""}`);
    const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map((c) => {
      const mood = c.mood ?? pick(["mystérieux", "épique", "sombre", "onirique", "tendu", "lumineux"], rng.next);
      const kws = splitKeywords(c.keywords);
      const k1 = kws[0] ?? pick(["secret", "quête", "rituel", "héritage", "frontière", "anomalie"], rng.next);
      const k2 = kws[1] ?? pick(["alliance", "trahison", "mémoire", "artefact", "serment", "mensonge"], rng.next);
      const k3 = kws[2] ?? pick(["prix", "conséquence", "danger", "révélation", "dilemme", "menace"], rng.next);

      const elevatorPitch = `« ${c.valeur} » est une idée ${mood} centrée sur ${k1} et ${k2}. Elle sert de moteur narratif et ouvre des arcs de quête, de conflit et de révélation.`;
      const twist = `Twist : ${k2} n'est qu'un écran — la véritable cause implique ${k3}.`;
      const hook = `Accroche : quand ${k1} refait surface, vos personnages doivent choisir entre préserver l'ordre ou dévoiler la vérité.`;
      const questions = [
        `Qui contrôle « ${c.valeur} » et pourquoi ?`,
        `Quel est le prix exact de ${k1} dans votre univers ?`,
      ];

      return {
        id: c.id,
        valeur: c.valeur,
        type: c.type ?? null,
        mood,
        keywords: c.keywords ?? null,
        categorieId: c.categorieId ?? null,

        // Champs "créatifs" (non persistés) pour enrichir la génération.
        elevatorPitch,
        twist,
        hook,
        questions,
      };
    });

    res.json({
      seed: effectiveSeed,
      count: items.length,
      filters: { categorieId: categorieId ?? null, conceptId: conceptId ?? null, topic: null },
      items,
      warning:
        uniqueRows.length === 0
          ? "Aucun Concept ne match les filtres."
          : usedFallback
            ? "Aucun Concept dans cette catégorie : génération faite sur l'ensemble des concepts."
            : undefined,
    });
  } catch (error) {
    console.error("Erreur generateConcepts:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

