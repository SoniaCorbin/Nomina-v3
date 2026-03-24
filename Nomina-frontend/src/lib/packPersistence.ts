import { ApiError } from "./api";

export type PackSectionKey =
  | "personnages"
  | "lieux"
  | "organizations"
  | "events"
  | "creatures"
  | "fragmentsHistoire"
  | "titres"
  | "concepts";

type JsonObject = Record<string, unknown>;

export type PackResultData = Record<PackSectionKey, unknown[]>;

type PersistRequest = {
  section: PackSectionKey;
  endpoint: string;
  body: JsonObject;
};

export type PersistPackSummary = {
  attempted: number;
  created: number;
  failed: number;
  perSection: Record<PackSectionKey, { attempted: number; created: number; failed: number }>;
  errors: string[];
};

type ApiFetchLike = <T>(path: string, opts?: { method?: string; body?: unknown }) => Promise<T>;

const SECTIONS: PackSectionKey[] = [
  "personnages",
  "lieux",
  "organizations",
  "events",
  "creatures",
  "fragmentsHistoire",
  "titres",
  "concepts",
];

function asObject(input: unknown): JsonObject | null {
  return input && typeof input === "object" && !Array.isArray(input) ? (input as JsonObject) : null;
}

function asTrimmedString(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  return value.length > 0 ? value : null;
}

function mapItemToRequest(section: PackSectionKey, item: unknown): PersistRequest | null {
  const obj = asObject(item);
  if (!obj) return null;

  if (section === "personnages") {
    const valeur = asTrimmedString(obj.prenom) ?? asTrimmedString(obj.nom);
    if (!valeur) return null;
    return {
      section,
      endpoint: "/nomPersonnages",
      body: {
        valeur,
        genre: asTrimmedString(obj.genre),
      },
    };
  }

  if (section === "lieux") {
    const value = asTrimmedString(obj.nom) ?? asTrimmedString(obj.value);
    if (!value) return null;
    return {
      section,
      endpoint: "/lieux",
      body: {
        value,
        type: asTrimmedString(obj.type),
      },
    };
  }

  if (section === "organizations") {
    const name = asTrimmedString(obj.nom) ?? asTrimmedString(obj.name);
    if (!name) return null;
    return {
      section,
      endpoint: "/organizations",
      body: {
        name,
        type: asTrimmedString(obj.type),
        description: asTrimmedString(obj.description),
      },
    };
  }

  if (section === "events") {
    const title = asTrimmedString(obj.nom) ?? asTrimmedString(obj.title);
    if (!title) return null;
    return {
      section,
      endpoint: "/events",
      body: {
        title,
        summary: asTrimmedString(obj.description),
      },
    };
  }

  if (section === "creatures") {
    const valeur =
      asTrimmedString(obj.nom) ?? asTrimmedString(obj.valeur) ?? asTrimmedString(obj.name);
    if (!valeur) return null;
    return {
      section,
      endpoint: "/creatures",
      body: {
        valeur,
        type: asTrimmedString(obj.type),
        description: asTrimmedString(obj.description),
      },
    };
  }

  if (section === "fragmentsHistoire") {
    const texte = asTrimmedString(obj.texte) ?? asTrimmedString(obj.description);
    if (!texte) return null;
    return {
      section,
      endpoint: "/fragmentsHistoire",
      body: {
        texte,
        appliesTo: asTrimmedString(obj.theme),
      },
    };
  }

  if (section === "titres") {
    const valeur = asTrimmedString(obj.valeur) ?? asTrimmedString(obj.nom) ?? asTrimmedString(obj.title);
    if (!valeur) return null;
    return {
      section,
      endpoint: "/titres",
      body: {
        valeur,
        type: asTrimmedString(obj.type),
      },
    };
  }

  const valeur = asTrimmedString(obj.nom) ?? asTrimmedString(obj.valeur) ?? asTrimmedString(obj.title);
  if (!valeur) return null;
  return {
    section,
    endpoint: "/concepts",
    body: {
      valeur,
      type: asTrimmedString(obj.type),
      mood: asTrimmedString(obj.mood),
      keywords: asTrimmedString(obj.keywords),
    },
  };
}

export function buildPersistRequests(data: PackResultData): PersistRequest[] {
  const requests: PersistRequest[] = [];

  for (const section of SECTIONS) {
    for (const item of data[section] ?? []) {
      const req = mapItemToRequest(section, item);
      if (req) requests.push(req);
    }
  }

  return requests;
}

export async function persistPackResult(apiFetchFn: ApiFetchLike, data: PackResultData): Promise<PersistPackSummary> {
  const requests = buildPersistRequests(data);

  const perSection = Object.fromEntries(
    SECTIONS.map((section) => [section, { attempted: 0, created: 0, failed: 0 }])
  ) as PersistPackSummary["perSection"];

  const errors: string[] = [];

  let created = 0;
  let failed = 0;

  for (const req of requests) {
    perSection[req.section].attempted += 1;
    try {
      await apiFetchFn(req.endpoint, { method: "POST", body: req.body });
      created += 1;
      perSection[req.section].created += 1;
    } catch (error) {
      failed += 1;
      perSection[req.section].failed += 1;

      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        throw new Error("Accès refusé: connecte-toi avec un compte admin pour enregistrer ce pack.");
      }

      errors.push(`${req.section}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    attempted: requests.length,
    created,
    failed,
    perSection,
    errors,
  };
}