import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { isKnownPrismaError } from '../utils/prismaErrors';

export const getCultureById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Id invalide' });

    const culture = await prisma.culture.findUnique({
      where: { id },
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
  try {
    const { name, description } = req.body as { name?: string; description?: string | null };

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Le champ "name" est requis' });
    }

    const trimmedName = name.trim();
    const trimmedDescription = typeof description === 'string' ? description.trim() : null;

    const newCulture = await prisma.culture.create({
      data: { name: trimmedName, description: trimmedDescription },
    });
    res.status(201).json(newCulture);
  } catch (error) {
    if (isKnownPrismaError(error, 'P2002')) {
      return res.status(409).json({ error: 'Nom de culture déjà utilisé' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT - modifier la culture par son id
export const updateCulture  = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Id invalide' });

    const { name, description } = req.body as { name?: string | null; description?: string | null };

    if (name !== undefined) {
      if (name === null || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Le champ "name" ne peut pas être vide' });
      }
    }

    const data: { name?: string; description?: string | null } = {};
    if (name !== undefined) {
      data.name = name.trim();
    }
    if (description !== undefined) {
      data.description = typeof description === 'string' ? description.trim() : null;
    }

    const updatedCulture = await prisma.culture.update({
      where: { id },
      data,
    });
    res.json(updatedCulture);
  } catch (error) {
    if (isKnownPrismaError(error, 'P2002')) {
      return res.status(409).json({ error: 'Nom de culture déjà utilisé' });
    }
    if (isKnownPrismaError(error, 'P2025')) {
      return res.status(404).json({ error: 'Culture non trouvée' });
    }
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
      prisma.personnage.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.creature.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.event.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.socialClass.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.occupation.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.organization.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.relationType.updateMany({ where: { cultureId: id }, data: { cultureId: null } }),
      prisma.culture.delete({ where: { id } }),
    ]);

    res.status(204).end();
  } catch (error) {
    if (isKnownPrismaError(error, 'P2003')) {
      return res.status(409).json({ error: 'Impossible de supprimer cette culture car elle est encore référencée' });
    }
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