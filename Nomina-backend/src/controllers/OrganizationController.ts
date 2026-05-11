import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { FALLBACK_ORGANIZATIONS } from '../data/lookups';

export const getOrganizations = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.organization.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.json(FALLBACK_ORGANIZATIONS);
  }
};

export const getOrganizationById = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.organization.findUnique({
    where: { id: Number(req.params.id) },
    include: { memberships: true },
  });
  if (!item) throw new AppError(404, 'Organisation non trouvée');
  res.json(item);
});

export const createOrganization = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, description, imageUrl, universId, categorieId, cultureId } = req.body;
  const created = await prisma.organization.create({
    data: { name, type, description, imageUrl, universId, categorieId, cultureId },
  });
  res.status(201).json(created);
});

export const updateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const { name, type, description, imageUrl, universId, categorieId, cultureId } = req.body;
  const updated = await prisma.organization.update({
    where: { id: Number(req.params.id) },
    data: { name, type, description, imageUrl, universId, categorieId, cultureId },
  });
  res.json(updated);
});

export const deleteOrganization = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction([
    prisma.personnageOrganization.deleteMany({ where: { organizationId: id } }),
    prisma.organization.delete({ where: { id } }),
  ]);
  res.status(204).end();
});

export const totalOrganization = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.organization.count();
  res.json({ total: count });
});
