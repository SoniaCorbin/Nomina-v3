import OpenAI from "openai";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PersonaItem {
  prenom: string;
  nomFamille: string;
  age: number;
  job: string;
  secteur: string;
  motivations: string;
  frustrations: string;
  citation: string;
  appsFavorites?: string;
  comportementAchat?: string;
}

export interface NamingItem {
  nom: string;
  slogan: string;
  secteur: string;
  ton: string;
  description: string;
}

export interface GeneratePersonasRequest {
  count?: number;
  secteur?: string;
  ageMin?: number;
  ageMax?: number;
  keywords?: string;
  language?: string;
}

export interface GenerateNamingRequest {
  count?: number;
  secteur?: string;
  ton?: string;
  keywords?: string;
  langue?: string;
  language?: string;
}

export interface GeneratePersonasResponse {
  meta: { language: string; model: string };
  seed: string;
  count: number;
  items: PersonaItem[];
}

export interface GenerateNamingResponse {
  meta: { language: string; model: string };
  seed: string;
  count: number;
  items: NamingItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY manquante : configurez la variable d'environnement OPENAI_API_KEY.");
  }
  return new OpenAI({ apiKey });
}

function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

// ── Personas ──────────────────────────────────────────────────────────────────

function buildPersonasSystemPrompt(language: string): string {
  const lang = language === "fr" ? "français" : language;
  return `Tu es un expert UX spécialisé dans la création de personas utilisateurs fictifs réalistes.
Tu génères du contenu en ${lang}.
Tu dois TOUJOURS répondre avec du JSON valide et rien d'autre (pas de texte avant ou après, pas de bloc markdown).
Respecte strictement la structure demandée.`;
}

function buildPersonasUserPrompt(req: GeneratePersonasRequest): string {
  const count = Math.max(1, Math.min(20, req.count ?? 5));
  const filters: string[] = [];
  if (req.secteur) filters.push(`Secteur/industrie cible : ${req.secteur}`);
  if (req.ageMin || req.ageMax) filters.push(`Tranche d'âge : ${req.ageMin ?? 18}–${req.ageMax ?? 65} ans`);
  if (req.keywords) filters.push(`Mots-clés : ${req.keywords}`);

  return `Génère ${count} personas utilisateurs fictifs réalistes pour des projets UX/UI.

${filters.length > 0 ? `Contraintes :\n${filters.map(f => `  - ${f}`).join("\n")}\n` : ""}
Retourne UNIQUEMENT un objet JSON avec cette structure exacte :
{
  "items": [
    {
      "prenom": "Marie",
      "nomFamille": "Tremblay",
      "age": 34,
      "job": "Directrice marketing",
      "secteur": "Technologie",
      "motivations": "Gagner du temps, automatiser les tâches répétitives, avoir des données fiables.",
      "frustrations": "Les outils trop complexes, le manque de support, les mises à jour fréquentes.",
      "citation": "Je veux un outil qui fait le travail sans que j'aie à tout configurer.",
      "appsFavorites": "Slack, Notion, Google Analytics",
      "comportementAchat": "Recherche des avis, compare 3-4 options, décide en équipe."
    }
  ]
}

Règles :
- Exactement ${count} personas dans le tableau items.
- Les personas doivent être variés (âge, genre, secteur, niveau tech).
- Les motivations et frustrations doivent être spécifiques et réalistes.
- La citation doit sonner comme quelque chose que la personne dirait vraiment.
- Tout le contenu en ${req.language === "fr" ? "français" : req.language ?? "français"}.
- Ne retourne AUCUN texte en dehors du JSON.`;
}

export async function generatePersonas(req: GeneratePersonasRequest): Promise<GeneratePersonasResponse> {
  const client = getClient();
  const model = getModel();
  const language = req.language ?? "fr";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.85,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildPersonasSystemPrompt(language) },
      { role: "user", content: buildPersonasUserPrompt({ ...req, language }) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse OpenAI invalide : JSON non parsable.");
  }

  const items = Array.isArray(parsed.items) ? (parsed.items as PersonaItem[]) : [];

  return {
    meta: { language, model },
    seed: req.keywords ?? req.secteur ?? "persona",
    count: items.length,
    items,
  };
}

// ── Naming ────────────────────────────────────────────────────────────────────

function buildNamingSystemPrompt(language: string): string {
  const lang = language === "fr" ? "français" : language;
  return `Tu es un expert en naming et branding créatif.
Tu génères des noms de marques fictives originaux, mémorables et distinctifs.
Tu génères du contenu en ${lang}.
Tu dois TOUJOURS répondre avec du JSON valide et rien d'autre (pas de texte avant ou après, pas de bloc markdown).
Respecte strictement la structure demandée.`;
}

function buildNamingUserPrompt(req: GenerateNamingRequest): string {
  const count = Math.max(1, Math.min(20, req.count ?? 5));
  const filters: string[] = [];
  if (req.secteur) filters.push(`Secteur/industrie : ${req.secteur}`);
  if (req.ton) filters.push(`Ton souhaité : ${req.ton}`);
  if (req.keywords) filters.push(`Mots-clés / inspiration : ${req.keywords}`);
  if (req.langue) filters.push(`Langue du nom : ${req.langue}`);

  return `Génère ${count} noms de marques fictives créatifs pour des projets de naming et branding.

${filters.length > 0 ? `Contraintes :\n${filters.map(f => `  - ${f}`).join("\n")}\n` : ""}
Retourne UNIQUEMENT un objet JSON avec cette structure exacte :
{
  "items": [
    {
      "nom": "Lumara",
      "slogan": "La clarté, à portée de main.",
      "secteur": "Technologie / Bien-être",
      "ton": "Doux, inspirant, moderne",
      "description": "Marque fictive positionnée sur les applications de méditation et de productivité. Le nom évoque la lumière et l'aura."
    }
  ]
}

Règles :
- Exactement ${count} noms de marques dans le tableau items.
- Les noms doivent être originaux, prononçables et mémorables.
- Varier les styles : néologismes, mots composés, noms évocateurs, acronymes créatifs.
- Le slogan doit être court (max 8 mots) et percutant.
- La description doit expliquer le positionnement et l'étymologie du nom.
- Tout le contenu en ${req.language === "fr" ? "français" : req.language ?? "français"}.
- Ne retourne AUCUN texte en dehors du JSON.`;
}

export async function generateNaming(req: GenerateNamingRequest): Promise<GenerateNamingResponse> {
  const client = getClient();
  const model = getModel();
  const language = req.language ?? "fr";

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildNamingSystemPrompt(language) },
      { role: "user", content: buildNamingUserPrompt({ ...req, language }) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse OpenAI invalide : JSON non parsable.");
  }

  const items = Array.isArray(parsed.items) ? (parsed.items as NamingItem[]) : [];

  return {
    meta: { language, model },
    seed: req.keywords ?? req.secteur ?? "naming",
    count: items.length,
    items,
  };
}