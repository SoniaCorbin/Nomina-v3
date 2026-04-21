/**
 * Logger structuré minimaliste pour Nomina-backend.
 *
 * Sortie : une ligne JSON par événement, sur stdout (info/debug) ou
 * stderr (warn/error). Format stable et facile à agréger plus tard
 * (pino, Datadog, CloudWatch…) sans changer le site d'appel.
 *
 * Niveau filtré par la variable d'environnement `LOG_LEVEL`
 * (debug | info | warn | error, défaut: info).
 */

type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function currentThreshold(): number {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase() as Level;
  return LEVELS[raw] ?? LEVELS.info;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { value: err };
}

function normalizeContext(
  context: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    out[k] = v instanceof Error ? serializeError(v) : v;
  }
  return out;
}

function emit(level: Level, msg: string, context?: Record<string, unknown>): void {
  if (LEVELS[level] < currentThreshold()) return;

  const payload = {
    time: new Date().toISOString(),
    level,
    msg,
    ...(normalizeContext(context) ?? {}),
  };

  const line = JSON.stringify(payload) + "\n";
  if (level === "error" || level === "warn") {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

export const logger = {
  debug: (msg: string, context?: Record<string, unknown>) => emit("debug", msg, context),
  info: (msg: string, context?: Record<string, unknown>) => emit("info", msg, context),
  warn: (msg: string, context?: Record<string, unknown>) => emit("warn", msg, context),
  error: (msg: string, context?: Record<string, unknown>) => emit("error", msg, context),
};
