import { Prisma } from "@prisma/client";

export function isKnownPrismaError(
  error: unknown,
  code: Prisma.PrismaClientKnownRequestError["code"]
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}