import type { Request, Response } from "express";
import { z } from "zod";
import { generatePack as callGeneratePack, type SectionKey } from "../services/OpenAiService";

const SECTION_KEYS: SectionKey[] = [
  "personnages",
  "lieux",
  "organizations",
  "events",
  "creatures",
  "fragmentsHistoire",
  "titres",
  "concepts",
];

const MAX_COUNTS: Record<SectionKey, number> = {
  personnages: 5,
  lieux: 10,
  organizations: 10,
  events: 10,
  creatures: 10,
  fragmentsHistoire: 20,
  titres: 20,
  concepts: 20,
};

const SectionBoolMap = z.object(
  Object.fromEntries(SECTION_KEYS.map((k) => [k, z.boolean().default(false)])) as Record<SectionKey, z.ZodDefault<z.ZodBoolean>>
);

const SectionCountMap = z.object(
  Object.fromEntries(
    SECTION_KEYS.map((k) => [
      k,
      z
        .number()
        .int()
        .min(0)
        .max(MAX_COUNTS[k])
        .default(1),
    ])
  ) as Record<SectionKey, z.ZodDefault<z.ZodNumber>>
);

const PackInputsSchema = z.object({
  personnage: z.string().optional(),
  prenom: z.string().optional(),
  nomFamille: z.string().optional(),
  occupation: z.string().optional(),
  categorie: z.string().optional(),
  concept: z.string().optional(),
  creature: z.string().optional(),
  event: z.string().optional(),
  fragmentsHistoire: z.string().optional(),
  lieux: z.string().optional(),
  organization: z.string().optional(),
  classeSociale: z.string().optional(),
  titre: z.string().optional(),
  universThematique: z.string().optional(),
});

const GeneratePackSchema = z.object({
  language: z.string().default("fr"),
  enabled: SectionBoolMap,
  counts: SectionCountMap,
  inputs: PackInputsSchema.optional(),
  description: z.string().optional(),
});

export async function generatePackController(req: Request, res: Response): Promise<void> {
  const parsed = GeneratePackSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Corps de requête invalide", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await callGeneratePack(parsed.data);
    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("OPENAI_API_KEY")) {
      res.status(503).json({ error: message });
      return;
    }

    // OpenAI quota / rate-limit errors
    const statusCode = (err as { status?: number })?.status ?? 500;
    if (statusCode === 429) {
      res.status(429).json({ error: "Quota OpenAI dépassé. Réessayez plus tard." });
      return;
    }

    res.status(500).json({ error: `Erreur OpenAI: ${message}` });
  }
}

// Alias v4 — GeneratePackRoutes importe `generatePack`
export const generatePack = generatePackController;
