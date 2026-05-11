import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getNomFamilles = asyncHandler(async (_req: Request, res: Response) => {
  const noms = await prisma.nomFamille.findMany({
    include: {
      culture: true,
      categorie: true,
      _count: { select: { personnages: true } },
    },
    orderBy: { id: 'asc' },
  });
  res.json(noms);
});

export const getNomFamilleById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new AppError(400, 'ID invalide');

  const nom = await prisma.nomFamille.findUnique({
    where: { id },
    include: { culture: true, categorie: true, personnages: true },
  });

  if (!nom) throw new AppError(404, 'Nom de famille non trouvé');
  res.json(nom);
});

export const createNomFamille = asyncHandler(async (req: Request, res: Response) => {
  const { valeur, cultureId, categorieId } = req.body as {
    valeur?: string;
    cultureId?: number | string | null;
    categorieId?: number | string | null;
  };

  if (!valeur || typeof valeur !== 'string' || !valeur.trim()) {
    throw new AppError(400, 'Le champ "valeur" est requis');
  }

  const trimmed = valeur.trim();
  if (trimmed.length > 120) throw new AppError(400, 'La valeur est trop longue (max 120)');

  const created = await prisma.nomFamille.create({
    data: {
      valeur: trimmed,
      cultureId: cultureId != null ? Number(cultureId) : null,
      categorieId: categorieId != null ? Number(categorieId) : null,
    },
    include: { culture: true, categorie: true },
  });

  res.status(201).json(created);
});

export const updateNomFamille = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new AppError(400, 'ID invalide');

  const { valeur, cultureId, categorieId } = req.body as {
    valeur?: string | null;
    cultureId?: number | string | null;
    categorieId?: number | string | null;
  };

  const data: { valeur?: string; cultureId?: number | null; categorieId?: number | null } = {};

  if (valeur !== undefined) {
    if (valeur === null || typeof valeur !== 'string' || !valeur.trim()) {
      throw new AppError(400, 'Le champ "valeur" ne peut pas être vide');
    }
    const trimmed = valeur.trim();
    if (trimmed.length > 120) throw new AppError(400, 'La valeur est trop longue (max 120)');
    data.valeur = trimmed;
  }

  if (cultureId !== undefined) data.cultureId = cultureId === null ? null : Number(cultureId);
  if (categorieId !== undefined) data.categorieId = categorieId === null ? null : Number(categorieId);

  const updated = await prisma.nomFamille.update({
    where: { id },
    data,
    include: { culture: true, categorie: true },
  });

  res.json(updated);
});

export const deleteNomFamille = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) throw new AppError(400, 'ID invalide');

  await prisma.$transaction([
    prisma.prenom.updateMany({ where: { nomFamilleId: id }, data: { nomFamilleId: null } }),
    prisma.nomFamille.delete({ where: { id } }),
  ]);

  res.status(204).end();
});

export const totalNomFamille = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.nomFamille.count();
  res.json({ total: count });
});
