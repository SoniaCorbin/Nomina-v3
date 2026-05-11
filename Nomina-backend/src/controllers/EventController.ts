import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';
import { FALLBACK_EVENTS } from '../data/lookups';

// getEvents garde le try/catch pour renvoyer les constantes FALLBACK en cas d'erreur DB
export const getEvents = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.event.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.json(FALLBACK_EVENTS);
  }
};

export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const item = await prisma.event.findUnique({
    where: { id: Number(req.params.id) },
    include: { participants: true },
  });
  if (!item) throw new AppError(404, 'Événement non trouvé');
  res.json(item);
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const { title, summary, startYear, endYear, placeId, universId, categorieId, cultureId } = req.body;
  const created = await prisma.event.create({
    data: { title, summary, startYear, endYear, placeId, universId, categorieId, cultureId },
  });
  res.status(201).json(created);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const { title, summary, startYear, endYear, placeId, universId, categorieId, cultureId } = req.body;
  const updated = await prisma.event.update({
    where: { id: Number(req.params.id) },
    data: { title, summary, startYear, endYear, placeId, universId, categorieId, cultureId },
  });
  res.json(updated);
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await prisma.$transaction([
    prisma.personnageEvent.deleteMany({ where: { eventId: id } }),
    prisma.event.delete({ where: { id } }),
  ]);
  res.status(204).end();
});

export const totalEvent = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.event.count();
  res.json({ total: count });
});
