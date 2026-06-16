import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../../utils/prisma";
import { createRng } from "../../services/generation/rng";
import {
  countQuerySchema,
  optionalIdQuerySchema,
  optionalStringQuerySchema,
  uniqueByNormalizedText,
  sampleWithoutReplacement,
} from "../../services/generation/generationHelpers";

export const generateNomFamille = async (req: Request, res: Response) => {
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
    return res.status(400).json({ error: "Paramètres invalides", issues: parsed.error.issues });
  }

  const { count, cultureId, categorieId, seed, keywords } = parsed.data;

  const rng = createRng(seed);
  const effectiveSeed = seed ?? rng.seed;

  if (keywords && keywords.trim()) {
    const kws = keywords.split(/[,;]+/).map((k) => k.trim()).filter(Boolean);

    if (kws.length > 0) {
      const rows = await prisma.nomFamille.findMany({
        where: {
          ...(cultureId ? { cultureId } : {}),
          ...(categorieId ? { categorieId } : {}),
          OR: kws.map((kw) => ({ valeur: { contains: kw, mode: "insensitive" } })),
        },
        select: { id: true, valeur: true, cultureId: true, categorieId: true },
        orderBy: { id: "asc" },
      });

      if (rows.length > 0) {
        const uniqueRows = uniqueByNormalizedText(rows, (nf) => nf.valeur);
        const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next)
          .map((nf) => ({ id: nf.id, valeur: nf.valeur, cultureId: nf.cultureId ?? null, categorieId: nf.categorieId ?? null }));
        return res.json({
          seed: effectiveSeed, count: items.length,
          filters: { cultureId: cultureId ?? null, categorieId: categorieId ?? null, keywords: kws.join(", ") },
          items,
          info: `Résultats trouvés pour: ${kws.join(", ")}`,
        });
      }

      const fallbackRows = await prisma.nomFamille.findMany({
        where: { ...(cultureId ? { cultureId } : {}), ...(categorieId ? { categorieId } : {}) },
        select: { id: true, valeur: true, cultureId: true, categorieId: true },
        orderBy: { id: "asc" },
      });
      const uniqueFallbackRows = uniqueByNormalizedText(fallbackRows, (nf) => nf.valeur);
      const items = sampleWithoutReplacement(uniqueFallbackRows, Math.min(count, uniqueFallbackRows.length), rng.next)
        .map((nf) => ({ id: nf.id, valeur: nf.valeur, cultureId: nf.cultureId ?? null, categorieId: nf.categorieId ?? null }));
      return res.json({
        seed: effectiveSeed, count: items.length,
        filters: { cultureId: cultureId ?? null, categorieId: categorieId ?? null, keywords: kws.join(", ") },
        items,
        warning: items.length === 0
          ? "Aucun nom de famille disponible avec les filtres demandés."
          : `Aucun match exact pour "${kws.join(", ")}". Suggestions affichées.`,
      });
    }
  }

  const rows = await prisma.nomFamille.findMany({
    where: { ...(cultureId ? { cultureId } : {}), ...(categorieId ? { categorieId } : {}) },
    select: { id: true, valeur: true, cultureId: true, categorieId: true },
    orderBy: { id: "asc" },
  });
  const uniqueRows = uniqueByNormalizedText(rows, (nf) => nf.valeur);
  const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next)
    .map((nf) => ({ id: nf.id, valeur: nf.valeur, cultureId: nf.cultureId ?? null, categorieId: nf.categorieId ?? null }));

  res.json({
    seed: effectiveSeed, count: items.length,
    filters: { cultureId: cultureId ?? null, categorieId: categorieId ?? null },
    items,
    warning: uniqueRows.length === 0 ? "Aucun nom de famille ne match les filtres." : undefined,
  });
};
