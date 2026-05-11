import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

type Target = "body" | "query" | "params";

/**
 * Middleware de validation Zod réutilisable.
 *
 * Usage dans une route :
 *   router.post("/", validate(mySchema), myHandler)
 *   router.get("/",  validate(querySchema, "query"), myHandler)
 *
 * En cas d'échec → 400 avec la liste des issues Zod.
 * En cas de succès → req[target] est remplacé par la valeur parsée (coercion incluse).
 */
export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      res.status(400).json({ error: "Payload invalide", issues: result.error.issues });
      return;
    }
    // Remplace par la valeur transformée (trim, coercion de types, etc.)
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
