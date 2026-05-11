import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getConcepts = asyncHandler(async (_req: Request, res: Response) => {
  const concepts = await prisma.concept.findMany({
    include: { categorie: true },
    orderBy: { id: 'asc' },
  });
  res.json(concepts);
});

export const getConceptById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const concept = await prisma.concept.findUnique({
    where: { id },
    include: { categorie: true },
  });
  if (!concept) throw new AppError(404, 'Concept non trouvé');
  res.json(concept);
});

export const createConcept = asyncHandler(async (req: Request, res: Response) => {
  const { valeur, type, mood, keywords, categorieId } = req.body as {
    valeur?: string;
    type?: string | null;
    mood?: string | null;
    keywords?: string | null;
    categorieId?: number | string | null;
  };

  if (!valeur || typeof valeur !== 'string') {
    throw new AppError(400, 'Le champ "valeur" est requis et doit être une chaîne');
  }

  const newConcept = await prisma.concept.create({
    data: {
      valeur,
      type: type ?? null,
      mood: mood ?? null,
      keywords: keywords ?? null,
      categorieId: categorieId != null ? Number(categorieId) : null,
    },
  });

  res.status(201).json(newConcept);
});

export const updateConcept = asyncHandler(async (req: Request, res: Response) => {
  const { valeur, type, mood, keywords, categorieId } = req.body as {
    valeur?: string | null;
    type?: string | null;
    mood?: string | null;
    keywords?: string | null;
    categorieId?: number | string | null;
  };

  const updated = await prisma.concept.update({
    where: { id: Number(req.params.id) },
    data: {
      valeur: valeur ?? undefined,
      type: type ?? null,
      mood: mood ?? null,
      keywords: keywords ?? null,
      categorieId: categorieId === undefined ? undefined : (categorieId != null ? Number(categorieId) : null),
    },
  });

  res.json(updated);
});

export const deleteConcept = asyncHandler(async (req: Request, res: Response) => {
  await prisma.concept.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export const totalConcepts = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.concept.count();
  res.json({ total: count });
});
