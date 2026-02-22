import type { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getCultureById = async (req: Request, res: Response) => {
  try {
    const culture = await prisma.culture.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        nomPersonnages: true,    
        fragmentsHistoire: true,
        titres: true,        
      },
    });
    if (!culture) return res.status(404).json({ error: 'Culture non trouvée' });
    res.json(culture);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST - creer une nouvelle culture
export const createCulture = async (req: Request, res: Response) => {
  try { const { name, description } = req.body as { name: string; description: string };
    const newCulture = await prisma.culture.create({
      data: { name, description },
    });
    res.status(201).json(newCulture);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT - modifier la culture par son id
export const updateCulture  = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body as { name: string; description: string };
    const updatedCulture = await prisma.culture.update({
      where: { id: Number(req.params.id) },
      data: { name, description },
    });
    res.json(updatedCulture);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE - supprimer une culture
export const deleteCulture = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Id invalide' });

    const exists = await prisma.culture.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Culture non trouvée' });

    await prisma.$transaction([
      prisma.prenom.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.fragmentsHistoire.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.titre.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.nomFamille.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.culture.delete({ where: { id } }),
    ]);

    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Aggregation - obtenir le nombre total de cultures
export const totalCulture = async (req: Request, res: Response) => {
  try { const count = await prisma.culture.count();
    res.json({ total: count });
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Lister toutes les cultures pour le dropdown "Culture"
export const getCultures = async (_req: Request, res: Response) => {
  try {
    const cultures = await prisma.culture.findMany({ orderBy: { id: "asc" } });
    res.json(cultures);
  } catch (error) {
    console.error("Erreur getCultures:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const uploadCultureImage = async (req: Request, res: Response) => {
  try {
    const cultureId = Number(req.params.id);
    if (!Number.isFinite(cultureId)) {
      return res.status(400).json({ error: "Id de culture invalide" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier image reçu" });
    }

    const imageUrl = `/uploads/cultures/${req.file.filename}`;

    const culture = await prisma.culture.update({
      where: { id: cultureId },
      data: { imageUrl },
    });

    return res.json({
      message: "Image téléversée avec succès",
      imageUrl,
      culture,
    });
  } catch (error) {
    console.error("Erreur uploadCultureImage:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};