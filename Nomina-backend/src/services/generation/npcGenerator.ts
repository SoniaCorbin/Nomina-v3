import OpenAI from "openai";
import prisma from "../../utils/prisma";
import { normalizeGenreValues } from "./generationHelpers";

// ── Types ─────────────────────────────────────────────────────────────────────

export type GenerateNpcOptions = {
  count: number;
  universId?: number;
  cultureId?: number;
  categorieId?: number;
  socialClassId?: number;
  occupationId?: number;
  organizationId?: number;
  relationTypeId?: number;
  eventId?: number;
  genre?: string;
  seed?: string;
  keywords?: string;
};

export type GeneratedNpcItem = {
  name: string;
  fullName: string;
  familyName: string | null;
  genre: string | null;
  cultureId: number | null;
  categorieId: number | null;
  role: string;
  traits: string[];
  backstory: string;
  hook: string;
};

export type GenerateNpcIdeasResult = {
  seed: string;
  count: number;
  filters: Record<string, unknown>;
  items: GeneratedNpcItem[];
  warning?: string;
};

// ── Client OpenAI ─────────────────────────────────────────────────────────────

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

// ── Contexte tiré de la base ──────────────────────────────────────────────────
// On utilise la base de données comme inspiration/contexte pour le prompt,
// plutôt que comme seule source — l'IA s'en sert pour rester cohérente avec
// l'univers existant sans être limitée à un pool fixe de noms et de phrases.

async function buildContext(options: GenerateNpcOptions) {
  const [culture, categorie, univers, socialClass, occupation, organization, event, sampleFragments] =
    await Promise.all([
      options.cultureId
        ? prisma.culture.findUnique({ where: { id: options.cultureId }, select: { name: true, description: true } })
        : null,
      options.categorieId
        ? prisma.categorie.findUnique({ where: { id: options.categorieId }, select: { name: true } })
        : null,
      options.universId
        ? prisma.universThematique.findUnique({ where: { id: options.universId }, select: { name: true } })
        : null,
      options.socialClassId
        ? prisma.socialClass.findUnique({ where: { id: options.socialClassId }, select: { name: true } })
        : null,
      options.occupationId
        ? prisma.occupation.findUnique({ where: { id: options.occupationId }, select: { name: true } })
        : null,
      options.organizationId
        ? prisma.organization.findUnique({ where: { id: options.organizationId }, select: { name: true } })
        : null,
      options.eventId
        ? prisma.event.findUnique({ where: { id: options.eventId }, select: { title: true } })
        : null,
      prisma.fragmentsHistoire.findMany({
        where: {
          OR: [{ appliesTo: null }, { appliesTo: { in: ["npc", "personnage", "nomPersonnage"] } }],
          ...(options.cultureId ? { OR: [{ cultureId: options.cultureId }, { cultureId: null }] } : {}),
        },
        select: { texte: true },
        take: 8,
      }),
    ]);

  return {
    culture: culture?.name ?? null,
    cultureDesc: culture?.description ?? null,
    categorie: categorie?.name ?? null,
    univers: univers?.name ?? null,
    socialClass: socialClass?.name ?? null,
    occupation: occupation?.name ?? null,
    organization: organization?.name ?? null,
    event: event?.title ?? null,
    fragmentInspiration: sampleFragments.map((f) => f.texte).filter(Boolean),
  };
}

