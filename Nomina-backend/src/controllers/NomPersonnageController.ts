import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { parsePagination, paginatedResponse } from '../utils/pagination';

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

// GET - lister les noms de personnage (paginé)
export const getNomPersonnages = asyncHandler(async (req: Request, res: Response) => {
  const pg = parsePagination(req.query as Record<string, unknown>);
  const [noms, total] = await Promise.all([
    prisma.prenom.findMany({
      include: { culture: true, categorie: true },
      orderBy: { id: 'asc' },
      skip: pg.skip,
      take: pg.limit,
    }),
    prisma.prenom.count(),
  ]);
  res.json(paginatedResponse(noms, total, pg));
});

// GET - récupérer un nom de personnage par id
export const getNomPersonnageById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const nom = await prisma.prenom.findUnique({
    where: { id },
    include: { culture: true, categorie: true },
  });
  if (!nom) throw new AppError(404, 'NomPersonnage non trouvé');
  res.json(nom);
});

// POST - créer un nouveau NomPersonnage
export const createNomPersonnage = asyncHandler(async (req: Request, res: Response) => {
  const parsed = nomPersonnageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Payload invalide', parsed.error.issues);
  }
  const { valeur, genre, cultureId, categorieId } = parsed.data;
  const cultureIdNum = cultureId != null ? Number(cultureId) : null;
  const categorieIdNum = categorieId != null ? Number(categorieId) : null;

  const newNomPersonnage = await prisma.prenom.create({
    data: {
      valeur: valeur ?? null,
      genre: canonicalizeGenre(genre),
      cultureId: cultureIdNum,
      categorieId: categorieIdNum,
    },
  });
  res.status(201).json(newNomPersonnage);
});

// PUT - modifier un NomPersonnage par son id
export const updateNomPersonnage = asyncHandler(async (req: Request, res: Response) => {
  const parsed = nomPersonnageBodySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError(400, 'Payload invalide', parsed.error.issues);
  }
  const { valeur, genre, cultureId, categorieId } = parsed.data;
  const updated = await prisma.prenom.update({
    where: { id: Number(req.params.id) },
    data: {
      valeur: valeur ?? null,
      genre: canonicalizeGenre(genre),
      cultureId: cultureId != null ? Number(cultureId) : null,
      categorieId: categorieId != null ? Number(categorieId) : null,
    },
  });
  res.json(updated);
});

// DELETE - supprimer un NomPersonnage
export const deleteNomPersonnage = asyncHandler(async (req: Request, res: Response) => {
  await prisma.prenom.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

// Agrégation - nombre total de NomPersonnage
export const totalNomPersonnage = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.prenom.count();
  res.json({ total: count });
});

