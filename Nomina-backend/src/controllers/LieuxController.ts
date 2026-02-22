import type { Request, Response } from 'express';
import prisma from '../utils/prisma';

// GET - lister tous les lieux
export const getLieux = async (_req: Request, res: Response) => {
  try {
    const lieux = await prisma.lieux.findMany({
      include: {
        categorie: true,
      },
      orderBy: { id: 'asc' },
    });
    res.json(lieux);
  } catch (error) {
    console.error('Erreur getLieux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET - récupérer un lieu par id (avec la catégorie)
export const getLieuById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const lieu = await prisma.lieux.findUnique({
      where: { id },
      include: {
        categorie: true,
      },
    });
    if (!lieu) return res.status(404).json({ error: 'Lieu non trouvé' });
    res.json(lieu);
  } catch (error) {
    console.error('Erreur getLieuById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST - créer un nouveau lieu
export const createLieu = async (req: Request, res: Response) => {
  try {
    const { value, type, categorieId } = req.body as {
      value?: string;
      type?: string | null;
      categorieId?: number | string | null;
    };

    // value est requis selon le schema Prisma
    if (!value || typeof value !== 'string') {
      return res.status(400).json({ error: 'Le champ "value" est requis et doit être une chaîne' });
    }

    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const newLieu = await prisma.lieux.create({
      data: {
        value,
        type: type ?? null,
        categorieId: categorieIdNum,
      },
    });

    res.status(201).json(newLieu);
  } catch (error) {
    console.error('Erreur createLieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT - modifier un lieu par son id
export const updateLieu = async (req: Request, res: Response) => {
  try {
    const { value, type, categorieId } = req.body as {
      value?: string | null;
      type?: string | null;
      categorieId?: number | string | null;
    };

    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const updated = await prisma.lieux.update({
      where: { id: Number(req.params.id) },
      data: {
        // si la valeur est absente dans le body on laisse la valeur existante en passant null explicitement uniquement si
        // le client envoie null; ici on applique valeur || null pour rester cohérent avec les autres contrôleurs
        value: value ?? undefined,
        type: type ?? null,
        categorieId: categorieIdNum,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Erreur updateLieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE - supprimer un lieu
export const deleteLieu = async (req: Request, res: Response) => {
  try {
    await prisma.lieux.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    console.error('Erreur deleteLieu:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Aggregation - obtenir le nombre total de lieux
export const totalLieux = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.lieux.count();
    res.json({ total: count });
  } catch (error) {
    console.error('Erreur totalLieux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const uploadLieuImage = async (req: Request, res: Response) => {
  try {
    const lieuId = Number(req.params.id);
    if (!Number.isFinite(lieuId)) {
      return res.status(400).json({ error: 'Id de lieu invalide' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier image reçu' });
    }

    const imageUrl = `/uploads/lieux/${req.file.filename}`;

    const lieu = await prisma.lieux.update({
      where: { id: lieuId },
      data: { imageUrl },
      include: {
        categorie: true,
      },
    });

    return res.json({
      message: 'Image téléversée avec succès',
      imageUrl,
      lieu,
    });
  } catch (error) {
    console.error('Erreur uploadLieuImage:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};