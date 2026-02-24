import prisma from "../utils/prisma";
import { createRng } from "../services/generation/rng";

type Strategy = "default" | "heuristic" | "random";

function parseArgs(argv: string[]) {
  const out: Record<string, string> = {};
  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const eq = raw.indexOf("=");
    if (eq === -1) {
      out[raw.slice(2)] = "true";
    } else {
      out[raw.slice(2, eq)] = raw.slice(eq + 1);
    }
  }
  return out;
}

function normalizeName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ");
}

function inferGenreHeuristic(nameRaw: string): string {
  const n = normalizeName(nameRaw);
  if (!n) return "Neutre";

  const last = n[n.length - 1];
  // Heuristiques simples et assumées (fantasy):
  // - fin en 'a' / 'e' => plutôt féminin
  // - fin en 'o' / 'r' / 'n' / 's' => plutôt masculin
  // - sinon => neutre
  if (["a", "e"].includes(last)) return "F";
  if (["o", "r", "n", "s"].includes(last)) return "M";
  return "Neutre";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const strategy = (args.strategy ?? "default") as Strategy;
  const defaultGenre = (args.default ?? "Neutre").trim();
  const dryRun = args["dry-run"] === "true" || args.dryRun === "true";
  const seed = args.seed;
  const limit = args.limit ? Number(args.limit) : undefined;

  if (!(["default", "heuristic", "random"] as const).includes(strategy)) {
    throw new Error(
      `Invalid --strategy. Use one of: default|heuristic|random (got: ${strategy})`
    );
  }

  const where = {
    OR: [{ genre: null }, { genre: "" }],
  };

  const totalMissing = await prisma.prenom.count({ where });
  console.log(`Missing genre count: ${totalMissing}`);

  const rows = await prisma.prenom.findMany({
    where,
    select: { id: true, valeur: true },
    orderBy: { id: "asc" },
    take: limit,
  });

  if (rows.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  const rng = createRng(seed);
  const effectiveSeed = seed ?? rng.seed;

  const updates = rows.map((r) => {
    const valeur = r.valeur ?? "";

    let genre: string;
    if (strategy === "default") {
      genre = defaultGenre;
    } else if (strategy === "heuristic") {
      genre = inferGenreHeuristic(valeur) || defaultGenre;
    } else {
      // random
      const roll = rng.next();
      if (roll < 0.45) genre = "M";
      else if (roll < 0.9) genre = "F";
      else genre = "Neutre";
    }

    return { id: r.id, valeur, genre };
  });

  const preview = updates.slice(0, Math.min(10, updates.length));
  console.log(`Strategy: ${strategy}`);
  console.log(`Seed: ${effectiveSeed}`);
  console.log(`Dry-run: ${dryRun}`);
  console.log(`Will update: ${updates.length} rows`);
  console.log("Preview (first 10):");
  for (const p of preview) {
    console.log(`- #${p.id} '${p.valeur}' => ${p.genre}`);
  }

  if (dryRun) return;

  // Appliquer les mises à jour par lots pour éviter des transactions trop volumineuses.
  const batchSize = 250;
  let updated = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    await prisma.$transaction(
      batch.map((u) =>
        prisma.prenom.update({
          where: { id: u.id },
          data: { genre: u.genre },
        })
      )
    );
    updated += batch.length;
    console.log(`Updated ${updated}/${updates.length}...`);
  }

  console.log(`✅ Done. Updated ${updated} NomPersonnage rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
