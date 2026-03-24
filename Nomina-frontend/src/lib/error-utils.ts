import { ApiError } from "./api";

type ClerkErrorMeta = {
  retryAfterSeconds?: unknown;
  retry_after_seconds?: unknown;
};

type ClerkErrorDetail = {
  longMessage?: unknown;
  message?: unknown;
  meta?: ClerkErrorMeta;
};

type ClerkErrorLike = {
  message?: unknown;
  errors?: ClerkErrorDetail[];
};

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getClerkFirstError(error: unknown): ClerkErrorDetail | null {
  if (!error || typeof error !== "object") return null;

  const details = (error as ClerkErrorLike).errors;
  return Array.isArray(details) && details.length > 0 ? details[0] : null;
}

function getClerkPrimaryMessage(error: unknown, fallback: string): string {
  const details = getClerkFirstError(error);

  return (
    asNonEmptyString(details?.longMessage) ??
    asNonEmptyString(details?.message) ??
    asNonEmptyString((error as ClerkErrorLike | null)?.message) ??
    fallback
  );
}

export function getErrorMessage(error: unknown, fallback = "Une erreur est survenue."): string {
  if (error instanceof ApiError) {
    return (
      asNonEmptyString(error.payload?.error) ??
      asNonEmptyString(error.payload?.message) ??
      asNonEmptyString(error.message) ??
      fallback
    );
  }

  if (error instanceof Error) {
    return asNonEmptyString(error.message) ?? fallback;
  }

  return asNonEmptyString(error) ?? fallback;
}

export function getClerkRetryAfterSeconds(error: unknown): number | null {
  const meta = getClerkFirstError(error)?.meta;
  const rawRetryAfter = meta?.retryAfterSeconds ?? meta?.retry_after_seconds;

  return typeof rawRetryAfter === "number" && rawRetryAfter > 0 ? rawRetryAfter : null;
}

export function getClerkErrorMessage(error: unknown, fallback: string): string {
  const base = getClerkPrimaryMessage(error, fallback);
  const normalized = base.toLowerCase();

  if (
    normalized.includes("found in an online data breach") ||
    normalized.includes("compromised") ||
    normalized.includes("breached")
  ) {
    return "Ce mot de passe a déjà été compromis dans une fuite de données. Pour ta sécurité, choisis un mot de passe différent, long et unique.";
  }

  const retryAfter = getClerkRetryAfterSeconds(error);
  if (retryAfter) {
    return `${base} Réessaie dans ${retryAfter}s.`;
  }

  return base;
}

export function isClerkAlreadyVerifiedError(error: unknown): boolean {
  const message = getClerkPrimaryMessage(error, "").toLowerCase();
  return message.includes("already been verified") || message.includes("already verified");
}