export function isKnownPrismaError(
  error: unknown,
  code: string
): boolean {
  if (
    error !== null &&
    typeof error === "object" &&
    "code" in error
  ) {
    return (error as { code: string }).code === code;
  }
  return false;
}