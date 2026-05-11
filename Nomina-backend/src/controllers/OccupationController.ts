import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { FALLBACK_OCCUPATIONS } from '../data/lookups';

export const getOccupations = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.occupation.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.json(FALLBACK_OCCUPATIONS);
  }
};

export const getOccupationById = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.occupation.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) throw new AppError(404, 'Métier non trouvé');
  res.json(item);
});

export const createOccupation = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, universId, categorieId, cultureId } = req.body;
  const created = await prisma.occupation.create({
    data: { name, description, universId, categorieId, cultureId },
  });
  res.status(201).json(created);
});

export const updateOccupation = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, universId, categorieId, cultureId } = req.body;
  const updated = await prisma.occupation.update({
    where: { id: Number(req.params.id) },
    data: { name, description, universId, categorieId, cultureId },
  });
  res.json(updated);
});

export const deleteOccupation = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction([
    prisma.personnage.updateMany({ where: { occupationId: id }, data: { occupationId: null } }),
    prisma.occupation.delete({ where: { id } }),
  ]);
  res.status(204).end();
});

export const totalOccupation = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.occupation.count();
  res.json({ total: count });
});
