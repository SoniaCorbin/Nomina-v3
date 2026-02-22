import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { FALLBACK_SOCIAL_CLASSES } from '../data/lookups';

export const getSocialClasses = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.socialClass.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.json(FALLBACK_SOCIAL_CLASSES);
  }
};

export const getSocialClassById = async (req: Request, res: Response) => {
  try {
    const item = await prisma.socialClass.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Classe sociale non trouvée' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createSocialClass = async (req: Request, res: Response) => {
  try {
    const { name, description, rank, universId, categorieId, cultureId } = req.body;
    const created = await prisma.socialClass.create({
      data: {
        name,
        description,
        rank,
        universId,
        categorieId,
        cultureId,
      },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateSocialClass = async (req: Request, res: Response) => {
  try {
    const { name, description, rank, universId, categorieId, cultureId } = req.body;
    const updated = await prisma.socialClass.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
        rank,
        universId,
        categorieId,
        cultureId,
      },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteSocialClass = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.personnage.updateMany({ where: { socialClassId: id }, data: { socialClassId: null } }),
      prisma.socialClass.delete({ where: { id } }),
    ]);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const totalSocialClass = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.socialClass.count();
    res.json({ total: count });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
