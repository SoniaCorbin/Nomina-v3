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

export const generateLieux = async (req: Request, res: Response) => {
  const parsed = z
    .object({
      count: countQuerySchema,
      categorieId: optionalIdQuerySchema,
      seed: optionalStringQuerySchema,
      keywords: optionalStringQuerySchema,
    })
    .safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: "Paramètres invalides", issues: parsed.error.issues });
  }

  const { count, categorieId, seed, keywords } = parsed.data;
  const rng = createRng(seed);
  const effectiveSeed = seed ?? rng.seed;

  if (keywords && keywords.trim()) {
    const kws = keywords.split(/[,;]+/).map((k) => k.trim()).filter(Boolean);

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
        const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next)
          .map((l) => ({ id: l.id, value: l.value, type: l.type ?? null, categorieId: l.categorieId ?? null }));
        return res.json({
          seed: effectiveSeed, count: items.length,
          filters: { categorieId: categorieId ?? null, keywords: kws.join(", ") },
          items,
          info: `Résultats trouvés pour: ${kws.join(", ")}`,
        });
      }

      const fallbackRows = await prisma.lieux.findMany({
        where: { ...(categorieId ? { categorieId } : {}) },
        select: { id: true, value: true, type: true, categorieId: true },
        orderBy: { id: "asc" },
      });
      const uniqueFallbackRows = uniqueByNormalizedText(fallbackRows, (l) => `${l.value ?? ""} ${l.type ?? ""}`);
      const items = sampleWithoutReplacement(uniqueFallbackRows, Math.min(count, uniqueFallbackRows.length), rng.next)
        .map((l) => ({ id: l.id, value: l.value, type: l.type ?? null, categorieId: l.categorieId ?? null }));
      return res.json({
        seed: effectiveSeed, count: items.length,
        filters: { categorieId: categorieId ?? null, keywords: kws.join(", ") },
        items,
        warning: uniqueFallbackRows.length === 0
          ? "Aucun lieu disponible avec les filtres demandés."
          : `Aucun lieu trouvé pour "${kws.join(", ")}". Voici des suggestions proches de votre univers.`,
      });
    }
  }

  const rows = await prisma.lieux.findMany({
    where: { categorieId },
    select: { id: true, value: true, type: true, categorieId: true },
    orderBy: { id: "asc" },
  });
  const uniqueRows = uniqueByNormalizedText(rows, (l) => `${l.value ?? ""} ${l.type ?? ""}`);
  const items = sampleWithoutReplacement(uniqueRows, Math.min(count, uniqueRows.length), rng.next)
    .map((l) => ({ id: l.id, value: l.value, type: l.type ?? null, categorieId: l.categorieId ?? null }));

  res.json({
    seed: effectiveSeed, count: items.length,
    filters: { categorieId: categorieId ?? null },
    items,
    warning: uniqueRows.length === 0 ? "Aucun Lieu ne match les filtres." : undefined,
  });
};
