import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getLieux = asyncHandler(async (_req: Request, res: Response) => {
  const lieux = await prisma.lieux.findMany({
    include: { categorie: true },
    orderBy: { id: 'asc' },
  });
  res.json(lieux);
});

export const getLieuById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const lieu = await prisma.lieux.findUnique({
    where: { id },
    include: { categorie: true },
  });
  if (!lieu) throw new AppError(404, 'Lieu non trouvé');
  res.json(lieu);
});

export const createLieu = asyncHandler(async (req: Request, res: Response) => {
  const { value, type, categorieId } = req.body as {
    value?: string;
    type?: string | null;
    categorieId?: number | string | null;
  };

  if (!value || typeof value !== 'string') {
    throw new AppError(400, 'Le champ "value" est requis et doit être une chaîne');
  }

  const categorieIdNum = categorieId != null ? Number(categorieId) : null;

  const newLieu = await prisma.lieux.create({
    data: { value, type: type ?? null, categorieId: categorieIdNum },
  });

  res.status(201).json(newLieu);
});

export const updateLieu = asyncHandler(async (req: Request, res: Response) => {
  const { value, type, categorieId } = req.body as {
    value?: string | null;
    type?: string | null;
    categorieId?: number | string | null;
  };

  const categorieIdNum = categorieId != null ? Number(categorieId) : null;

  const updated = await prisma.lieux.update({
    where: { id: Number(req.params.id) },
    data: {
      value: value ?? undefined,
      type: type ?? null,
      categorieId: categorieIdNum,
    },
  });

  res.json(updated);
});

export const deleteLieu = asyncHandler(async (req: Request, res: Response) => {
  await prisma.lieux.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export const totalLieux = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.lieux.count();
  res.json({ total: count });
});

export const uploadLieuImage = asyncHandler(async (req: Request, res: Response) => {
  const lieuId = Number(req.params.id);
  if (!Number.isFinite(lieuId)) throw new AppError(400, 'Id de lieu invalide');
  if (!req.file) throw new AppError(400, 'Aucun fichier image reçu');

  const imageUrl = `/uploads/lieux/${req.file.filename}`;

  try {
    const lieu = await prisma.lieux.update({
      where: { id: lieuId },
      data: { imageUrl },
      include: { categorie: true },
    });
    res.json({ message: 'Image téléversée avec succès', imageUrl, lieu });
  } catch (err) {
    logger.error('Erreur uploadLieuImage', { err, lieuId });
    throw err;
  }
});
