import type { Request, Response } from "express";
import { z } from "zod";
import { generateNpcIdeas } from "../../services/generation/npcGenerator";
import {
  countQuerySchema,
  optionalIdQuerySchema,
  optionalStringQuerySchema,
} from "../../services/generation/generationHelpers";

export const generateNpcs = async (req: Request, res: Response) => {
  const parsed = z
    .object({
      count: countQuerySchema,
      universId: optionalIdQuerySchema,
      cultureId: optionalIdQuerySchema,
      categorieId: optionalIdQuerySchema,
      socialClassId: optionalIdQuerySchema,
      occupationId: optionalIdQuerySchema,
      organizationId: optionalIdQuerySchema,
      relationTypeId: optionalIdQuerySchema,
      eventId: optionalIdQuerySchema,
      genre: optionalStringQuerySchema,
      seed: optionalStringQuerySchema,
      keywords: optionalStringQuerySchema,
    })
    .safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({ error: "Paramètres invalides", issues: parsed.error.issues });
  }

  try {
    const result = await generateNpcIdeas(parsed.data);
    return res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("OPENAI_API_KEY")) {
      return res.status(503).json({ error: message });
    }

    const statusCode = (err as { status?: number })?.status ?? 500;
    if (statusCode === 429) {
      return res.status(429).json({ error: "Quota OpenAI dépassé. Réessayez plus tard." });
    }

    return res.status(500).json({ error: `Erreur OpenAI: ${message}` });
  }
};