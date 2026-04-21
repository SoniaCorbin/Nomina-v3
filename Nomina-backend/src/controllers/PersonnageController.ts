import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export const getPersonnages = async (_req: Request, res: Response) => {
  try {
    const personnages = await prisma.personnage.findMany({
      include: {
        prenom: true,
        nomFamille: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(personnages);
  } catch (error) {
    logger.error('Erreur getPersonnages', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPersonnageById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const personnage = await prisma.personnage.findUnique({
      where: { id },
      include: {
        prenom: true,
        nomFamille: true,
        titre: true,
        culture: true,
        categorie: true,
        creatures: true,
      },
    });

    if (!personnage) return res.status(404).json({ error: 'Personnage non trouvé' });

    res.json(personnage);
  } catch (error) {
    logger.error('Erreur getPersonnageById', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const totalPersonnages = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.personnage.count();
    res.json({ total: count });
  } catch (error) {
    logger.error('Erreur totalPersonnages', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
