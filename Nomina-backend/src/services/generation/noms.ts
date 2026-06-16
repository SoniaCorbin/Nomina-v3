import type { Request, Response } from "express";
import { z } from "zod";
import { generateNpcIdeas } from "../../services/generation/npcGenerator";
import prisma from "../../utils/prisma";
import {
  countQuerySchema,
  optionalIdQuerySchema,
  optionalStringQuerySchema,
  splitKeywords,
  uniqueByNormalizedText,
  scoreKeywordMatch,
  normalizeGenreValues,
  asGeneratedResponse,
  getGeneratedItems,
  type GeneratedNpcIdea,
  type RankedItem,
} from "../../services/generation/generationHelpers";

export const generateNomPersonnages = async (req: Request, res: Response) => {
  const parsed = z
    .object({
      count: countQuerySchema,
      cultureId: optionalIdQuerySchema,
      universId: optionalIdQuerySchema,
      categorieId: optionalIdQuerySchema,
      socialClassId: optionalIdQuerySchema,
      occupationId: optionalIdQuerySchema,
      organizationId: optionalIdQuerySchema,
      relationTypeId: optionalIdQuerySchema,
      eventId: optionalIdQuerySchema,
      titreId: optionalIdQuerySchema,
      genre: optionalStringQuerySchema,
      seed: optionalStringQuerySchema,
      keywords: optionalStringQuerySchema,
    })
    .safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: "Paramètres invalides", issues: parsed.error.issues });
  }

  const { count, cultureId, universId, categorieId, socialClassId, occupationId,
    organizationId, relationTypeId, eventId, titreId, genre, seed, keywords } = parsed.data;

  const kws = splitKeywords(keywords);
  const requestedCount = kws.length > 0 ? Math.min(count * 3, 60) : count;

  let effectiveCultureId = cultureId;
  let effectiveCategorieId = categorieId;
  let effectiveGenre = genre;
  let selectedTitre: {
    id: number; valeur: string; genre: string | null;
    cultureId: number | null; categorieId: number | null; categorieUniversId: number | null;
  } | null = null;

  if (titreId !== undefined) {
    const t = await prisma.titre.findUnique({
      where: { id: titreId },
      select: {
        id: true, valeur: true, genre: true, cultureId: true, categorieId: true,
        categorie: { select: { universId: true } },
      },
    });

    if (!t) return res.status(404).json({ error: "Titre introuvable" });

    selectedTitre = {
      id: t.id, valeur: t.valeur, genre: t.genre ?? null,
      cultureId: t.cultureId ?? null, categorieId: t.categorieId ?? null,
      categorieUniversId: t.categorie?.universId ?? null,
    };

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
      if (!ok) return res.status(400).json({ error: "Titre incompatible avec le genre sélectionné" });
    }

    if (effectiveCultureId === undefined && selectedTitre.cultureId !== null) effectiveCultureId = selectedTitre.cultureId;
    if (effectiveCategorieId === undefined && selectedTitre.categorieId !== null) effectiveCategorieId = selectedTitre.categorieId;
    if (effectiveGenre === undefined && selectedTitre.genre !== null) effectiveGenre = selectedTitre.genre;
  }

  const generated = await generateNpcIdeas({
    count: requestedCount, cultureId: effectiveCultureId, categorieId: effectiveCategorieId,
    universId, socialClassId, occupationId, organizationId, relationTypeId, eventId,
    genre: effectiveGenre, seed,
  });
  const generatedResult = asGeneratedResponse<GeneratedNpcIdea>(generated);

  const toMiniBio = (text: string | null | undefined): string | null => {
    if (!text) return null;
    const trimmed = text.trim();
    if (!trimmed) return null;
    const parts = trimmed.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    const out: string[] = [];
    for (const sentence of parts.slice(0, 5)) {
      const candidate = [...out, sentence].join(" ");
      if (candidate.length > 420) break;
      out.push(sentence);
    }
    const take = out.join(" ").trim();
    return take.length > 0 ? take : null;
  };

  const mappedItems = getGeneratedItems(generatedResult).map((it) => ({
    nameId: it.nameId ?? null,
    name: it.name ?? null,
    displayName: selectedTitre && it.name ? `${selectedTitre.valeur} ${it.name}` : (it.name ?? null),
    titreId: selectedTitre?.id ?? null,
    titreValeur: selectedTitre?.valeur ?? null,
    genre: it.genre ?? null,
    cultureId: it.cultureId ?? null,
    categorieId: it.categorieId ?? null,
    miniBio: toMiniBio(it.backstory),
  }));

  const uniqueMappedItems = uniqueByNormalizedText(mappedItems, (it) => `${it.displayName ?? it.name ?? ""}`);

  const ranked: RankedItem<(typeof mappedItems)[number]>[] = uniqueMappedItems
    .map((it) => ({
      item: it,
      score: scoreKeywordMatch(`${it.name ?? ""} ${it.displayName ?? ""} ${it.miniBio ?? ""}`, kws),
    }))
    .sort((a, b) => b.score - a.score);

  const matched = kws.length > 0 ? ranked.filter((entry) => entry.score > 0).map((entry) => entry.item) : [];
  const fallback = kws.length > 0 ? ranked.map((entry) => entry.item) : uniqueMappedItems;
  const items = (kws.length > 0 ? (matched.length > 0 ? matched : fallback) : uniqueMappedItems).slice(0, count);

  res.json({
    seed: generatedResult.seed,
    count: items.length,
    filters: {
      ...(generatedResult.filters ?? {
        cultureId: effectiveCultureId ?? null,
        categorieId: effectiveCategorieId ?? null,
        socialClassId: socialClassId ?? null,
        occupationId: occupationId ?? null,
        organizationId: organizationId ?? null,
        relationTypeId: relationTypeId ?? null,
        eventId: eventId ?? null,
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
        : generatedResult.warning,
    info: kws.length > 0 && matched.length > 0
      ? `Résultats classés par pertinence pour: ${kws.join(", ")}`
      : undefined,
  });
};
