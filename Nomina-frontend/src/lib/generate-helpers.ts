/* ── Types ── */

export type Univers = { id: number; name: string };
export type Categorie = { id: number; name: string; universId: number };
export type Culture = { id: number; name: string };
export type Concept = { id: number; valeur: string; categorieId: number | null };
export type SocialClass = { id: number; name: string; universId: number | null; categorieId: number | null; cultureId: number | null };
export type Occupation = { id: number; name: string; universId: number | null; categorieId: number | null; cultureId: number | null };
export type Organization = { id: number; name: string; universId: number | null; categorieId: number | null; cultureId: number | null };
export type RelationType = { id: number; label: string; universId: number | null; categorieId: number | null; cultureId: number | null };
export type StoryEvent = { id: number; title: string; universId: number | null; categorieId: number | null; cultureId: number | null };
export type Titre = { id: number; valeur: string; type?: string | null; genre?: string | null; cultureId?: number | null; categorieId?: number | null };

export type GenerateResultItem = {
  id?: number | string;
  name?: string | null;
  nom?: string | null;
  fullName?: string | null;
  displayName?: string | null;
  valeur?: string | null;
  value?: string | null;
  title?: string | null;
  appliesTo?: string | null;
  texte?: string | null;
  type?: string | null;
  description?: string | null;
  backstory?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  thumbnailUrl?: string | null;
  cultureId?: number | null;
  categorieId?: number | null;
  genre?: string | null;
  elevatorPitch?: string | null;
  mood?: string | null;
  universId?: number | null;
  // Personas
  prenom?: string | null;
  nomFamille?: string | null;
  age?: number | null;
  job?: string | null;
  secteur?: string | null;
  motivations?: string | null;
  frustrations?: string | null;
  citation?: string | null;
  appsFavorites?: string | null;
  comportementAchat?: string | null;
  // Naming
  slogan?: string | null;
  ton?: string | null;
  [key: string]: unknown;
};

export type GenerateResult = {
  seed?: string | null;
  count?: number;
  filters?: Record<string, unknown>;
  items?: GenerateResultItem[];
  info?: string;
  warning?: string;
};

export type GenerateWhat =
  | "npcs" | "lieux" | "nomPersonnages" | "nomFamille"
  | "fragmentsHistoire" | "titres" | "concepts"
  | "creatures" | "categories" | "cultures" | "universThematique"
  | "personas" | "naming";

export const GENERATE_OPTIONS: { value: GenerateWhat; label: string }[] = [
  { value: "npcs",             label: "Personnage complet (bio)" },
  { value: "nomPersonnages",   label: "Prénom" },
  { value: "nomFamille",       label: "Nom de famille" },
  { value: "lieux",            label: "Lieux" },
  { value: "titres",           label: "Titres" },
  { value: "concepts",         label: "Concepts" },
  { value: "fragmentsHistoire",label: "Fragments d'histoire" },
  { value: "creatures",        label: "Créatures" },
  { value: "categories",       label: "Catégories" },
  { value: "cultures",         label: "Cultures" },
  { value: "universThematique",label: "Univers thématique" },
  { value: "personas",         label: "Personas UX" },
  { value: "naming",           label: "Naming de marque" },
];

export const ENDPOINT_MAP: Record<GenerateWhat, string> = {
  npcs:              "/generate/npcs",
  lieux:             "/generate/lieux",
  nomPersonnages:    "/generate/prenoms",
  nomFamille:        "/generate/nom-famille",
  fragmentsHistoire: "/generate/fragments-histoire",
  titres:            "/generate/titres",
  concepts:          "/generate/concepts",
  creatures:         "/creatures",
  categories:        "/generate/categories",
  cultures:          "/generate/cultures",
  universThematique: "/generate/univers",
  personas:          "/generate/personas",
  naming:            "/generate/naming",
};

export const DIRECT_LIST_TYPES = new Set<GenerateWhat>(["categories", "cultures", "universThematique", "creatures"]);

