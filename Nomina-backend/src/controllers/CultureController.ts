import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../utils/prisma";
import { logger } from "../utils/logger";
import { AppError, asyncHandler } from "../middleware/error.middleware";
import { getValidated, validate } from "../middleware/validate.middleware";
import { paginate, paginationQuerySchema } from "../utils/pagination";

/* -------------------------------------------------------------------------- */
/*  Schémas Zod                                                               */
/* -------------------------------------------------------------------------- */

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const cultureBodySchema = z.object({
  name: z.string().trim().min(1, "Le champ 'name' est requis").max(120),
  description: z.string().trim().max(2000).nullable().optional(),
});

const cultureUpdateSchema = cultureBodySchema.partial().refine(
  (v) => Object.keys(v).length > 0,
  { message: "Au moins un champ doit être modifié" },
);

const listQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(120).optional(),
});

/* -------------------------------------------------------------------------- */
/*  Middlewares de validation à exporter et utiliser dans les routes          */
/* -------------------------------------------------------------------------- */

export const validateCultureId = validate(idParamSchema, "params");
export const validateCultureCreate = validate(cultureBodySchema, "body");
export const validateCultureUpdate = validate(cultureUpdateSchema, "body");
export const validateCultureList = validate(listQuerySchema, "query");

/* -------------------------------------------------------------------------- */
/*  DTO mapper — évite de leaker les champs internes Prisma                   */
/* -------------------------------------------------------------------------- */

type CultureRow = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
};

const toCultureDTO = (c: CultureRow) => ({
  id: c.id,
  name: c.name,
  description: c.description,
  imageUrl: c.imageUrl,
});

/* -------------------------------------------------------------------------- */
/*  Handlers — tous wrappés dans `asyncHandler`, plus aucun try/catch         */
/* -------------------------------------------------------------------------- */

export const getCultures = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, search } = getValidated<typeof listQuerySchema>(req, "query");

  const result = await paginate(prisma.culture, {
    page,
    pageSize,
    where: search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : undefined,
    orderBy: { id: "asc" },
    select: { id: true, name: true, description: true, imageUrl: true },
  });

  res.json({
    ...result,
    data: (result.data as CultureRow[]).map(toCultureDTO),
  });
});

export const getCultureById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getValidated<typeof idParamSchema>(req, "params");

  const culture = await prisma.culture.findUnique({
    where: { id },
    include: {
      nomPersonnages: true,
      fragmentsHistoire: true,
      titres: true,
    },
  });

  if (!culture) throw new AppError(404, "Culture non trouvée");
  res.json(culture);
});

export const createCulture = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = getValidated<typeof cultureBodySchema>(req, "body");

  const created = await prisma.culture.create({
    data: {
      name,
      description: description ?? null,
    },
  });

  res.status(201).json(toCultureDTO(created as CultureRow));
});

export const updateCulture = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getValidated<typeof idParamSchema>(req, "params");
  const data = getValidated<typeof cultureUpdateSchema>(req, "body");

  const updated = await prisma.culture.update({
    where: { id },
    data,
  });

  res.json(toCultureDTO(updated as CultureRow));
});

/**
 * Suppression simplifiée : repose sur `onDelete: SetNull` au niveau schéma
 * Prisma. Les 12 `updateMany` manuels de l'ancienne version sont remplacés
 * par une seule directive de schéma.
 *
 *   ⚠️ Nécessite la migration `culture_cascade_setnull` (voir patch-v4/README.md).
 */
export const deleteCulture = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getValidated<typeof idParamSchema>(req, "params");
  await prisma.culture.delete({ where: { id } });
  // P2025 (not found) et P2003 (FK) sont mappés par `errorHandler`.
  res.status(204).end();
});

export const totalCulture = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.culture.count();
  res.json({ total: count });
});

/**
 * Upload conservé tel quel — `multer` + `requireAdmin` sont gérés dans la
 * route. On garde le try/catch local uniquement pour logger l'erreur avant
 * de la rethrow.
 */
export const uploadCultureImage = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getValidated<typeof idParamSchema>(req, "params");

  if (!req.file) throw new AppError(400, "Aucun fichier image reçu");

  const imageUrl = `/uploads/cultures/${req.file.filename}`;

  try {
    const culture = await prisma.culture.update({
      where: { id },
      data: { imageUrl },
    });
    res.json({
      message: "Image téléversée avec succès",
      imageUrl,
      culture: toCultureDTO(culture as CultureRow),
    });
  } catch (err) {
    logger.error("uploadCultureImage failed", { err, cultureId: id });
    throw err;
  }
});
