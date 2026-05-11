import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getPersonnages = asyncHandler(async (_req: Request, res: Response) => {
  const personnages = await prisma.personnage.findMany({
    include: { prenom: true, nomFamille: true },
    orderBy: { id: 'asc' },
  });
  res.json(personnages);
});

export const getPersonnageById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const personnage = await prisma.personnage.findUnique({
    where: { id },
    include: {
      prenom: true,
      nomFamille: true,
      titre: true,
      culture: true,
      categorie: true,
      creatures: true,
    },
  });

  if (!personnage) throw new AppError(404, 'Personnage non trouvé');

  res.json(personnage);
});

export const totalPersonnages = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.personnage.count();
  res.json({ total: count });
});