/* ── Helpers ── */

export function parseTitreTypeParts(type: string | null | undefined): { theme: string | null; section: string | null } {
  if (!type) return { theme: null, section: null };
  const raw = type.trim();
  if (!raw) return { theme: null, section: null };
  const parts = raw.split("—").map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { theme: parts[0], section: parts.slice(1).join(" — ") };
  return { theme: raw, section: null };
}

export function normalizeGenreLabel(genre: string | null | undefined): "Masculin" | "Féminin" | "Neutre" | "Créature" | null {
  if (!genre) return null;
  const lc = genre.trim().toLowerCase();
  if (["m", "masculin", "male", "homme"].includes(lc)) return "Masculin";
  if (["f", "féminin", "feminin", "female", "femme"].includes(lc)) return "Féminin";
  if (["nb", "non-binaire", "non binaire", "nonbinaire", "neutre", "neutral"].includes(lc)) return "Neutre";
  if (["creature", "créature", "monster", "monstre", "beast", "bête"].includes(lc)) return "Créature";
  return null;
}

export function getTitreDescription(titre: { valeur: string; type?: string | null; genre?: string | null }): string {
  const valeur = titre.valeur.trim();
  const { theme, section } = parseTitreTypeParts(titre.type ?? null);
  const genreLabel = normalizeGenreLabel(titre.genre);
  const gs = genreLabel ? ` (${genreLabel})` : "";
  const lower = valeur.toLowerCase();
  const inTheme = (s: string) => (theme ?? "").toLowerCase().includes(s);
  const inSection = (s: string) => (section ?? "").toLowerCase().includes(s);

  if (["comte", "comtesse"].includes(lower)) return `Titre nobiliaire : dirige un comté${gs}.`;
  if (["duc", "duchesse"].includes(lower)) return `Titre nobiliaire : rang élevé, lié à un duché${gs}.`;
  if (["baron", "baronne"].includes(lower)) return `Titre nobiliaire : seigneurie locale${gs}.`;
  if (["marquis", "marquise"].includes(lower)) return `Titre nobiliaire : administration d'une marche${gs}.`;
  if (["seigneur", "dame"].includes(lower)) return `Titre féodal : autorité sur des terres${gs}.`;
  if (lower.includes("pompier") || lower.includes("sapeur")) return `Rôle de secours${gs}.`;

  if (inTheme("titres réels")) {
    if (inSection("administration") || inSection("état")) return `Fonction publique${gs}.`;
    if (inSection("armée") || inSection("sécurité")) return `Grade de sécurité${gs}.`;
    if (inSection("médecine") || inSection("santé")) return `Profession de santé${gs}.`;
    if (inSection("éducation") || inSection("recherche")) return `Rôle académique${gs}.`;
    if (inSection("industrie") || inSection("technique")) return `Métier technique${gs}.`;
    return `Titre professionnel${gs}.`;
  }

  if (inTheme("médiév")) return `Titre médiéval${gs}.`;
  if (inTheme("fantasy")) return `Titre fantasy${gs}.`;
  if (inTheme("antique")) return `Titre antique${gs}.`;
  if (inTheme("orient")) return `Titre oriental${gs}.`;
  if (inTheme("steampunk")) return `Titre steampunk${gs}.`;
  if (inTheme("futur")) return `Titre SF${gs}.`;
  if (inTheme("dracon")) return `Titre draconique${gs}.`;
  if (inTheme("relig")) return `Titre religieux${gs}.`;
  if (inTheme("maritime")) return `Titre maritime${gs}.`;
  if (inTheme("polic")) return `Titre d'enquête${gs}.`;
  if (inTheme("mafia") || inTheme("crime")) return `Titre criminel${gs}.`;
  if (inTheme("mytholog")) return `Titre mythologique${gs}.`;
  if (inTheme("post")) return `Titre post-apo${gs}.`;

  return `Titre narratif${gs}.`;
}

