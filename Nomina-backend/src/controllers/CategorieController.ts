import type { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getCategorieById = async (req: Request, res: Response) => {
  try {
    const categorie = await prisma.categorie.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        nomPersonnages: true,
        lieux: true,
        fragmentsHistoire: true,
        titres: true,
        concepts: true,
      },
    });
    if (!categorie) return res.status(404).json({ error: 'Catégorie non trouvée' });
    res.json(categorie);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST - creer une nouvelle catégorie
export const createCategorie = async (req: Request, res: Response) => {
  try {
    const { name, description, universId, universName } = req.body as {
      name: string;
      description?: string;
      universId?: number | string;
      universName?: string;
    };

    if (!name) return res.status(400).json({ error: "name requis" });

    const newCategorie = await prisma.categorie.create({
      data: {
        name,
        description,
        univers: universId
          ? { connect: { id: Number(universId) } }
          : {
              connectOrCreate: {
                where: { name: universName ?? "Tous" },
                create: { name: universName ?? "Tous" },
              },
            },
      },
    });

    res.status(201).json(newCategorie);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

   
// PUT - modifier la categorie par son id
export const updateCategorie  = async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body as { name: string; description: string };
    const updatedCategorie = await prisma.categorie.update({
      where: { id: Number(req.params.id) },
      data: { name, description },
    });
    res.json(updatedCategorie);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE - supprimer une categorie
export const deleteCategorie = async (req: Request, res: Response) => {
  try {
    await prisma.categorie.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Aggregation - obtenir le nombre total de categories
export const totalCategorie = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.categorie.count();
    res.json({ total: count });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Lister toutes les categories pour le dropdown "Categorie"

export const getCategories = async (req: Request, res: Response) => {
  try {
    const universIdRaw = req.query.universId;
    const universId =
      typeof universIdRaw === "string" && universIdRaw.trim() !== ""
        ? Number(universIdRaw)
        : undefined;

    const categories = await prisma.categorie.findMany({
      where: universId ? { universId } : undefined,
      include: { univers: true },
      orderBy: { id: "asc" },
    });

    res.json(categories);
  } catch (error) {
    console.error("Erreur getCategories:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const uploadCategorieImage = async (req: Request, res: Response) => {
  try {
    const categorieId = Number(req.params.id);
    if (!Number.isFinite(categorieId)) {
      return res.status(400).json({ error: "Id de catégorie invalide" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier image reçu" });
    }

    const imageUrl = `/uploads/categories/${req.file.filename}`;

    const categorie = await prisma.categorie.update({
      where: { id: categorieId },
      data: { imageUrl },
      include: { univers: true },
    });

    return res.json({
      message: "Image téléversée avec succès",
      imageUrl,
      categorie,
    });
  } catch (error) {
    console.error("Erreur uploadCategorieImage:", error);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};