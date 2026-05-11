import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';

export const getFragmentsHistoire = asyncHandler(async (_req: Request, res: Response) => {
  const fragments = await prisma.fragmentsHistoire.findMany({
    include: { culture: true, categorie: true },
    orderBy: { id: 'asc' },
  });
  res.json(fragments);
});

export const getFragmentHistoireById = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const fragment = await prisma.fragmentsHistoire.findUnique({
    where: { id },
    include: { culture: true, categorie: true },
  });
  if (!fragment) throw new AppError(404, "Fragment d'histoire non trouvé");
  res.json(fragment);
});

export const createFragmentHistoire = asyncHandler(async (req: Request, res: Response) => {
  const { texte, appliesTo, genre, minNameLength, maxNameLength, cultureId, categorieId } =
    req.body as {
      texte?: string;
      appliesTo?: string | null;
      genre?: string | null;
      minNameLength?: number | string | null;
      maxNameLength?: number | string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

  if (!texte || typeof texte !== 'string') {
    throw new AppError(400, 'Le champ "texte" est requis et doit être une chaîne');
  }

  const newFragment = await prisma.fragmentsHistoire.create({
    data: {
      texte,
      appliesTo: appliesTo ?? null,
      genre: genre ?? null,
      minNameLength: minNameLength != null ? Number(minNameLength) : null,
      maxNameLength: maxNameLength != null ? Number(maxNameLength) : null,
      cultureId: cultureId != null ? Number(cultureId) : null,
      categorieId: categorieId != null ? Number(categorieId) : null,
    },
  });

  res.status(201).json(newFragment);
});

export const updateFragmentHistoire = asyncHandler(async (req: Request, res: Response) => {
  const { texte, appliesTo, genre, minNameLength, maxNameLength, cultureId, categorieId } =
    req.body as {
      texte?: string | null;
      appliesTo?: string | null;
      genre?: string | null;
      minNameLength?: number | string | null;
      maxNameLength?: number | string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

  const updated = await prisma.fragmentsHistoire.update({
    where: { id: Number(req.params.id) },
    data: {
      texte: texte ?? undefined,
      appliesTo: appliesTo ?? null,
      genre: genre ?? null,
      minNameLength: minNameLength === undefined ? undefined : (minNameLength != null ? Number(minNameLength) : null),
      maxNameLength: maxNameLength === undefined ? undefined : (maxNameLength != null ? Number(maxNameLength) : null),
      cultureId: cultureId === undefined ? undefined : (cultureId != null ? Number(cultureId) : null),
      categorieId: categorieId === undefined ? undefined : (categorieId != null ? Number(categorieId) : null),
    },
  });

  res.json(updated);
});

export const deleteFragmentHistoire = asyncHandler(async (req: Request, res: Response) => {
  await prisma.fragmentsHistoire.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export const totalFragmentsHistoire = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.fragmentsHistoire.count();
  res.json({ total: count });
});
