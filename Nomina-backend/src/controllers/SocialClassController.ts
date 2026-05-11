import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { FALLBACK_SOCIAL_CLASSES } from '../data/lookups';

export const getSocialClasses = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.socialClass.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.json(FALLBACK_SOCIAL_CLASSES);
  }
};

export const getSocialClassById = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.socialClass.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) throw new AppError(404, 'Classe sociale non trouvée');
  res.json(item);
});

export const createSocialClass = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, rank, universId, categorieId, cultureId } = req.body;
  const created = await prisma.socialClass.create({
    data: { name, description, rank, universId, categorieId, cultureId },
  });
  res.status(201).json(created);
});

export const updateSocialClass = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, rank, universId, categorieId, cultureId } = req.body;
  const updated = await prisma.socialClass.update({
    where: { id: Number(req.params.id) },
    data: { name, description, rank, universId, categorieId, cultureId },
  });
  res.json(updated);
});

export const deleteSocialClass = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction([
    prisma.personnage.updateMany({ where: { socialClassId: id }, data: { socialClassId: null } }),
    prisma.socialClass.delete({ where: { id } }),
  ]);
  res.status(204).end();
});

export const totalSocialClass = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.socialClass.count();
  res.json({ total: count });
});
