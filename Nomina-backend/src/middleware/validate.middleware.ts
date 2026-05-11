import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "./error.middleware";

type Source = "body" | "query" | "params";

declare module "express-serve-static-core" {
  interface Request {
    validated?: {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };
  }
}

/**
 * Middleware générique de validation Zod. Parse une source de la requête,
 * range la valeur typée dans `req.validated[source]`, et délègue les erreurs
 * au gestionnaire centralisé.
 *
 *   const schema = z.object({ count: z.coerce.number().int().min(1).max(50) });
 *   router.get("/", validate(schema, "query"), getCultures);
 *
 *   // côté contrôleur:
 *   const { count } = req.validated!.query as z.infer<typeof schema>;
 */
export function validate<S extends ZodSchema>(schema: S, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new AppError(400, "Paramètres invalides", { issues: result.error.issues }));
    }
    req.validated = req.validated ?? {};
    req.validated[source] = result.data;
    next();
  };
}

/**
 * Helper de typage pour récupérer la valeur validée sans cast manuel répété.
 *
 *   const { count } = getValidated<typeof schema>(req, "query");
 */
export function getValidated<S extends ZodSchema>(
  req: Request,
  source: Source = "body",
): import("zod").infer<S> {
  return req.validated?.[source] as import("zod").infer<S>;
}