// ── Prompts ───────────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `Tu es un générateur de personnages fictifs pour jeux de rôle, romans et jeux vidéo.
Tu génères du contenu en français.
Tu dois TOUJOURS répondre avec du JSON valide et rien d'autre (pas de texte avant ou après, pas de bloc markdown).
Respecte strictement la structure demandée. Chaque personnage doit être unique — évite de répéter les mêmes rôles, traits ou accroches d'un personnage à l'autre dans une même génération.`;
}

function buildUserPrompt(options: GenerateNpcOptions, context: Awaited<ReturnType<typeof buildContext>>): string {
  const count = Math.max(1, Math.min(30, options.count));
  const genreValues = options.genre ? normalizeGenreValues(options.genre) : [];

  const contextLines: string[] = [];
  if (context.univers) contextLines.push(`Univers thématique : ${context.univers}`);
  if (context.culture) contextLines.push(`Culture : ${context.culture}${context.cultureDesc ? ` — ${context.cultureDesc}` : ""}`);
  if (context.categorie) contextLines.push(`Catégorie : ${context.categorie}`);
  if (context.socialClass) contextLines.push(`Classe sociale : ${context.socialClass}`);
  if (context.occupation) contextLines.push(`Métier/occupation : ${context.occupation}`);
  if (context.organization) contextLines.push(`Organisation d'appartenance : ${context.organization}`);
  if (context.event) contextLines.push(`Événement lié : ${context.event}`);
  if (genreValues.length > 0) contextLines.push(`Genre : ${genreValues[0]}`);
  if (options.keywords) contextLines.push(`Mots-clés / thème demandé : ${options.keywords}`);

  const keywordsInstruction = options.keywords
    ? `\nIMPORTANT — instruction sur les mots-clés "${options.keywords}" :
Si ces mots-clés désignent un personnage précis (un nom propre, un surnom, une description directe comme "${options.keywords}"), alors LE PREMIER personnage généré DOIT ÊTRE ce personnage exact — pas un personnage qui le mentionne, le cherche ou le connaît. Le prénom/nom de ce premier personnage doit correspondre ou s'inspirer directement du nom donné. Les personnages suivants peuvent être liés à lui (alliés, ennemis, témoins) si pertinent, mais le premier doit l'incarner directement.
Si les mots-clés décrivent plutôt un thème ou une ambiance générale (ex: "forêt sombre", "trahison"), alors ignore cette règle et génère des personnages inspirés de ce thème.\n`
    : "";

  const inspirationBlock = context.fragmentInspiration.length > 0
    ? `\nInspiration narrative existante dans cet univers (à t'en inspirer pour le ton, pas à recopier) :\n${context.fragmentInspiration.map(t => `  - ${t}`).join("\n")}\n`
    : "";

  return `Génère ${count} personnages fictifs complets.

${contextLines.length > 0 ? `Contexte de l'univers :\n${contextLines.map(l => `  - ${l}`).join("\n")}\n` : ""}${inspirationBlock}${keywordsInstruction}
Retourne UNIQUEMENT un objet JSON avec cette structure exacte :
{
  "items": [
    {
      "prenom": "Aeryn",
      "nomFamille": "Solcrest",
      "genre": "Féminin",
      "role": "Archiviste itinérante",
      "traits": ["curieuse", "déterminée"],
      "backstory": "Biographie de 2-3 phrases, vivante et spécifique, qui mentionne un événement marquant et une motivation actuelle.",
      "hook": "Une accroche narrative courte (secret, conflit ou objectif) qui donne envie d'en savoir plus."
    }
  ]
}

Règles importantes :
- Exactement ${count} personnages dans le tableau items.
- Chaque personnage doit être DISTINCT des autres — rôles, traits et accroches variés.
- Si des mots-clés sont fournis, le thème doit transparaître clairement dans le rôle, la backstory ou l'accroche.
- Les biographies doivent être originales, spécifiques et éviter les formules génériques répétées.
- Respecte le contexte d'univers fourni si présent (culture, catégorie, classe sociale, etc.) pour la cohérence.
- Ne retourne AUCUN texte en dehors du JSON.`;
}

// ── Fonction principale ───────────────────────────────────────────────────────

export async function generateNpcIdeas(options: GenerateNpcOptions): Promise<GenerateNpcIdeasResult> {
  const client = getClient();
  const model = getModel();
  const seed = options.seed ?? `npc-${Date.now()}`;

  const context = await buildContext(options);

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.9,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(options, context) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse OpenAI invalide : JSON non parsable.");
  }

  const rawItems = Array.isArray(parsed.items) ? parsed.items : [];

  const items: GeneratedNpcItem[] = rawItems.map((it: Record<string, unknown>) => {
    const prenom = String(it.prenom ?? "Inconnu").trim();
    const nomFamille = it.nomFamille ? String(it.nomFamille).trim() : null;
    const fullName = nomFamille ? `${prenom} ${nomFamille}` : prenom;

    return {
      name: prenom,
      fullName,
      familyName: nomFamille,
      genre: it.genre ? String(it.genre) : null,
      cultureId: options.cultureId ?? null,
      categorieId: options.categorieId ?? null,
      role: String(it.role ?? "Personnage"),
      traits: Array.isArray(it.traits) ? it.traits.map(String) : [],
      backstory: String(it.backstory ?? ""),
      hook: String(it.hook ?? ""),
    };
  });

  return {
    seed,
    count: items.length,
    filters: {
      universId: options.universId ?? null,
      cultureId: options.cultureId ?? null,
      categorieId: options.categorieId ?? null,
      socialClassId: options.socialClassId ?? null,
      occupationId: options.occupationId ?? null,
      organizationId: options.organizationId ?? null,
      relationTypeId: options.relationTypeId ?? null,
      eventId: options.eventId ?? null,
      genre: options.genre ?? null,
      keywords: options.keywords ?? null,
    },
    items,
    warning: items.length === 0 ? "Aucun personnage généré." : undefined,
  };
}