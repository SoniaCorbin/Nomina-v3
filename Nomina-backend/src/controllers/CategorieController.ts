import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const universIdRaw = req.query.universId;
  const universId =
    typeof universIdRaw === 'string' && universIdRaw.trim() !== ''
      ? Number(universIdRaw)
      : undefined;

  const categories = await prisma.categorie.findMany({
    where: universId ? { universId } : undefined,
    include: { univers: true },
    orderBy: { id: 'asc' },
  });

  res.json(categories);
});

export const getCategorieById = asyncHandler(async (req: Request, res: Response) => {
  const categorie = await prisma.categorie.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      nomPersonnages: true,
      lieux: true,
      fragmentsHistoire: true,
      titres: true,
      concepts: true,
    },
  });
  if (!categorie) throw new AppError(404, 'Catégorie non trouvée');
  res.json(categorie);
});

export const createCategorie = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, universId, universName } = req.body as {
    name: string;
    description?: string;
    universId?: number | string;
    universName?: string;
  };

  if (!name) throw new AppError(400, 'name requis');

  const newCategorie = await prisma.categorie.create({
    data: {
      name,
      description,
      univers: universId
        ? { connect: { id: Number(universId) } }
        : {
            connectOrCreate: {
              where: { name: universName ?? 'Tous' },
              create: { name: universName ?? 'Tous' },
            },
          },
    },
  });

  res.status(201).json(newCategorie);
});

export const updateCategorie = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body as { name: string; description: string };
  const updatedCategorie = await prisma.categorie.update({
    where: { id: Number(req.params.id) },
    data: { name, description },
  });
  res.json(updatedCategorie);
});

export const deleteCategorie = asyncHandler(async (req: Request, res: Response) => {
  await prisma.categorie.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export const totalCategorie = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.categorie.count();
  res.json({ total: count });
});

export const uploadCategorieImage = asyncHandler(async (req: Request, res: Response) => {
  const categorieId = Number(req.params.id);
  if (!Number.isFinite(categorieId)) throw new AppError(400, 'Id de catégorie invalide');
  if (!req.file) throw new AppError(400, 'Aucun fichier image reçu');

  const imageUrl = `/uploads/categories/${req.file.filename}`;

  try {
    const categorie = await prisma.categorie.update({
      where: { id: categorieId },
      data: { imageUrl },
      include: { univers: true },
    });
    return res.json({ message: 'Image téléversée avec succès', imageUrl, categorie });
  } catch (err) {
    logger.error('Erreur uploadCategorieImage', { err, categorieId });
    throw err;
  }
});