export function getItemTitle(item: GenerateResultItem, what: GenerateWhat): string {
  switch (what) {
    case "npcs":             return item.fullName ?? item.name ?? "Personnage";
    case "nomPersonnages":   return item.name ?? item.displayName ?? "Personnage";
    case "nomFamille":       return item.valeur?.trim() || (item.id ? `Famille #${item.id}` : "Famille");
    case "lieux":            return item.value ?? item.nom ?? "Lieu";
    case "fragmentsHistoire":return item.appliesTo ? `Fragment (${item.appliesTo})` : "Fragment";
    case "titres":           return item.valeur ?? "Titre";
    case "concepts":         return item.valeur ?? item.nom ?? "Concept";
    case "creatures":        return item.valeur ?? item.nom ?? "Créature";
    case "categories":       return item.name ?? "Catégorie";
    case "cultures":         return item.name ?? "Culture";
    case "universThematique":return item.name ?? "Univers";
    case "personas": {
      const prenom = item.prenom ?? "";
      const nomFamille = item.nomFamille ?? "";
      const full = `${prenom} ${nomFamille}`.trim();
      return full || (item.name ?? "Persona");
    }
    case "naming":           return item.nom ?? item.name ?? "Marque";
    default:                 return "Résultat";
  }
}

export function getItemDescription(item: GenerateResultItem, what: GenerateWhat): string {
  const clamp = (s: string, n = 180) => s.length > n ? `${s.slice(0, n).trim()}…` : s;
  switch (what) {
    case "npcs":             return item.backstory ? String(item.backstory) : "Biographie générée.";
    case "nomPersonnages":   return "Prénom généré.";
    case "nomFamille":       return item.cultureId ? `Famille liée à la culture #${item.cultureId}` : "Nom de famille.";
    case "lieux":            return item.type ? `Type : ${item.type}` : "Lieu prêt à intégrer.";
    case "fragmentsHistoire":return item.texte ? clamp(String(item.texte), 220) : "Fragment narratif.";
    case "titres":           return item.valeur ? getTitreDescription({ valeur: String(item.valeur), type: item.type ?? null, genre: item.genre ?? null }) : "Titre narratif.";
    case "concepts":         return item.elevatorPitch ? clamp(String(item.elevatorPitch), 220) : item.mood ? `Ambiance : ${item.mood}` : "Concept créatif.";
    case "creatures":        return item.description ? clamp(String(item.description), 220) : item.type ? `Type : ${item.type}` : "Créature narrative.";
    case "categories":       return item.description ? clamp(String(item.description), 180) : "Catégorie.";
    case "cultures":         return item.description ? clamp(String(item.description), 180) : "Culture narrative.";
    case "universThematique":return item.description ? clamp(String(item.description), 180) : "Univers thématique.";
    case "personas": {
      const parts: string[] = [];
      if (item.age)         parts.push(`${item.age} ans`);
      if (item.job)         parts.push(String(item.job));
      if (item.secteur)     parts.push(String(item.secteur));
      if (item.motivations) parts.push(`Motivations : ${clamp(String(item.motivations), 120)}`);
      if (item.frustrations)parts.push(`Frustrations : ${clamp(String(item.frustrations), 120)}`);
      if (item.citation)    parts.push(`« ${clamp(String(item.citation), 100)} »`);
      return parts.join(" · ") || "Persona UX généré.";
    }
    case "naming": {
      const parts: string[] = [];
      if (item.slogan)     parts.push(`« ${String(item.slogan)} »`);
      if (item.secteur)    parts.push(String(item.secteur));
      if (item.ton)        parts.push(`Ton : ${String(item.ton)}`);
      if (item.description)parts.push(clamp(String(item.description), 180));
      return parts.join(" · ") || "Nom de marque généré.";
    }
    default: return "";
  }
}

export function getTypeLabel(what: GenerateWhat): string {
  return GENERATE_OPTIONS.find(o => o.value === what)?.label ?? "Résultat";
}