/**
 * Utilitaires de pagination standard.
 *
 * Utilisation dans un controller :
 *
 *   const pg = parsePagination(req.query);
 *   const [data, total] = await Promise.all([
 *     prisma.culture.findMany({ skip: pg.skip, take: pg.limit, ...rest }),
 *     prisma.culture.count({ where }),
 *   ]);
 *   res.json(paginatedResponse(data, total, pg));
 */

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Parse les query params `page` et `limit`.
 * - page  : ≥ 1, défaut 1
 * - limit : 1–200, défaut 50
 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  { page, limit }: PaginationParams
) {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

/* -----------------------------------------------------------------------
 * API v4 — pagination basée sur Zod + helper `paginate()`
 * (Compatible avec la nouvelle CultureController.ts et les futurs
 *  contrôleurs. Les anciennes fonctions ci-dessus restent inchangées.)
 * --------------------------------------------------------------------- */

import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationQuerySchema>;

export interface PageResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Pagination générique Prisma v5.
 *
 * @param model  – Modèle Prisma (ex. `prisma.culture`)
 * @param args   – `{ page, pageSize, where?, orderBy?, select?, include? }`
 */
export async function paginate<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TDelegate extends {
    findMany(args: any): Promise<unknown[]>;
    count(args?: any): Promise<number>;
  },
  TArgs extends {
    where?: unknown;
    orderBy?: unknown;
    select?: unknown;
    include?: unknown;
  },
>(
  model: TDelegate,
  args: TArgs & { page: number; pageSize: number },
): Promise<PageResult<unknown>> {
  const { page, pageSize, where, orderBy, select, include } = args;
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    model.findMany({ skip, take: pageSize, where, orderBy, select, include }),
    model.count({ where }),
  ]);

  return {
    data,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
