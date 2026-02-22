import type { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getEvents = async (_req: Request, res: Response) => {
  try {
    const items = await prisma.event.findMany({ orderBy: { id: 'asc' } });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const item = await prisma.event.findUnique({
      where: { id: Number(req.params.id) },
      include: { participants: true },
    });
    if (!item) return res.status(404).json({ error: 'Événement non trouvé' });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { title, summary, startYear, endYear, placeId, universId, categorieId, cultureId } = req.body;
    const created = await prisma.event.create({
      data: { title, summary, startYear, endYear, placeId, universId, categorieId, cultureId },
    });
    res.status(201).json(created);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { title, summary, startYear, endYear, placeId, universId, categorieId, cultureId } = req.body;
    const updated = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data: { title, summary, startYear, endYear, placeId, universId, categorieId, cultureId },
    });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.personnageEvent.deleteMany({ where: { eventId: id } }),
      prisma.event.delete({ where: { id } }),
    ]);
    res.status(204).end();
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const totalEvent = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.event.count();
    res.json({ total: count });
  } catch {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
