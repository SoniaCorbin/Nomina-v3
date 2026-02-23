import prisma from "../utils/prisma";
import { fragmentsHistoire } from "./data/fragments-histoire";
import fs from "fs";
import path from "path";
import type { FragmentSeed } from "./data/fragments-histoire";

type ImportFragment = FragmentSeed & {
  cultureId?: number | null;
  categorieId?: number | null;
};

export type ImportFragmentsHistoireOptions = {
  apply?: boolean;
  filePath?: string;
};

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function getArgValue(name: string): string | null {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  if (!match) return null;
  const value = match.slice(prefix.length).trim();
  return value.length > 0 ? value : null;
}

function parseOptionalInt(value: unknown): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeFragmentInput(item: unknown, index: number): ImportFragment {
  const source = item as Record<string, unknown>;
  const texte = typeof source?.texte === "string" ? source.texte.trim() : "";
  if (!texte) {
    throw new Error(`Fragment invalide à l'index ${index}: "texte" requis`);
  }

  return {
    texte,
    appliesTo: typeof source.appliesTo === "string" ? source.appliesTo.trim() || null : null,
    genre: typeof source.genre === "string" ? source.genre.trim() || null : null,
    minNameLength: parseOptionalInt(source.minNameLength),
    maxNameLength: parseOptionalInt(source.maxNameLength),
    cultureId: parseOptionalInt(source.cultureId),
    categorieId: parseOptionalInt(source.categorieId),
  };
}

function parseLineBasedFragments(raw: string, absolutePath: string): ImportFragment[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: ImportFragment[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "[" || line === "]") continue;

    const candidate = line.endsWith(",") ? line.slice(0, -1).trim() : line;
    if (!candidate.startsWith("{") || !candidate.endsWith("}")) {
      skipped.push(`${i + 1}`);
      continue;
    }

    try {
      const obj = JSON.parse(candidate);
      parsed.push(normalizeFragmentInput(obj, parsed.length));
    } catch {
      skipped.push(`${i + 1}`);
    }
  }

  if (parsed.length === 0) {
    throw new Error(
      `Impossible de parser ${absolutePath}. Fournis un tableau JSON valide ou une ligne JSON par fragment.`
    );
  }

  if (skipped.length > 0) {
    console.log(
      `Lignes ignorées (${skipped.length}) dans ${absolutePath}: ${skipped.slice(0, 12).join(", ")}${
        skipped.length > 12 ? "…" : ""
      }`
    );
  }

  return parsed;
}

function loadFragmentsFromFile(filePath: string): ImportFragment[] {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Fichier introuvable: ${absolutePath}`);
  }

  const raw = fs.readFileSync(absolutePath, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return parseLineBasedFragments(raw, absolutePath);
  }

  if (!Array.isArray(parsed)) {
    return parseLineBasedFragments(raw, absolutePath);
  }

  return parsed.map((item, index) => normalizeFragmentInput(item, index));
}

export async function importFragmentsHistoire(options: ImportFragmentsHistoireOptions = {}) {
  const apply = options.apply ?? false;
  const filePath = options.filePath?.trim() || null;
  const sourceFragments: ImportFragment[] = filePath
    ? loadFragmentsFromFile(filePath)
    : fragmentsHistoire.map((f) => ({ ...f, cultureId: null, categorieId: null }));

  console.log("--- Import fragments d'histoire ---");
  if (filePath) {
    console.log(`Source externe: ${filePath}`);
  }

  const textes = sourceFragments.map((f) => f.texte);

  // Dédupe simple par texte (pas de contrainte unique en DB)
  const existing = new Set<string>();
  const rows = await prisma.fragmentsHistoire.findMany({
    where: { texte: { in: textes } },
    select: { texte: true },
  });
  for (const r of rows) existing.add(r.texte);

  const seenInInput = new Set<string>();
  const dedupedInput = sourceFragments.filter((f) => {
    if (seenInInput.has(f.texte)) return false;
    seenInInput.add(f.texte);
    return true;
  });

  const toInsert = dedupedInput.filter((f) => !existing.has(f.texte));

  console.log(`Fragments détectés: ${sourceFragments.length}`);
  if (sourceFragments.length !== dedupedInput.length) {
    console.log(`Doublons ignorés dans l'input: ${sourceFragments.length - dedupedInput.length}`);
  }
  console.log(`Nouveaux fragments à insérer: ${toInsert.length}`);

  if (!apply) {
    console.log("Mode DRY-RUN (aucune insertion). Ajoute --apply pour insérer.");
    for (const f of toInsert.slice(0, 10)) {
      console.log(`+ ${f.texte.slice(0, 80)}${f.texte.length > 80 ? "…" : ""}`);
    }
    if (toInsert.length > 10) console.log(`… +${toInsert.length - 10} autres`);
    return;
  }

  // On ajoute quelques fragments "ciblés" sur une culture/catégorie si elles existent,
  // pour que les filtres cultureId/categorieId puissent aussi retourner des résultats.
  const firstCulture = await prisma.culture.findFirst({ orderBy: { id: "asc" } });
  const firstCategorie = await prisma.categorie.findFirst({ orderBy: { id: "asc" } });

  let inserted = 0;

  for (const f of toInsert) {
    await prisma.fragmentsHistoire.create({
      data: {
        texte: f.texte,
        appliesTo: f.appliesTo ?? null,
        genre: f.genre ?? null,
        minNameLength: f.minNameLength ?? null,
        maxNameLength: f.maxNameLength ?? null,
        cultureId: f.cultureId ?? null,
        categorieId: f.categorieId ?? null,
      },
    });
    inserted++;
  }

  // Fragments supplémentaires ciblés (idempotents via texte distinct)
  const targeted: Array<{ texte: string; cultureId?: number | null; categorieId?: number | null }> = [];

  if (firstCulture) {
    targeted.push(
      {
        texte: "Dans cette culture, les anciens disent qu'un nom mal prononcé peut attirer des années de malchance.",
        cultureId: firstCulture.id,
      },
      {
        texte: "Le rite de passage laisse une marque discrète; ceux qui la portent sont reconnus sans un mot.",
        cultureId: firstCulture.id,
      }
    );
  }

  if (firstCategorie) {
    targeted.push(
      {
        texte: "Dans cette catégorie d'univers, un secret se transmet en silence: par gestes et par regards.",
        categorieId: firstCategorie.id,
      },
      {
        texte: "On raconte que le symbole de cette catégorie n'a pas été créé… il a été découvert.",
        categorieId: firstCategorie.id,
      }
    );
  }

  if (firstCulture && firstCategorie) {
    targeted.push({
      texte: "Ici, les traditions et l'univers se heurtent: un compromis fragile maintient la paix depuis des générations.",
      cultureId: firstCulture.id,
      categorieId: firstCategorie.id,
    });
  }

  for (const t of targeted) {
    const exists = await prisma.fragmentsHistoire.findFirst({ where: { texte: t.texte }, select: { id: true } });
    if (exists) continue;
    await prisma.fragmentsHistoire.create({
      data: {
        texte: t.texte,
        appliesTo: "univers",
        genre: null,
        cultureId: t.cultureId ?? null,
        categorieId: t.categorieId ?? null,
      },
    });
    inserted++;
  }

  console.log(`Insertion terminée: ${inserted} fragments ajoutés.`);
}

async function main() {
  const apply = hasFlag("apply");
  const filePath = getArgValue("file") ?? undefined;
  await importFragmentsHistoire({ apply, filePath });
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error("Import fragments d'histoire: erreur", err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
