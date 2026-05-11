import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getTitres = asyncHandler(async (_req: Request, res: Response) => {
  const titres = await prisma.titre.findMany({
    include: { culture: true, categorie: true },
    orderBy: { id: 'asc' },
  });
  res.json(titres);
});

export const getTitreById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const titre = await prisma.titre.findUnique({
    where: { id },
    include: { culture: true, categorie: true },
  });
  if (!titre) throw new AppError(404, 'Titre non trouvé');
  res.json(titre);
});

export const createTitre = asyncHandler(async (req: Request, res: Response) => {
  const { valeur, type, genre, cultureId, categorieId } = req.body as {
    valeur?: string;
    type?: string | null;
    genre?: string | null;
    cultureId?: number | string | null;
    categorieId?: number | string | null;
  };

  if (!valeur || typeof valeur !== 'string') {
    throw new AppError(400, 'Le champ "valeur" est requis et doit être une chaîne');
  }

  const newTitre = await prisma.titre.create({
    data: {
      valeur,
      type: type ?? null,
      genre: genre ?? null,
      cultureId: cultureId != null ? Number(cultureId) : null,
      categorieId: categorieId != null ? Number(categorieId) : null,
    },
  });

  res.status(201).json(newTitre);
});

export const updateTitre = asyncHandler(async (req: Request, res: Response) => {
  const { valeur, type, genre, cultureId, categorieId } = req.body as {
    valeur?: string | null;
    type?: string | null;
    genre?: string | null;
    cultureId?: number | string | null;
    categorieId?: number | string | null;
  };

  const updated = await prisma.titre.update({
    where: { id: Number(req.params.id) },
    data: {
      valeur: valeur ?? undefined,
      type: type ?? null,
      genre: genre ?? null,
      cultureId: cultureId === undefined ? undefined : (cultureId != null ? Number(cultureId) : null),
      categorieId: categorieId === undefined ? undefined : (categorieId != null ? Number(categorieId) : null),
    },
  });

  res.json(updated);
});

export const deleteTitre = asyncHandler(async (req: Request, res: Response) => {
  await prisma.titre.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export const totalTitres = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.titre.count();
  res.json({ total: count });
});
