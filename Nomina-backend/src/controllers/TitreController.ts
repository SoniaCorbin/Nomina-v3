import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

// GET - lister tous les titres
export const getTitres = async (_req: Request, res: Response) => {
  try {
    const titres = await prisma.titre.findMany({
      include: {
        culture: true,
        categorie: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(titres);
  } catch (error) {
    logger.error('Erreur getTitres', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET - récupérer un titre par id (avec relations)
export const getTitreById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const titre = await prisma.titre.findUnique({
      where: { id },
      include: {
        culture: true,
        categorie: true,
      },
    });
    if (!titre) return res.status(404).json({ error: 'Titre non trouvé' });
    res.json(titre);
  } catch (error) {
    logger.error('Erreur getTitreById', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST - créer un nouveau titre
export const createTitre = async (req: Request, res: Response) => {
  try {
    const { valeur, type, genre, cultureId, categorieId } = req.body as {
      valeur?: string;
      type?: string | null;
      genre?: string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

    // valeur est requis selon le schema Prisma
    if (!valeur || typeof valeur !== 'string') {
      return res.status(400).json({ error: 'Le champ "valeur" est requis et doit être une chaîne' });
    }

    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const newTitre = await prisma.titre.create({
      data: {
        valeur,
        type: type ?? null,
        genre: genre ?? null,
        cultureId: cultureIdNum,
        categorieId: categorieIdNum,
      },
    });

    res.status(201).json(newTitre);
  } catch (error) {
    logger.error('Erreur createTitre', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT - modifier un titre par son id
export const updateTitre = async (req: Request, res: Response) => {
  try {
    const { valeur, type, genre, cultureId, categorieId } = req.body as {
      valeur?: string | null;
      type?: string | null;
      genre?: string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const updated = await prisma.titre.update({
      where: { id: Number(req.params.id) },
      data: {
        valeur: valeur ?? undefined,
        type: type ?? null,
        genre: genre ?? null,
        cultureId: cultureId === undefined ? undefined : cultureIdNum,
        categorieId: categorieId === undefined ? undefined : categorieIdNum,
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Erreur updateTitre', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE - supprimer un titre
export const deleteTitre = async (req: Request, res: Response) => {
  try {
    await prisma.titre.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    logger.error('Erreur deleteTitre', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Aggregation - obtenir le nombre total de titres
export const totalTitres = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.titre.count();
    res.json({ total: count });
  } catch (error) {
    logger.error('Erreur totalTitres', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};