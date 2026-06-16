import type { Request, Response } from "express";
import { z } from "zod";
import { generateNpcIdeas } from "../../services/generation/npcGenerator";
import {
  countQuerySchema,
  optionalIdQuerySchema,
  optionalStringQuerySchema,
  splitKeywords,
  uniqueByNormalizedText,
  scoreKeywordMatch,
  asGeneratedResponse,
  getGeneratedItems,
  type GeneratedNpcIdea,
  type RankedItem,
} from "../../services/generation/generationHelpers";

export const generateNpcs = async (req: Request, res: Response) => {
  const parsed = z
    .object({
      count: countQuerySchema,
      universId: optionalIdQuerySchema,
      cultureId: optionalIdQuerySchema,
      categorieId: optionalIdQuerySchema,
      socialClassId: optionalIdQuerySchema,
      occupationId: optionalIdQuerySchema,
      organizationId: optionalIdQuerySchema,
      relationTypeId: optionalIdQuerySchema,
      eventId: optionalIdQuerySchema,
      genre: optionalStringQuerySchema,
      seed: optionalStringQuerySchema,
      keywords: optionalStringQuerySchema,
    })
    .safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: "Paramètres invalides", issues: parsed.error.issues });
  }

  const { count, universId, cultureId, categorieId, socialClassId, occupationId,
    organizationId, relationTypeId, eventId, genre, seed, keywords } = parsed.data;

  const kws = splitKeywords(keywords);
  const requestedCount = Math.min(count * 4, 120);

  const result = await generateNpcIdeas({
    count: requestedCount, universId, cultureId, categorieId,
    socialClassId, occupationId, organizationId, relationTypeId, eventId, genre, seed,
  });
  const generatedResult = asGeneratedResponse<GeneratedNpcIdea>(result);
  const baseItems = getGeneratedItems(generatedResult);
  const uniqueBaseItems = uniqueByNormalizedText(baseItems, (it) => `${it.fullName ?? it.name ?? ""}`);

  const normalizeNpcWarning = (warning: unknown, itemCount: number): string | undefined => {
    if (itemCount === 0) return "Aucun Personnage ne match les filtres.";
    if (typeof warning !== "string") return undefined;
    return warning
      .replace(/prénom/gi, "Personnage")
      .replace(/prenom/gi, "Personnage")
      .replace(/PNJ/gi, "Personnage");
  };

  if (kws.length === 0) {
    const items = uniqueBaseItems.slice(0, count);
    return res.json({
      ...generatedResult,
      count: items.length,
      items,
      warning: normalizeNpcWarning(generatedResult.warning, items.length),
    });
  }

  const ranked: RankedItem<GeneratedNpcIdea>[] = uniqueBaseItems
    .map((it) => ({
      item: it,
      score: scoreKeywordMatch(`${it.name ?? ""} ${it.backstory ?? ""}`, kws),
    }))
    .sort((a, b) => b.score - a.score);

  const matched = ranked.filter((entry) => entry.score > 0).map((entry) => entry.item);
  const fallback = ranked.map((entry) => entry.item);
  const items = (matched.length > 0 ? matched : fallback).slice(0, count);

  return res.json({
    ...generatedResult,
    count: items.length,
    filters: {
      ...(generatedResult.filters ?? {}),
      universId: universId ?? null,
      keywords: kws.join(", "),
    },
    items,
    info: matched.length > 0 ? `Résultats classés par pertinence pour: ${kws.join(", ")}` : undefined,
    warning: normalizeNpcWarning(
      matched.length === 0
        ? `Aucun PNJ ne matche directement: ${kws.join(", ")}. Suggestions affichées.`
        : generatedResult.warning,
      items.length
    ),
  });
};
