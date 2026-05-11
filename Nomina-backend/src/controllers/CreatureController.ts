import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getCreatures = asyncHandler(async (_req: Request, res: Response) => {
  const creatures = await prisma.creature.findMany({
    include: { categorie: true, culture: true, personnage: true },
    orderBy: { id: 'asc' },
  });
  res.json(creatures);
});

export const getCreatureById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const creature = await prisma.creature.findUnique({
    where: { id },
    include: { categorie: true, culture: true, personnage: true },
  });
  if (!creature) throw new AppError(404, 'Créature non trouvée');
  res.json(creature);
});

export const createCreature = asyncHandler(async (req: Request, res: Response) => {
  const { valeur, type, description, personnageId, cultureId, categorieId } = req.body as {
    valeur?: string;
    type?: string | null;
    description?: string | null;
    personnageId?: number | string | null;
    cultureId?: number | string | null;
    categorieId?: number | string | null;
  };

  if (!valeur || typeof valeur !== 'string') {
    throw new AppError(400, 'Le champ "valeur" est requis et doit être une chaîne');
  }

  const newCreature = await prisma.creature.create({
    data: {
      valeur,
      type: type ?? null,
      description: description ?? null,
      personnageId: personnageId != null ? Number(personnageId) : null,
      cultureId: cultureId != null ? Number(cultureId) : null,
      categorieId: categorieId != null ? Number(categorieId) : null,
    },
  });

  res.status(201).json(newCreature);
});

export const updateCreature = asyncHandler(async (req: Request, res: Response) => {
  const { valeur, type, description, personnageId, cultureId, categorieId } = req.body as {
    valeur?: string | null;
    type?: string | null;
    description?: string | null;
    personnageId?: number | string | null;
    cultureId?: number | string | null;
    categorieId?: number | string | null;
  };

  const updated = await prisma.creature.update({
    where: { id: Number(req.params.id) },
    data: {
      valeur: valeur ?? undefined,
      type: type ?? null,
      description: description ?? null,
      personnageId: personnageId === undefined ? undefined : (personnageId != null ? Number(personnageId) : null),
      cultureId: cultureId === undefined ? undefined : (cultureId != null ? Number(cultureId) : null),
      categorieId: categorieId === undefined ? undefined : (categorieId != null ? Number(categorieId) : null),
    },
  });

  res.json(updated);
});

export const deleteCreature = asyncHandler(async (req: Request, res: Response) => {
  await prisma.creature.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export const totalCreatures = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.creature.count();
  res.json({ total: count });
});

export const uploadCreatureImage = asyncHandler(async (req: Request, res: Response) => {
  const creatureId = Number(req.params.id);
  if (!Number.isFinite(creatureId)) throw new AppError(400, 'Id de créature invalide');
  if (!req.file) throw new AppError(400, 'Aucun fichier image reçu');

  const imageUrl = `/uploads/creatures/${req.file.filename}`;

  try {
    const creature = await prisma.creature.update({
      where: { id: creatureId },
      data: { imageUrl },
      include: { categorie: true, culture: true, personnage: true },
    });
    return res.json({ message: 'Image téléversée avec succès', imageUrl, creature });
  } catch (err) {
    logger.error('Erreur uploadCreatureImage', { err, creatureId });
    throw err;
  }
});
