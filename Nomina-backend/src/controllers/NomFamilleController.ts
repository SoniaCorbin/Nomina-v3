import type { Request, Response } from "express";
import prisma from "../utils/prisma";
import { isKnownPrismaError } from "../utils/prismaErrors";

// GET - lister tous les noms de famille
export const getNomFamilles = async (_req: Request, res: Response) => {
  try {
    const noms = await prisma.nomFamille.findMany({
      include: {
        culture: true,
        categorie: true,
        _count: { select: { personnages: true } },
      },
      orderBy: { id: "asc" },
    });
    res.json(noms);
  } catch (error) {
    console.error("Erreur getNomFamilles:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET - récupérer un nom de famille par id
export const getNomFamilleById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    const nom = await prisma.nomFamille.findUnique({
      where: { id },
      include: { culture: true, categorie: true, personnages: true },
    });

    if (!nom) return res.status(404).json({ error: "Nom de famille non trouvé" });

    res.json(nom);
  } catch (error) {
    console.error("Erreur getNomFamilleById:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// POST - créer un nom de famille
export const createNomFamille = async (req: Request, res: Response) => {
  try {
    const { valeur, cultureId, categorieId } = req.body as {
      valeur?: string;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

    if (!valeur || typeof valeur !== "string" || !valeur.trim()) {
      return res.status(400).json({ error: 'Le champ "valeur" est requis' });
    }

    const trimmed = valeur.trim();
    if (trimmed.length > 120) return res.status(400).json({ error: "La valeur est trop longue (max 120)" });

    const cultureIdNum = cultureId !== undefined && cultureId !== null ? Number(cultureId) : null;
    const categorieIdNum = categorieId !== undefined && categorieId !== null ? Number(categorieId) : null;

    const created = await prisma.nomFamille.create({
      data: {
        valeur: trimmed,
        cultureId: cultureIdNum,
        categorieId: categorieIdNum,
      },
      include: { culture: true, categorie: true },
    });

    res.status(201).json(created);
  } catch (error) {
    if (isKnownPrismaError(error, "P2002")) {
      return res.status(409).json({ error: "Nom de famille déjà utilisé" });
    }
    console.error("Erreur createNomFamille:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// PUT - modifier un nom de famille
export const updateNomFamille = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    const { valeur, cultureId, categorieId } = req.body as {
      valeur?: string | null;
      cultureId?: number | string | null;
      categorieId?: number | string | null;
    };

    const data: { valeur?: string; cultureId?: number | null; categorieId?: number | null } = {};

    if (valeur !== undefined) {
      if (valeur === null || typeof valeur !== "string" || !valeur.trim()) {
        return res.status(400).json({ error: 'Le champ "valeur" ne peut pas être vide' });
      }
      const trimmed = valeur.trim();
      if (trimmed.length > 120) return res.status(400).json({ error: "La valeur est trop longue (max 120)" });
      data.valeur = trimmed;
    }

    if (cultureId !== undefined) data.cultureId = cultureId === null ? null : Number(cultureId);
    if (categorieId !== undefined) data.categorieId = categorieId === null ? null : Number(categorieId);

    const updated = await prisma.nomFamille.update({
      where: { id },
      data,
      include: { culture: true, categorie: true },
    });

    res.json(updated);
  } catch (error) {
    if (isKnownPrismaError(error, "P2002")) {
      return res.status(409).json({ error: "Nom de famille déjà utilisé" });
    }
    if (isKnownPrismaError(error, "P2025")) {
      return res.status(404).json({ error: "Nom de famille non trouvé" });
    }
    console.error("Erreur updateNomFamille:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// DELETE - supprimer un nom de famille
export const deleteNomFamille = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "ID invalide" });

    await prisma.$transaction([
      prisma.prenom.updateMany({ where: { nomFamilleId: id }, data: { nomFamilleId: null } }),
      prisma.nomFamille.delete({ where: { id } }),
    ]);

    res.status(204).end();
  } catch (error) {
    if (isKnownPrismaError(error, "P2025")) {
      return res.status(404).json({ error: "Nom de famille non trouvé" });
    }
    console.error("Erreur deleteNomFamille:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// Aggregation - obtenir le nombre total de noms de famille
export const totalNomFamille = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.nomFamille.count();
    res.json({ total: count });
  } catch (error) {
    console.error("Erreur totalNomFamille:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
