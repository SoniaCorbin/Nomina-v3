import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { FALLBACK_ORGANIZATIONS } from '../data/lookups';

export const getOrganizations = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.organization.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.json(FALLBACK_ORGANIZATIONS);
  }
};

export const getOrganizationById = async (req: Request, res: Response) => {
  try {
    const item = await prisma.organization.findUnique({
      where: { id: Number(req.params.id) },
      include: { memberships: true },
    });
    if (!item) return res.status(404).json({ error: 'Organisation non trouvée' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const { name, type, description, imageUrl, universId, categorieId, cultureId } = req.body;
    const created = await prisma.organization.create({
      data: { name, type, description, imageUrl, universId, categorieId, cultureId },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateOrganization = async (req: Request, res: Response) => {
  try {
    const { name, type, description, imageUrl, universId, categorieId, cultureId } = req.body;
    const updated = await prisma.organization.update({
      where: { id: Number(req.params.id) },
      data: { name, type, description, imageUrl, universId, categorieId, cultureId },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteOrganization = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.personnageOrganization.deleteMany({ where: { organizationId: id } }),
      prisma.organization.delete({ where: { id } }),
    ]);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const totalOrganization = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.organization.count();
    res.json({ total: count });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
