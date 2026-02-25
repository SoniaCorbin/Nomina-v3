import OpenAI from "openai";

export type SectionKey =
  | "personnages"
  | "lieux"
  | "organizations"
  | "events"
  | "creatures"
  | "fragmentsHistoire"
  | "titres"
  | "concepts";

export interface PackInputs {
  personnage?: string;
  prenom?: string;
  nomFamille?: string;
  occupation?: string;
  categorie?: string;
  concept?: string;
  creature?: string;
  event?: string;
  fragmentsHistoire?: string;
  lieux?: string;
  organization?: string;
  classeSociale?: string;
  titre?: string;
  universThematique?: string;
}

export interface GeneratePackRequest {
  language?: string;
  enabled: Record<SectionKey, boolean>;
  counts: Record<SectionKey, number>;
  inputs?: PackInputs;
  description?: string;
}

export interface GeneratePackResult {
  personnages: unknown[];
  lieux: unknown[];
  organizations: unknown[];
  events: unknown[];
  creatures: unknown[];
  fragmentsHistoire: unknown[];
  titres: unknown[];
  concepts: unknown[];
}

export interface GeneratePackResponse {
  meta: { language: string; model: string };
  result: GeneratePackResult;
}

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

function buildSystemPrompt(language: string): string {
  const lang = language === "fr" ? "français" : language;
  return `Tu es un générateur de contenu narratif fictif pour jeux de rôle et écriture créative.
Tu génères du contenu en ${lang}.
Tu dois TOUJOURS répondre avec du JSON valide et rien d'autre (pas de texte avant ou après, pas de bloc markdown).
Respecte strictement la structure demandée dans l'instruction utilisateur.`;
}

function buildUserPrompt(req: GeneratePackRequest): string {
  const enabledSections = SECTION_KEYS.filter((k) => req.enabled[k] && (req.counts[k] ?? 0) > 0);
  const disabledSections = SECTION_KEYS.filter((k) => !req.enabled[k] || (req.counts[k] ?? 0) === 0);

  const inputsDesc = req.inputs
    ? Object.entries(req.inputs)
        .filter(([, v]) => v && String(v).trim())
        .map(([k, v]) => `  - ${k}: ${v}`)
        .join("\n")
    : "";

  const sectionsDesc = enabledSections
    .map((k) => `  - ${k}: générer exactement ${req.counts[k]} éléments`)
    .join("\n");

  const schemaDesc = SECTION_KEYS.map((k) => {
    if (disabledSections.includes(k)) {
      return `  "${k}": []`;
    }
    const exampleItem = getSectionItemSchema(k);
    return `  "${k}": [${exampleItem}]  /* exactement ${req.counts[k] ?? 0} éléments */`;
  }).join(",\n");

  return `Génère un pack narratif complet en respectant ces consignes :

${req.description ? `Description générale : ${req.description}\n` : ""}${inputsDesc ? `Champs fournis (à réutiliser ou compléter) :\n${inputsDesc}\n` : ""}
Sections à générer :
${sectionsDesc || "  (aucune section activée)"}

Sections désactivées (retourner tableau vide []) : ${disabledSections.join(", ") || "aucune"}

Retourne UNIQUEMENT un objet JSON avec cette structure exacte :
{
${schemaDesc}
}

Règles importantes :
- Les sections désactivées doivent être des tableaux vides [].
- Chaque section activée doit contenir EXACTEMENT le nombre d'éléments demandés.
- Utilise les champs fournis pour orienter la génération.
- Tout le contenu doit être en ${req.language === "fr" ? "français" : req.language ?? "français"}.
- Ne retourne AUCUN texte en dehors du JSON.`;
}

function getSectionItemSchema(section: SectionKey): string {
  switch (section) {
    case "personnages":
      return `{"prenom": "...", "nomFamille": "...", "occupation": "...", "classeSociale": "...", "description": "..."}`;
    case "lieux":
      return `{"nom": "...", "type": "...", "description": "..."}`;
    case "organizations":
      return `{"nom": "...", "type": "...", "description": "..."}`;
    case "events":
      return `{"nom": "...", "type": "...", "description": "..."}`;
    case "creatures":
      return `{"nom": "...", "type": "...", "description": "..."}`;
    case "fragmentsHistoire":
      return `{"texte": "...", "theme": "..."}`;
    case "titres":
      return `{"valeur": "...", "type": "..."}`;
    case "concepts":
      return `{"nom": "...", "description": "..."}`;
  }
}

export async function generatePack(req: GeneratePackRequest): Promise<GeneratePackResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY manquante : configurez la variable d'environnement OPENAI_API_KEY.");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const language = req.language ?? "fr";

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.8,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(language) },
      { role: "user", content: buildUserPrompt({ ...req, language }) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse OpenAI invalide : JSON non parsable.");
  }

  // Normalise le résultat: s'assure que toutes les clés sont présentes
  const result: GeneratePackResult = {
    personnages: [],
    lieux: [],
    organizations: [],
    events: [],
    creatures: [],
    fragmentsHistoire: [],
    titres: [],
    concepts: [],
  };

  for (const key of SECTION_KEYS) {
    const val = parsed[key];
    if (Array.isArray(val)) {
      result[key] = val;
    } else if (!req.enabled[key] || (req.counts[key] ?? 0) === 0) {
      result[key] = [];
    }
  }

  return {
    meta: { language, model },
    result,
  };
}
