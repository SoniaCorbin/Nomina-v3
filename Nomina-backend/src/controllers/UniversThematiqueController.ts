import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getUniversThematiques = asyncHandler(async (_req: Request, res: Response) => {
  const univers = await prisma.universThematique.findMany({
    select: { id: true, name: true, imageUrl: true },
    orderBy: { id: 'asc' },
  });

  const cleaned = univers
    .map((u) => ({ ...u, name: u.name.trim() }))
    .filter((u) => u.name.length > 0 && u.name.toLowerCase() !== 'tous');

  res.json(cleaned);
});

export const getUniversThematiquesAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const univers = await prisma.universThematique.findMany({
    select: { id: true, name: true, description: true, imageUrl: true },
    orderBy: { id: 'asc' },
  });
  res.json(univers);
});

export const totalUniversThematiques = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.universThematique.count();
  res.json({ total: count });
});

export const getUniversThematiqueById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new AppError(400, 'ID invalide');

  const univers = await prisma.universThematique.findUnique({
    where: { id },
    select: { id: true, name: true, description: true, imageUrl: true },
  });
  if (!univers) throw new AppError(404, 'Univers non trouvé');

  res.json(univers);
});

export const createUniversThematique = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, imageUrl } = req.body as {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
  };

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError(400, 'Le champ "name" est requis');
  }

  const trimmedName = name.trim();
  if (trimmedName.length > 80) throw new AppError(400, 'Le nom est trop long (max 80)');

  const trimmedDesc = typeof description === 'string' ? description.trim() : null;
  if (trimmedDesc && trimmedDesc.length > 500) throw new AppError(400, 'La description est trop longue (max 500)');

  const trimmedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : null;
  if (trimmedImageUrl && trimmedImageUrl.length > 2048) throw new AppError(400, "L'URL de l'image est trop longue (max 2048)");

  const created = await prisma.universThematique.create({
    data: { name: trimmedName, description: trimmedDesc, imageUrl: trimmedImageUrl },
    select: { id: true, name: true, description: true, imageUrl: true },
  });

  res.status(201).json(created);
});

export const updateUniversThematique = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new AppError(400, 'ID invalide');

  const { name, description, imageUrl } = req.body as {
    name?: string | null;
    description?: string | null;
    imageUrl?: string | null;
  };

  const data: { name?: string; description?: string | null; imageUrl?: string | null } = {};

  if (name !== undefined) {
    if (name === null || typeof name !== 'string' || !name.trim()) {
      throw new AppError(400, 'Le champ "name" ne peut pas être vide');
    }
    const trimmedName = name.trim();
    if (trimmedName.length > 80) throw new AppError(400, 'Le nom est trop long (max 80)');
    data.name = trimmedName;
  }

  if (description !== undefined) {
    const trimmedDesc = typeof description === 'string' ? description.trim() : null;
    if (trimmedDesc && trimmedDesc.length > 500) throw new AppError(400, 'La description est trop longue (max 500)');
    data.description = trimmedDesc;
  }

  if (imageUrl !== undefined) {
    const trimmedImageUrl = typeof imageUrl === 'string' ? imageUrl.trim() : null;
    if (trimmedImageUrl && trimmedImageUrl.length > 2048) throw new AppError(400, "L'URL de l'image est trop longue (max 2048)");
    data.imageUrl = trimmedImageUrl;
  }

  const updated = await prisma.universThematique.update({
    where: { id },
    data,
    select: { id: true, name: true, description: true, imageUrl: true },
  });

  res.json(updated);
});

export const deleteUniversThematique = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new AppError(400, 'ID invalide');

  const categoriesCount = await prisma.categorie.count({ where: { universId: id } });
  if (categoriesCount > 0) {
    throw new AppError(409, 'Impossible de supprimer: des catégories utilisent cet univers', {
      categories: categoriesCount,
    });
  }

  await prisma.universThematique.delete({ where: { id } });
  res.status(204).end();
});

export const uploadUniversThematiqueImage = asyncHandler(async (req: Request, res: Response) => {
  const universId = Number(req.params.id);
  if (!Number.isFinite(universId)) throw new AppError(400, "Id d'univers invalide");
  if (!req.file) throw new AppError(400, 'Aucun fichier image reçu');

  const imageUrl = `/uploads/univers/${req.file.filename}`;

  try {
    const univers = await prisma.universThematique.update({
      where: { id: universId },
      data: { imageUrl },
      select: { id: true, name: true, description: true, imageUrl: true },
    });
    return res.json({ message: 'Image téléversée avec succès', imageUrl, univers });
  } catch (err) {
    logger.error('Erreur uploadUniversThematiqueImage', { err, universId });
    throw err;
  }
});
