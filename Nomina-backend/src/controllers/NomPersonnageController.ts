import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

function canonicalizeGenre(input: unknown): "M" | "F" | "NB" | null {
  if (input === undefined || input === null) return null;
  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (!raw) return null;
  const lc = raw.toLowerCase();

  if (["m", "masculin", "male", "homme"].includes(lc)) return "M";
  if (["f", "féminin", "feminin", "female", "femme"].includes(lc)) return "F";
  if (["nb", "non-binaire", "non binaire", "nonbinaire", "neutre", "neutral"].includes(lc)) return "NB";

  if (raw === "M" || raw === "F" || raw === "NB") return raw;
  return null;
}

const nomPersonnageBodySchema = z.object({
  valeur: z.string().trim().min(1).optional(),
  genre: z.string().optional().nullable(),
  cultureId: z.union([z.string(), z.number()]).optional().nullable(),
  categorieId: z.union([z.string(), z.number()]).optional().nullable(),
});

// GET - lister tous les noms de personnage
export const getNomPersonnages = async (_req: Request, res: Response) => {
  try {
    const noms = await prisma.prenom.findMany({
      include: {
        culture: true,
        categorie: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(noms);
  } catch (error) {
    logger.error('Erreur getNomPersonnages', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET - récupérer un nom de personnage par id (avec relations)
export const getNomPersonnageById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const nom = await prisma.prenom.findUnique({
      where: { id },
      include: {
        culture: true,
        categorie: true,
      },
    });
    if (!nom) return res.status(404).json({ error: 'NomPersonnage non trouvé' });
    res.json(nom);
  } catch (error) {
    logger.error('Erreur getNomPersonnageById', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST - créer un nouveau NomPersonnage
export const createNomPersonnage = async (req: Request, res: Response) => {
  try {
    const parsed = nomPersonnageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Payload invalide", issues: parsed.error.issues });
    }

    const { valeur, genre, cultureId, categorieId } = parsed.data;

    // conversion si les ids sont envoyés en string
    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const canonicalGenre = canonicalizeGenre(genre);

    const newNomPersonnage = await prisma.prenom.create({
      data: {
        valeur: valeur ?? null,
        genre: canonicalGenre,
        // on peut fournir directement les FK
        cultureId: cultureIdNum,
        categorieId: categorieIdNum,
      },
    });

    res.status(201).json(newNomPersonnage);
  } catch (error) {
    logger.error('Erreur createNomPersonnage', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT - modifier un NomPersonnage par son id
export const updateNomPersonnage = async (req: Request, res: Response) => {
  try {
    const parsed = nomPersonnageBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Payload invalide", issues: parsed.error.issues });
    }

    const { valeur, genre, cultureId, categorieId } = parsed.data;

    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const updated = await prisma.prenom.update({
      where: { id: Number(req.params.id) },
      data: {
        valeur: valeur ?? null,
        genre: canonicalizeGenre(genre),
        cultureId: cultureIdNum,
        categorieId: categorieIdNum,
      },
    });

    res.json(updated);
  } catch (error) {
    logger.error('Erreur updateNomPersonnage', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE - supprimer un NomPersonnage
export const deleteNomPersonnage = async (req: Request, res: Response) => {
  try {
    await prisma.prenom.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    logger.error('Erreur deleteNomPersonnage', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Aggregation - obtenir le nombre total de NomPersonnage
export const totalNomPersonnage = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.prenom.count();
    res.json({ total: count });
  } catch (error) {
    logger.error('Erreur totalNomPersonnage', { err: error });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

