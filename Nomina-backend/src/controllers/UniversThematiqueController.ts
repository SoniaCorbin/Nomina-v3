import type { Request, Response } from "express";
import prisma from "../utils/prisma";
import { isKnownPrismaError } from "../utils/prismaErrors";
import { logger } from '../utils/logger';

// Lister les univers thématiques pour le dropdown "Univers Thématique"
export const getUniversThematiques = async (_req: Request, res: Response) => {
  try {
        const univers = await prisma.universThematique.findMany({
          select: { id: true, name: true, imageUrl: true },
          orderBy: { id: "asc" },
        });

        const cleaned = univers
          .map((u) => ({ ...u, name: u.name.trim() }))
          .filter((u) => u.name.length > 0 && u.name.toLowerCase() !== "tous");

        res.json(cleaned);
    } catch (error) {
    logger.error("Erreur getUniversThematiques", { err: error });
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET - lister tous les univers (pour l'admin)
export const getUniversThematiquesAdmin = async (_req: Request, res: Response) => {
  try {
    const univers = await prisma.universThematique.findMany({
      select: { id: true, name: true, description: true, imageUrl: true },
      orderBy: { id: "asc" },
    });
    res.json(univers);
  } catch (error) {
    logger.error("Erreur getUniversThematiquesAdmin", { err: error });
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET - total des univers (dashboard)
export const totalUniversThematiques = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.universThematique.count();
    res.json({ total: count });
  } catch (error) {
    logger.error("Erreur totalUniversThematiques", { err: error });
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET - récupérer un univers par id (admin)
export const getUniversThematiqueById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    const univers = await prisma.universThematique.findUnique({
      where: { id },
      select: { id: true, name: true, description: true, imageUrl: true },
    });
    if (!univers) return res.status(404).json({ error: "Univers non trouvé" });

    res.json(univers);
  } catch (error) {
    logger.error("Erreur getUniversThematiqueById", { err: error });
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// POST - créer un univers (admin)
export const createUniversThematique = async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl } = req.body as {
      name?: string;
      description?: string | null;
      imageUrl?: string | null;
    };

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Le champ \"name\" est requis" });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 80) return res.status(400).json({ error: "Le nom est trop long (max 80)" });

    const trimmedDesc = typeof description === "string" ? description.trim() : null;
    if (trimmedDesc && trimmedDesc.length > 500) {
      return res.status(400).json({ error: "La description est trop longue (max 500)" });
    }

    const trimmedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : null;
    if (trimmedImageUrl && trimmedImageUrl.length > 2048) {
      return res.status(400).json({ error: "L’URL de l’image est trop longue (max 2048)" });
    }

    const created = await prisma.universThematique.create({
      data: { name: trimmedName, description: trimmedDesc, imageUrl: trimmedImageUrl },
      select: { id: true, name: true, description: true, imageUrl: true },
    });

    res.status(201).json(created);
  } catch (error) {
    if (isKnownPrismaError(error, "P2002")) {
      return res.status(409).json({ error: "Nom d’univers déjà utilisé" });
    }
    logger.error("Erreur createUniversThematique", { err: error });
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// PUT - modifier un univers (admin)
export const updateUniversThematique = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    const { name, description, imageUrl } = req.body as {
      name?: string | null;
      description?: string | null;
      imageUrl?: string | null;
    };

    const data: { name?: string; description?: string | null; imageUrl?: string | null } = {};

    if (name !== undefined) {
      if (name === null || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Le champ \"name\" ne peut pas être vide" });
      }
      const trimmedName = name.trim();
      if (trimmedName.length > 80) return res.status(400).json({ error: "Le nom est trop long (max 80)" });
      data.name = trimmedName;
    }

    if (description !== undefined) {
      const trimmedDesc = typeof description === "string" ? description.trim() : null;
      if (trimmedDesc && trimmedDesc.length > 500) {
        return res.status(400).json({ error: "La description est trop longue (max 500)" });
      }
      data.description = trimmedDesc;
    }

    if (imageUrl !== undefined) {
      const trimmedImageUrl = typeof imageUrl === "string" ? imageUrl.trim() : null;
      if (trimmedImageUrl && trimmedImageUrl.length > 2048) {
        return res.status(400).json({ error: "L’URL de l’image est trop longue (max 2048)" });
      }
      data.imageUrl = trimmedImageUrl;
    }

    const updated = await prisma.universThematique.update({
      where: { id },
      data,
      select: { id: true, name: true, description: true, imageUrl: true },
    });

    res.json(updated);
  } catch (error) {
    if (isKnownPrismaError(error, "P2002")) {
      return res.status(409).json({ error: "Nom d’univers déjà utilisé" });
    }
    if (isKnownPrismaError(error, "P2025")) {
      return res.status(404).json({ error: "Univers non trouvé" });
    }
    logger.error("Erreur updateUniversThematique", { err: error });
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// DELETE - supprimer un univers (admin)
export const deleteUniversThematique = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    const categoriesCount = await prisma.categorie.count({ where: { universId: id } });
    if (categoriesCount > 0) {
      return res.status(409).json({
        error: "Impossible de supprimer: des catégories utilisent cet univers",
        details: { categories: categoriesCount },
      });
    }

    await prisma.universThematique.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    if (isKnownPrismaError(error, "P2025")) {
      return res.status(404).json({ error: "Univers non trouvé" });
    }
    logger.error("Erreur deleteUniversThematique", { err: error });
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const uploadUniversThematiqueImage = async (req: Request, res: Response) => {
  try {
    const universId = Number(req.params.id);
    if (!Number.isFinite(universId)) {
      return res.status(400).json({ error: "Id d’univers invalide" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier image reçu" });
    }

    const imageUrl = `/uploads/univers/${req.file.filename}`;

    const univers = await prisma.universThematique.update({
      where: { id: universId },
      data: { imageUrl },
      select: { id: true, name: true, description: true, imageUrl: true },
    });

    return res.json({
      message: "Image téléversée avec succès",
      imageUrl,
      univers,
    });
  } catch (error) {
    logger.error("Erreur uploadUniversThematiqueImage", { err: error });
    return res.status(500).json({ error: "Erreur serveur" });
  }
};