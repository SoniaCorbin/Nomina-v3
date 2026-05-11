import type { Request, Response } from "express";
import { z } from "zod";
import type { Prisma } from "../../generated/prisma/client";
import prisma from "../../utils/prisma";
import { createRng } from "../../services/generation/rng";
import {
  countQuerySchema,
  optionalIdQuerySchema,
  optionalStringQuerySchema,
  pick,
  splitKeywords,
  uniqueByNormalizedText,
  scoreKeywordMatch,
  sampleWithoutReplacement,
  normalizeAppliesToValues,
  buildGenreWhere,
} from "../../services/generation/generationHelpers";

export const generateFragmentsHistoire = async (req: Request, res: Response) => {
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
    return res.status(400).json({ error: "Paramètres invalides", issues: parsed.error.issues });
  }

  const { count, universId, cultureId, categorieId, genre, appliesTo, seed, keywords } = parsed.data;
  const rng = createRng(seed);
  const effectiveSeed = seed ?? rng.seed;
  const kws = splitKeywords(keywords);
  const appliesToValues = normalizeAppliesToValues(appliesTo);

  const strictWhere = {
    cultureId, categorieId,
    ...(universId !== undefined ? { categorie: { universId } } : {}),
    genre: buildGenreWhere(genre),
    appliesTo: appliesToValues ? { in: appliesToValues } : undefined,
  };

  const queries: Array<{ label: string; where: Prisma.FragmentsHistoireWhereInput }> = [
    { label: "strict", where: strictWhere },
    { label: "no-appliesTo", where: { ...strictWhere, appliesTo: undefined } },
    { label: "no-genre-no-appliesTo", where: { ...strictWhere, genre: undefined, appliesTo: undefined } },
    { label: "broad", where: { ...(universId !== undefined ? { categorie: { universId } } : {}), appliesTo: appliesToValues ? { in: appliesToValues } : undefined } },
    { label: "global", where: {} },
  ];

  let rows: Array<{ id: number; texte: string; appliesTo: string | null; genre: string | null; cultureId: number | null; categorieId: number | null }> = [];
  let selectedQueryLabel = "strict";

  for (const q of queries) {
    rows = await prisma.fragmentsHistoire.findMany({
      where: q.where,
      select: { id: true, texte: true, appliesTo: true, genre: true, cultureId: true, categorieId: true },
      orderBy: { id: "asc" },
    });
    if (rows.length > 0) { selectedQueryLabel = q.label; break; }
  }

  const uniqueRows = uniqueByNormalizedText(rows, (f) => f.texte);
  const ranked = uniqueRows
    .map((f) => ({
      item: f,
      score: kws.length > 0 ? scoreKeywordMatch(`${f.texte ?? ""} ${f.appliesTo ?? ""} ${f.genre ?? ""}`, kws) : 0,
    }))
    .sort((a, b) => b.score - a.score);

  const matched = kws.length > 0 ? ranked.filter((x) => x.score > 0).map((x) => x.item) : [];
  const sourceRows = kws.length > 0 ? (matched.length > 0 ? matched : ranked.map((x) => x.item)) : uniqueRows;

  const generatedFromKeywords = sourceRows.length === 0 && kws.length > 0;

  const syntheticFragments = generatedFromKeywords
    ? Array.from({ length: Math.max(1, Math.min(count, 20)) }).map((_, idx) => {
        const k1 = kws[idx % kws.length] ?? "mystère";
        const k2 = kws[(idx + 1) % kws.length] ?? k1;
        const k3 = kws[(idx + 2) % kws.length] ?? k2;
        const intros = [
          `On raconte que ${k1} n'est pas ce qu'il paraît`,
          `Depuis l'apparition de ${k1}, tout a changé`,
          `Nul n'ose prononcer ${k1} à voix haute`,
          `Une rumeur relie ${k1} à ${k2}`,
        ];
        const tensions = [
          `chaque piste mène vers ${k2}`,
          `un serment ancien protège ${k2}`,
          `les témoins disparaissent près de ${k2}`,
          `un pacte oublié mentionne ${k2}`,
        ];
        const hooks = [
          `et ${k3} pourrait en être la clé.`,
          `mais personne n'accepte d'en payer le prix.`,
          `et une vérité interdite menace d'éclater.`,
          `jusqu'à ce qu'un étranger décide d'enquêter.`,
        ];
        return {
          id: -(idx + 1),
          texte: `${pick(intros, rng.next)}, ${pick(tensions, rng.next)}, ${pick(hooks, rng.next)}`,
          appliesTo: appliesToValues?.[0] ?? appliesTo ?? "intrigue",
          genre: genre ?? null,
          cultureId: cultureId ?? null,
          categorieId: categorieId ?? null,
        };
      })
    : [];

  const items = generatedFromKeywords
    ? syntheticFragments
    : sampleWithoutReplacement(sourceRows, Math.min(count, sourceRows.length), rng.next).map((f) => ({
        id: f.id, texte: f.texte, appliesTo: f.appliesTo ?? null,
        genre: f.genre ?? null, cultureId: f.cultureId ?? null, categorieId: f.categorieId ?? null,
      }));

  res.json({
    seed: effectiveSeed, count: items.length,
    filters: {
      universId: universId ?? null, cultureId: cultureId ?? null, categorieId: categorieId ?? null,
      genre: genre ?? null, appliesTo: appliesTo ?? null, keywords: kws.length > 0 ? kws.join(", ") : null,
    },
    items,
    warning: uniqueRows.length === 0
      ? generatedFromKeywords
        ? "Aucun fragment exact en base: génération créative depuis vos mots-clés."
        : "Aucun Fragment d'histoire ne match les filtres."
      : kws.length > 0 && matched.length === 0
        ? `Aucun match exact pour "${kws.join(", ")}". Suggestions affichées.`
        : selectedQueryLabel !== "strict"
          ? "Filtres élargis automatiquement pour trouver des fragments pertinents."
          : undefined,
    info: kws.length > 0 && matched.length > 0
      ? `Résultats classés par pertinence pour: ${kws.join(", ")}`
      : generatedFromKeywords
        ? `Fragments créatifs générés pour: ${kws.join(", ")}`
        : selectedQueryLabel !== "strict"
          ? "Résultats obtenus avec élargissement progressif des filtres."
          : undefined,
  });
};
