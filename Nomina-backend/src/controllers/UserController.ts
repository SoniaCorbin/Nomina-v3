import type { Request, Response } from 'express';
import prisma from '../utils/prisma';

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

const handlePrismaError = (res: Response, error: unknown, fallback = 'Erreur serveur') => {
  const code = (error as { code?: string })?.code;
  if (code === 'P2002') {
    return res.status(409).json({ error: 'Conflit: username ou email déjà utilisé' });
  }
  if (code === 'P2025') {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }
  return res.status(500).json({ error: fallback });
};

//  GET - tous les users de ma base de donnees
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: USER_PUBLIC_SELECT,
      orderBy: { id: 'asc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// GET - un user par son id
export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Id invalide' });

    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST - creer un nouveau user
export const createUser = async (req: Request, res: Response) => {
  try {
    const username = normalizeString(req.body?.username);
    const email = normalizeString(req.body?.email)?.toLowerCase() ?? null;
    const password = normalizeString(req.body?.password);
    const role = normalizeString(req.body?.role) ?? 'Editor';
    const isActive = typeof req.body?.isActive === 'boolean' ? req.body.isActive : true;

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'username est requis (min 3 caractères)' });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ error: 'email invalide' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'password est requis (min 6 caractères)' });
    }
    if (!ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: 'role invalide' });
    }

    const newUser = await prisma.user.create({
      data: { username, email, role, password, isActive },
      select: USER_PUBLIC_SELECT,
    });

    res.status(201).json(newUser);
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

// PUT - modifier un user par son id
export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Id invalide' });

    const username = normalizeString(req.body?.username);
    const email = normalizeString(req.body?.email)?.toLowerCase() ?? null;
    const role = normalizeString(req.body?.role);
    const password = normalizeString(req.body?.password);
    const isActive = req.body?.isActive;

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'email invalide' });
    }
    if (username !== null && username.length < 3) {
      return res.status(400).json({ error: 'username invalide (min 3 caractères)' });
    }
    if (password !== null && password.length < 6) {
      return res.status(400).json({ error: 'password invalide (min 6 caractères)' });
    }
    if (role && !ALLOWED_ROLES.has(role)) {
      return res.status(400).json({ error: 'role invalide' });
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive doit être booléen' });
    }

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

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: USER_PUBLIC_SELECT,
    });

    res.json(updatedUser);
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

// DELETE - supprimer un user par son
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'Id invalide' });

    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    return handlePrismaError(res, error);
  }
};

// Aggregation - obtenir le nombre total de users
export const totalUser = async (_req: Request, res: Response) => {
  try {
    const count = await prisma.user.count();
    res.json({ total: count });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};