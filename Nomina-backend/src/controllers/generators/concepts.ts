import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../utils/prisma";
import { createRng } from "../../services/generation/rng";
import {
  countQuerySchema,
  optionalIdQuerySchema,
  optionalStringQuerySchema,
  pick,
  splitKeywords,
  uniqueByNormalizedText,
  sampleWithoutReplacement,
  generateRealisticConceptIdeas,
} from "../../services/generation/generationHelpers";

export const generateConcepts = async (req: Request, res: Response) => {
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
    return res.status(400).json({ error: "Paramètres invalides", issues: parsed.error.issues });
  }

  const { count, categorieId, conceptId, topic, seed, keywords } = parsed.data;
  const requestedCategorieId = categorieId ?? null;
  const rng = createRng(seed);
  const effectiveSeed = seed ?? rng.seed;

  // Mode recherche par keywords
  if (keywords && keywords.trim()) {
    const kws = keywords.split(/[,;]+/).map((k) => k.trim()).filter(Boolean);

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
        select: { id: true, valeur: true, type: true, mood: true, keywords: true, categorieId: true },
        orderBy: { id: "asc" },
      });

      const mapConceptItem = (c: typeof rows[number]) => {
        const mood = c.mood ?? pick(["mystérieux", "épique", "sombre", "onirique", "tendu", "lumineux"], rng.next);
        const ckws = splitKeywords(c.keywords);
        return {
          id: c.id, valeur: c.valeur, type: c.type ?? null, mood,
          keyword1: ckws[0] ?? pick(["secret", "quête", "rituel", "héritage", "frontière", "anomalie"], rng.next),
          keyword2: ckws[1] ?? pick(["alliance", "trahison", "mémoire", "artefact", "serment", "mensonge"], rng.next),
          keyword3: ckws[2] ?? pick(["prix", "conséquence", "danger", "révélation", "dilemme", "menace"], rng.next),
          categorieId: c.categorieId ?? null,
        };
      };

      if (rows.length > 0) {
        const uniqueRows = uniqueByNormalizedText(rows, (c) => `${c.valeur ?? ""} ${c.type ?? ""}`);
        const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map(mapConceptItem);
        return res.json({
          seed: effectiveSeed, count: items.length,
          filters: { categorieId: requestedCategorieId, keywords: kws.join(", ") },
          items,
          info: `Résultats trouvés pour: ${kws.join(", ")}`,
        });
      }

      let fallbackRows = await prisma.concept.findMany({
        where: { ...(requestedCategorieId ? { categorieId: requestedCategorieId } : {}) },
        select: { id: true, valeur: true, type: true, mood: true, keywords: true, categorieId: true },
        orderBy: { id: "asc" },
      });
      if (requestedCategorieId && fallbackRows.length === 0) {
        fallbackRows = await prisma.concept.findMany({
          select: { id: true, valeur: true, type: true, mood: true, keywords: true, categorieId: true },
          orderBy: { id: "asc" },
        });
      }
      const uniqueFallbackRows = uniqueByNormalizedText(fallbackRows, (c) => `${c.valeur ?? ""} ${c.type ?? ""}`);
      const items = sampleWithoutReplacement(uniqueFallbackRows, Math.min(count, uniqueFallbackRows.length), rng.next).map(mapConceptItem);
      return res.json({
        seed: effectiveSeed, count: items.length,
        filters: { categorieId: requestedCategorieId, keywords: kws.join(", ") },
        items,
        warning: items.length === 0
          ? "Aucun concept disponible avec les filtres demandés."
          : `Aucun match exact pour "${kws.join(", ")}". Suggestions affichées.`,
      });
    }
  }

  // Mode "brief" réaliste sur un sujet
  if (topic && topic.length > 0) {
    const generated = generateRealisticConceptIdeas({ count, seed, topic, categorieId: requestedCategorieId ?? undefined, rng });
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
    select: { id: true, valeur: true, type: true, mood: true, keywords: true, categorieId: true },
    orderBy: { id: "asc" },
  });

  if (!conceptId && requestedCategorieId && rows.length === 0) {
    usedFallback = true;
    rows = await prisma.concept.findMany({
      select: { id: true, valeur: true, type: true, mood: true, keywords: true, categorieId: true },
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
    return {
      id: c.id, valeur: c.valeur, type: c.type ?? null, mood, keywords: c.keywords ?? null,
      categorieId: c.categorieId ?? null,
      elevatorPitch: `« ${c.valeur} » est une idée ${mood} centrée sur ${k1} et ${k2}. Elle sert de moteur narratif et ouvre des arcs de quête, de conflit et de révélation.`,
      twist: `Twist : ${k2} n'est qu'un écran — la véritable cause implique ${k3}.`,
      hook: `Accroche : quand ${k1} refait surface, vos personnages doivent choisir entre préserver l'ordre ou dévoiler la vérité.`,
      questions: [`Qui contrôle « ${c.valeur} » et pourquoi ?`, `Quel est le prix exact de ${k1} dans votre univers ?`],
    };
  });

  res.json({
    seed: effectiveSeed, count: items.length,
    filters: { categorieId: categorieId ?? null, conceptId: conceptId ?? null, topic: null },
    items,
    warning: uniqueRows.length === 0
      ? "Aucun Concept ne match les filtres."
      : usedFallback
        ? "Aucun Concept dans cette catégorie : génération faite sur l'ensemble des concepts."
        : undefined,
  });
};
