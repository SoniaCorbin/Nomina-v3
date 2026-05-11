import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { FALLBACK_RELATION_TYPES } from '../data/lookups';

export const getRelationTypes = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.relationType.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.json(FALLBACK_RELATION_TYPES);
  }
};

export const getRelationTypeById = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.relationType.findUnique({ where: { id: Number(req.params.id) } });
  if (!item) throw new AppError(404, 'Type de relation non trouvé');
  res.json(item);
});

export const createRelationType = asyncHandler(async (req: Request, res: Response) => {
  const { code, label, description, universId, categorieId, cultureId } = req.body;
  const created = await prisma.relationType.create({
    data: { code, label, description, universId, categorieId, cultureId },
  });
  res.status(201).json(created);
});

export const updateRelationType = asyncHandler(async (req: Request, res: Response) => {
  const { code, label, description, universId, categorieId, cultureId } = req.body;
  const updated = await prisma.relationType.update({
    where: { id: Number(req.params.id) },
    data: { code, label, description, universId, categorieId, cultureId },
  });
  res.json(updated);
});

export const deleteRelationType = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction([
    prisma.personnageRelation.deleteMany({ where: { relationTypeId: id } }),
    prisma.relationType.delete({ where: { id } }),
  ]);
  res.status(204).end();
});

export const totalRelationType = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.relationType.count();
  res.json({ total: count });
});
