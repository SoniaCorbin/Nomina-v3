import type { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getRelationTypes = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.relationType.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getRelationTypeById = async (req: Request, res: Response) => {
  try {
    const item = await prisma.relationType.findUnique({ where: { id: Number(req.params.id) } });
    if (!item) return res.status(404).json({ error: 'Type de relation non trouvé' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createRelationType = async (req: Request, res: Response) => {
  try {
    const { code, label, description, universId, categorieId, cultureId } = req.body;
    const created = await prisma.relationType.create({
      data: { code, label, description, universId, categorieId, cultureId },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateRelationType = async (req: Request, res: Response) => {
  try {
    const { code, label, description, universId, categorieId, cultureId } = req.body;
    const updated = await prisma.relationType.update({
      where: { id: Number(req.params.id) },
      data: { code, label, description, universId, categorieId, cultureId },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteRelationType = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.personnageRelation.deleteMany({ where: { relationTypeId: id } }),
      prisma.relationType.delete({ where: { id } }),
    ]);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const totalRelationType = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.relationType.count();
    res.json({ total: count });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
