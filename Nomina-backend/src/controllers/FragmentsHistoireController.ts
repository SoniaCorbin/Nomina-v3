import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

// GET - lister tous les fragments d'histoire
export const getFragmentsHistoire = async (_req: Request, res: Response) => {
  try {
    const fragments = await prisma.fragmentsHistoire.findMany({
      include: {
        culture: true,
        categorie: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(fragments);
  } catch (error) {
    logger.error('Erreur getFragmentsHistoire', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET - récupérer un fragment par id (avec relations)
export const getFragmentHistoireById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const fragment = await prisma.fragmentsHistoire.findUnique({
      where: { id },
      include: {
        culture: true,
        categorie: true,
      },
    });
    if (!fragment) return res.status(404).json({ error: "Fragment d'histoire non trouvé" });
    res.json(fragment);
  } catch (error) {
    logger.error('Erreur getFragmentHistoireById', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST - créer un nouveau fragment d'histoire
export const createFragmentHistoire = async (req: Request, res: Response) => {
  try {
    const {
      texte,
      appliesTo,
      genre,
      minNameLength,
      maxNameLength,
      cultureId,
      categorieId,
    } = req.body as {
      texte?: string;
      appliesTo?: string | null;
      genre?: string | null;
      minNameLength?: number | string | null;
      maxNameLength?: number | string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

    // texte est requis selon le schema Prisma
    if (!texte || typeof texte !== 'string') {
      return res.status(400).json({ error: 'Le champ "texte" est requis et doit être une chaîne' });
    }

    const minLenNum =
      minNameLength !== undefined && minNameLength !== null ? Number(minNameLength) : null;
    const maxLenNum =
      maxNameLength !== undefined && maxNameLength !== null ? Number(maxNameLength) : null;
    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum =
      categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const newFragment = await prisma.fragmentsHistoire.create({
      data: {
        texte,
        appliesTo: appliesTo ?? null,
        genre: genre ?? null,
        minNameLength: minLenNum,
        maxNameLength: maxLenNum,
        cultureId: cultureIdNum,
        categorieId: categorieIdNum,
      },
    });

    res.status(201).json(newFragment);
  } catch (error) {
    logger.error('Erreur createFragmentHistoire', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT - modifier un fragment par son id
export const updateFragmentHistoire = async (req: Request, res: Response) => {
  try {
    const {
      texte,
      appliesTo,
      genre,
      minNameLength,
      maxNameLength,
      cultureId,
      categorieId,
    } = req.body as {
      texte?: string | null;
      appliesTo?: string | null;
      genre?: string | null;
      minNameLength?: number | string | null;
      maxNameLength?: number | string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

    const minLenNum =
      minNameLength !== undefined && minNameLength !== null ? Number(minNameLength) : null;
    const maxLenNum =
      maxNameLength !== undefined && maxNameLength !== null ? Number(maxNameLength) : null;
    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum =
      categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const updated = await prisma.fragmentsHistoire.update({
      where: { id: Number(req.params.id) },
      data: {
        // si un champ n'est pas fourni dans le body, on ne l'écrase pas (undefined)
        texte: texte ?? undefined,
        appliesTo: appliesTo ?? null,
        genre: genre ?? null,
        minNameLength: minNameLength === undefined ? undefined : minLenNum,
        maxNameLength: maxNameLength === undefined ? undefined : maxLenNum,
        cultureId: cultureId === undefined ? undefined : cultureIdNum,
        categorieId: categorieId === undefined ? undefined : categorieIdNum,
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Erreur updateFragmentHistoire', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE - supprimer un fragment
export const deleteFragmentHistoire = async (req: Request, res: Response) => {
  try {
    await prisma.fragmentsHistoire.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    logger.error('Erreur deleteFragmentHistoire', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Aggregation - obtenir le nombre total de fragments d'histoire
export const totalFragmentsHistoire = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.fragmentsHistoire.count();
    res.json({ total: count });
  } catch (error) {
    logger.error('Erreur totalFragmentsHistoire', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};