import type { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AppError, asyncHandler } from '../middleware/error.middleware';

const USER_PUBLIC_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const ALLOWED_ROLES = new Set(['Admin', 'Editor', 'Viewer', 'AdminPending']);

const parseId = (rawId: string): number | null => {
  const id = Number(rawId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: USER_PUBLIC_SELECT,
    orderBy: { id: 'asc' },
  });
  res.json(users);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) throw new AppError(400, 'Id invalide');

  const user = await prisma.user.findUnique({ where: { id }, select: USER_PUBLIC_SELECT });
  if (!user) throw new AppError(404, 'Utilisateur non trouvé');
  res.json(user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const username = normalizeString(req.body?.username);
  const email = normalizeString(req.body?.email)?.toLowerCase() ?? null;
  const password = normalizeString(req.body?.password);
  const role = normalizeString(req.body?.role) ?? 'Editor';
  const isActive = typeof req.body?.isActive === 'boolean' ? req.body.isActive : true;

  if (!username || username.length < 3) throw new AppError(400, 'username est requis (min 3 caractères)');
  if (!email || !isValidEmail(email)) throw new AppError(400, 'email invalide');
  if (!password || password.length < 6) throw new AppError(400, 'password est requis (min 6 caractères)');
  if (!ALLOWED_ROLES.has(role)) throw new AppError(400, 'role invalide');

  const newUser = await prisma.user.create({
    data: { username, email, role, password, isActive },
    select: USER_PUBLIC_SELECT,
  });

  res.status(201).json(newUser);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) throw new AppError(400, 'Id invalide');

  const username = normalizeString(req.body?.username);
  const email = normalizeString(req.body?.email)?.toLowerCase() ?? null;
  const role = normalizeString(req.body?.role);
  const password = normalizeString(req.body?.password);
  const isActive = req.body?.isActive;

  if (email && !isValidEmail(email)) throw new AppError(400, 'email invalide');
  if (username !== null && username.length < 3) throw new AppError(400, 'username invalide (min 3 caractères)');
  if (password !== null && password.length < 6) throw new AppError(400, 'password invalide (min 6 caractères)');
  if (role && !ALLOWED_ROLES.has(role)) throw new AppError(400, 'role invalide');
  if (isActive !== undefined && typeof isActive !== 'boolean') throw new AppError(400, 'isActive doit être booléen');

  const data: {
    username?: string;
    email?: string;
    role?: string;
    password?: string;
    isActive?: boolean;
  } = {};

  if (username !== null) data.username = username;
  if (email !== null) data.email = email;
  if (role) data.role = role;
  if (password !== null) data.password = password;
  if (typeof isActive === 'boolean') data.isActive = isActive;

  if (Object.keys(data).length === 0) throw new AppError(400, 'Aucun champ à mettre à jour');

  const updatedUser = await prisma.user.update({ where: { id }, data, select: USER_PUBLIC_SELECT });
  res.json(updatedUser);
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = parseId(req.params.id);
  if (!id) throw new AppError(400, 'Id invalide');

  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});

export const totalUser = asyncHandler(async (_req: Request, res: Response) => {
  const count = await prisma.user.count();
  res.json({ total: count });
});
