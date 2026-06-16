import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../utils/prisma";
import { createRng } from "../../services/generation/rng";
import {
  countQuerySchema,
  optionalIdQuerySchema,
  optionalStringQuerySchema,
  splitKeywords,
  uniqueByNormalizedText,
  sampleWithoutReplacement,
  buildGenreWhere,
  expandTitreKeywordTerms,
} from "../../services/generation/generationHelpers";

export const generateTitres = async (req: Request, res: Response) => {
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
    return res.status(400).json({ error: "Paramètres invalides", issues: parsed.error.issues });
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
          cultureId, categorieId, genre: buildGenreWhere(genre),
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
          new RegExp(`(^|[^\\p{L}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^\\p{L}])`, "iu").test(source);

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
        if ((lcBase.some((k) => k.includes("feu") || k.includes("incend")) || lcExpanded.includes("pompier")) && containsWord(v, "pompier")) {
          score += 220;
        }
        return score;
      };

      const uniqueRows = uniqueByNormalizedText(rows, (t) => `${t.valeur ?? ""} ${t.type ?? ""}`);
      let sourceRows = uniqueRows
        .map((t) => ({ t, score: scoreTitre({ valeur: t.valeur, type: t.type ?? null }) }))
        .sort((a, b) => b.score !== a.score ? b.score - a.score : a.t.valeur.localeCompare(b.t.valeur, "fr"))
        .map((x) => x.t);

      let usedFallbackSuggestions = false;
      if (sourceRows.length === 0) {
        const fallbackRows = await prisma.titre.findMany({
          where: { cultureId, categorieId, genre: buildGenreWhere(genre) },
          select: { id: true, valeur: true, type: true, genre: true, cultureId: true, categorieId: true },
          orderBy: { id: "asc" },
        });
        sourceRows = uniqueByNormalizedText(fallbackRows, (t) => `${t.valeur ?? ""} ${t.type ?? ""}`);
        usedFallbackSuggestions = sourceRows.length > 0;
      }

      const items = sourceRows.slice(0, count).map((t) => ({
        id: t.id, valeur: t.valeur, type: t.type ?? null, genre: t.genre ?? null,
        cultureId: t.cultureId ?? null, categorieId: t.categorieId ?? null,
      }));

      return res.json({
        seed: effectiveSeed, count: items.length,
        filters: { cultureId: cultureId ?? null, categorieId: categorieId ?? null, genre: genre ?? null, keywords: kws.join(", ") },
        items,
        warning: items.length === 0
          ? `Aucun titre trouvé pour: ${kws.join(", ")}`
          : usedFallbackSuggestions
            ? `Aucun match exact pour "${kws.join(", ")}". Suggestions affichées.`
            : undefined,
        info: uniqueRows.length > 0 ? `Titres classés par pertinence pour: ${kws.join(", ")}` : undefined,
      });
    }
  }

  const rows = await prisma.titre.findMany({
    where: { cultureId, categorieId, genre: buildGenreWhere(genre) },
    select: { id: true, valeur: true, type: true, genre: true, cultureId: true, categorieId: true },
    orderBy: { id: "asc" },
  });
  const uniqueRows = uniqueByNormalizedText(rows, (t) => `${t.valeur ?? ""} ${t.type ?? ""}`);
  const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next).map((t) => ({
    id: t.id, valeur: t.valeur, type: t.type ?? null, genre: t.genre ?? null,
    cultureId: t.cultureId ?? null, categorieId: t.categorieId ?? null,
  }));

  res.json({
    seed: effectiveSeed, count: items.length,
    filters: { cultureId: cultureId ?? null, categorieId: categorieId ?? null, genre: genre ?? null },
    items,
    warning: uniqueRows.length === 0 ? "Aucun Titre ne match les filtres." : undefined,
  });
};
