import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

export const getCreatures = async (_req: Request, res: Response) => {
  try {
    const creatures = await prisma.creature.findMany({
      include: {
        categorie: true,
        culture: true,
        personnage: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(creatures);
  } catch (error) {
    logger.error('Erreur getCreatures', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCreatureById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const creature = await prisma.creature.findUnique({
      where: { id },
      include: {
        categorie: true,
        culture: true,
        personnage: true,
      },
    });

    if (!creature) return res.status(404).json({ error: 'Creature non trouvée' });

    res.json(creature);
  } catch (error) {
    logger.error('Erreur getCreatureById', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createCreature = async (req: Request, res: Response) => {
  try {
    const { valeur, type, description, personnageId, cultureId, categorieId } = req.body as {
      valeur?: string;
      type?: string | null;
      description?: string | null;
      personnageId?: number | string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

    if (!valeur || typeof valeur !== 'string') {
      return res.status(400).json({ error: 'Le champ "valeur" est requis et doit être une chaîne' });
    }

    const personnageIdNum = personnageId !== undefined && personnageId !== null ? Number(personnageId) : null;
    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const newCreature = await prisma.creature.create({
      data: {
        valeur,
        type: type ?? null,
        description: description ?? null,
        personnageId: personnageIdNum,
        cultureId: cultureIdNum,
        categorieId: categorieIdNum,
      },
    });

    res.status(201).json(newCreature);
  } catch (error) {
    logger.error('Erreur createCreature', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateCreature = async (req: Request, res: Response) => {
  try {
    const { valeur, type, description, personnageId, cultureId, categorieId } = req.body as {
      valeur?: string | null;
      type?: string | null;
      description?: string | null;
      personnageId?: number | string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

    const personnageIdNum = personnageId !== undefined && personnageId !== null ? Number(personnageId) : null;
    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const updated = await prisma.creature.update({
      where: { id: Number(req.params.id) },
      data: {
        valeur: valeur ?? undefined,
        type: type ?? null,
        description: description ?? null,
        personnageId: personnageId === undefined ? undefined : personnageIdNum,
        cultureId: cultureId === undefined ? undefined : cultureIdNum,
        categorieId: categorieId === undefined ? undefined : categorieIdNum,
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Erreur updateCreature', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteCreature = async (req: Request, res: Response) => {
  try {
    await prisma.creature.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    logger.error('Erreur deleteCreature', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const totalCreatures = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.creature.count();
    res.json({ total: count });
  } catch (error) {
    logger.error('Erreur totalCreatures', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const uploadCreatureImage = async (req: Request, res: Response) => {
  try {
    const creatureId = Number(req.params.id);
    if (!Number.isFinite(creatureId)) {
      return res.status(400).json({ error: 'Id de créature invalide' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier image reçu' });
    }

    const imageUrl = `/uploads/creatures/${req.file.filename}`;

    const creature = await prisma.creature.update({
      where: { id: creatureId },
      data: { imageUrl },
      include: {
        categorie: true,
        culture: true,
        personnage: true,
      },
    });

    return res.json({
      message: 'Image téléversée avec succès',
      imageUrl,
      creature,
    });
  } catch (error) {
    logger.error('Erreur uploadCreatureImage', { err: error });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};
