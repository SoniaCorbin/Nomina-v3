import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { FALLBACK_OCCUPATIONS } from '../data/lookups';

export const getOccupations = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.occupation.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.json(FALLBACK_OCCUPATIONS);
  }
};

export const getOccupationById = async (req: Request, res: Response) => {
  try {
    const item = await prisma.occupation.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Métier non trouvé' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createOccupation = async (req: Request, res: Response) => {
  try {
    const { name, description, universId, categorieId, cultureId } = req.body;
    const created = await prisma.occupation.create({
      data: {
        name,
        description,
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

export const updateOccupation = async (req: Request, res: Response) => {
  try {
    const { name, description, universId, categorieId, cultureId } = req.body;
    const updated = await prisma.occupation.update({
      where: { id: Number(req.params.id) },
      data: {
        name,
        description,
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

export const deleteOccupation = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.personnage.updateMany({ where: { occupationId: id }, data: { occupationId: null } }),
      prisma.occupation.delete({ where: { id } }),
    ]);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const totalOccupation = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.occupation.count();
    res.json({ total: count });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
