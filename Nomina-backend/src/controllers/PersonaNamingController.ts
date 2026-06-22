import type { Request, Response } from "express";
import { z } from "zod";
import { generatePersonas, generateNaming } from "../services/PersonaNamingService";

// ── Schemas de validation ─────────────────────────────────────────────────────

const PersonasSchema = z.object({
  count:    z.coerce.number().int().min(1).max(20).default(5),
  secteur:  z.string().optional(),
  ageMin:   z.coerce.number().int().min(13).max(100).optional(),
  ageMax:   z.coerce.number().int().min(13).max(100).optional(),
  keywords: z.string().optional(),
  language: z.string().default("fr"),
});

const NamingSchema = z.object({
  count:    z.coerce.number().int().min(1).max(20).default(5),
  secteur:  z.string().optional(),
  ton:      z.string().optional(),
  keywords: z.string().optional(),
  langue:   z.string().optional(),
  language: z.string().default("fr"),
});

// ── Controllers ───────────────────────────────────────────────────────────────

export async function generatePersonasController(req: Request, res: Response): Promise<void> {
  const parsed = PersonasSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Paramètres invalides", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await generatePersonas(parsed.data);
    res.json(result);
  } catch (err: unknown) {
    handleOpenAiError(err, res);
  }
}

export async function generateNamingController(req: Request, res: Response): Promise<void> {
  const parsed = NamingSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Paramètres invalides", details: parsed.error.flatten() });
    return;
  }

  try {
    const result = await generateNaming(parsed.data);
    res.json(result);
  } catch (err: unknown) {
    handleOpenAiError(err, res);
  }
}

// ── Helper erreurs OpenAI ─────────────────────────────────────────────────────

function handleOpenAiError(err: unknown, res: Response): void {
  const message = err instanceof Error ? err.message : String(err);

  if (message.includes("OPENAI_API_KEY")) {
    res.status(503).json({ error: message });
    return;
  }

  const statusCode = (err as { status?: number })?.status ?? 500;
  if (statusCode === 429) {
    res.status(429).json({ error: "Quota OpenAI dépassé. Réessayez plus tard." });
    return;
  }

  res.status(500).json({ error: `Erreur OpenAI: ${message}` });
}