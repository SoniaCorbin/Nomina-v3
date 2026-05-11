/**
 * Helpers partagés entre tous les générateurs.
 * Ne pas importer prisma ici (dépendances légères uniquement).
 */
import { z } from "zod";
import { createRng } from "./rng";

// ---------------------------------------------------------------------------
// Zod schemas réutilisables
// ---------------------------------------------------------------------------
export const countQuerySchema = z.coerce.number().int().min(1).max(200).default(10);
export const optionalIdQuerySchema = z.coerce.number().int().optional();
export const optionalStringQuerySchema = z
  .string()
  .transform((s) => s.trim())
  .optional()
  .transform((s) => (s && s.length > 0 ? s : undefined));

// ---------------------------------------------------------------------------
// Types génériques
// ---------------------------------------------------------------------------
export type GeneratedNpcIdea = {
  nameId?: number | null;
  name?: string | null;
  fullName?: string | null;
  backstory?: string | null;
  genre?: string | null;
  cultureId?: number | null;
  categorieId?: number | null;
};

export type GeneratedResponse<TItem> = {
  seed?: string | null;
  warning?: string;
  filters?: Record<string, unknown>;
  items?: TItem[];
};

export type RankedItem<TItem> = {
  item: TItem;
  score: number;
};

// ---------------------------------------------------------------------------
// Fonctions utilitaires
// ---------------------------------------------------------------------------
export function pick<T>(arr: T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function splitKeywords(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function normalizeTextKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

export function uniqueByNormalizedText<T>(items: T[], getText: (item: T) => string | null | undefined): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const raw = getText(item) ?? "";
    const key = normalizeTextKey(raw);
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function scoreKeywordMatch(text: string, keywords: string[]): number {
  const source = (text || "").toLowerCase();
  if (!source || keywords.length === 0) return 0;
  let score = 0;
  for (const kwRaw of keywords) {
    const kw = kwRaw.toLowerCase();
    if (!kw) continue;
    if (source === kw) score += 200;
    else if (source.includes(kw)) score += 60;
  }
  return score;
}

export function sampleWithoutReplacement<T>(arr: T[], k: number, rnd: () => number): T[] {
  const copy = arr.slice();
  const out: T[] = [];
  for (let i = 0; i < k && copy.length > 0; i++) {
    const idx = Math.floor(rnd() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

export function normalizeGenreValues(input: string): string[] {
  const raw = input.trim();
  if (!raw) return [];
  const lc = raw.toLowerCase();
  const m = new Set<string>();
  const add = (s: string) => { if (s && s.trim()) m.add(s); };

  if (["m", "masculin", "male", "homme"].includes(lc)) {
    ["M", "m", "Masculin", "masculin", "Male", "male", "Homme", "homme"].forEach(add);
  } else if (["f", "féminin", "feminin", "female", "femme"].includes(lc)) {
    ["F", "f", "Féminin", "féminin", "Feminin", "feminin", "Female", "female", "Femme", "femme"].forEach(add);
  } else if (["nb", "non-binaire", "non binaire", "nonbinaire", "neutre", "neutral", "neutre."].includes(lc)) {
    ["NB", "nb", "Non-binaire", "non-binaire", "Non binaire", "non binaire",
      "Nonbinaire", "nonbinaire", "Neutre", "neutre", "Neutral", "neutral"].forEach(add);
  } else if (["creature", "créature", "monster", "monstre", "beast", "bête"].includes(lc)) {
    ["Creature", "creature", "Créature", "créature", "Monster", "monster",
      "Monstre", "monstre", "Beast", "beast", "Bête", "bête"].forEach(add);
  } else {
    add(raw);
  }
  return Array.from(m);
}

export function buildGenreWhere(input?: string): { in: string[] } | undefined {
  if (input === undefined) return undefined;
  const values = normalizeGenreValues(input);
  return values.length > 0 ? { in: values } : undefined;
}

export function expandTitreKeywordTerms(keywords: string[]): string[] {
  const out = new Set<string>();
  const add = (v: string) => { const s = v.trim().toLowerCase(); if (s) out.add(s); };
  for (const kw of keywords) {
    const k = kw.trim().toLowerCase();
    if (!k) continue;
    add(k);
    if (k.includes("feu") || k.includes("incend")) {
      ["pompier", "incendie", "brasier", "flamme", "secours"].forEach(add);
    }
    if (k.includes("comba") || k.includes("guer") || k.includes("bata")) {
      ["combat", "armée", "armee", "guerrier", "soldat", "sécurité", "securite"].forEach(add);
    }
  }
  return Array.from(out);
}

export function normalizeAppliesToValues(input?: string): string[] | undefined {
  if (!input) return undefined;
  const raw = input.trim();
  if (!raw) return undefined;
  const key = raw.toLowerCase();
  const map: Record<string, string[]> = {
    npc: ["npc", "personnage", "nomPersonnage"],
    personnage: ["personnage", "nomPersonnage", "npc"],
    nompersonnage: ["nomPersonnage", "personnage", "npc"],
    lieu: ["lieu", "lieux"],
    lieux: ["lieux", "lieu"],
    objet: ["objet"],
    intrigue: ["intrigue", "quete", "quête"],
    quete: ["quete", "quête", "intrigue"],
    "quête": ["quête", "quete", "intrigue"],
    univers: ["univers"],
    fragmentshistoire: ["fragmentsHistoire"],
  };
  return map[key] ?? [raw];
}

export function toTitleCase(input: string): string {
  const s = input.trim();
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function asGeneratedResponse<TItem>(value: unknown): GeneratedResponse<TItem> {
  return value && typeof value === "object" ? (value as GeneratedResponse<TItem>) : {};
}

export function getGeneratedItems<TItem>(value: GeneratedResponse<TItem>): TItem[] {
  return Array.isArray(value.items) ? value.items : [];
}

// ---------------------------------------------------------------------------
// Générateur de concepts réalistes (brief publicitaire)
// ---------------------------------------------------------------------------
export function generateRealisticConceptIdeas(params: {
  count: number;
  seed?: string;
  topic: string;
  categorieId?: number;
  rng: ReturnType<typeof createRng>;
}) {
  const { count, seed, topic, categorieId, rng } = params;
  const effectiveSeed = seed ?? rng.seed;
  const normalizedTopic = topic.trim();
  const topicLabel = toTitleCase(normalizedTopic);

  const angles = ["durabilité", "confort", "performance", "style", "innovation",
    "accessibilité", "personnalisation", "éthique", "prix malin", "communauté"];
  const formats = ["challenge UGC", "expérience retail", "campagne social-first", "partenariat influence",
    "activation événementielle", "mini-série vidéo", "test AR / try-on",
    "programme d'ambassadeurs", "stunt PR", "produit-service (abonnement)"];
  const audiences = ["étudiants", "jeunes actifs", "sportifs", "parents", "professionnels",
    "urbains", "randonneurs", "créatifs", "fans de mode"];
  const channels = ["TikTok", "Instagram", "YouTube Shorts", "affichage (OOH)", "podcasts",
    "newsletter", "pop-up store", "partenariats locaux", "événements", "site + landing"];
  const deliverables = ["3 vidéos courtes (15–30s)", "1 landing page", "1 kit influence",
    "1 plan media", "1 concept visuel (key visual)", "1 slogan + variantes",
    "1 mécanique UGC", "1 activation terrain"];
  const verbs = ["réinventer", "simplifier", "réduire", "améliorer", "déclencher", "transformer", "réconcilier"];
  const benefits = ["le quotidien", "la mobilité", "la confiance", "la liberté",
    "le bien-être", "la créativité", "l'engagement"];
  const kpis = ["Taux de visionnage (VTR)", "CTR vers la landing", "Taux d'ajout au panier",
    "Coût par lead", "UGC créés", "Trafic en boutique"];

  const items = Array.from({ length: Math.min(count, 50) }).map((_, i) => {
    const angle = pick(angles, rng.next);
    const format = pick(formats, rng.next);
    const audience = pick(audiences, rng.next);
    const primaryChannel = pick(channels, rng.next);
    const verb = pick(verbs, rng.next);
    const benefit = pick(benefits, rng.next);

    return {
      id: `prompt-${i + 1}`,
      valeur: `${topicLabel} — ${toTitleCase(angle)}`,
      type: "Concept réaliste (brief)" as const,
      mood: "innovant" as const,
      keywords: [normalizedTopic, angle, audience, primaryChannel].join(", "),
      categorieId: categorieId ?? null,
      elevatorPitch: `Concept ${format} pour ${topicLabel}, centré sur ${angle}, ciblant ${audience}. On déclenche l'essai via ${primaryChannel}, puis on convertit avec une promesse simple et mesurable.`,
      insight: `Les gens veulent ${verb} ${benefit} sans sacrifier ${angle}.`,
      hook: `Accroche: et si vos ${normalizedTopic} prouvaient (en 10 secondes) la différence ?`,
      channels: [primaryChannel, pick(channels, rng.next), pick(channels, rng.next)].filter(Boolean),
      deliverables: [pick(deliverables, rng.next), pick(deliverables, rng.next), pick(deliverables, rng.next)],
      slogans: [
        `${topicLabel}. ${toTitleCase(angle)} qui se voit.`,
        `Marchez plus loin, pensez ${toTitleCase(angle)}.`,
        `${toTitleCase(angle)} sans compromis.`,
      ],
      kpis: [pick(kpis, rng.next), pick(kpis, rng.next), pick(kpis, rng.next)],
    };
  });

  return {
    seed: effectiveSeed,
    count: items.length,
    filters: { categorieId: categorieId ?? null, topic: normalizedTopic },
    items,
  };
}
