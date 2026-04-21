import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { createOrUpdateAdminRequest, isUserAdmin } from '../services/auth/adminAccess';

export const meController = async (req: Request, res: Response) => {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'Non authentifié' });

    const isAdmin = await isUserAdmin(userId, req.auth?.email);
    return res.json({ userId, isAdmin });
};

export const adminPingController = (_req: Request, res: Response) => {
    return res.json({ ok: true });
};

export const createAdminRequestController = async (req: Request, res: Response) => {
    const parsed = z
        .object({
            email: z.string().email(),
            username: z.string().trim().min(2).max(80).optional(),
        })
        .safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({ error: 'Paramètres invalides', issues: parsed.error.issues });
    }

    const { email, username } = parsed.data;
    const result = await createOrUpdateAdminRequest({ email, username });
    return res.status(200).json({
        status: result.status,
        message:
            result.status === 'already-approved'
                ? 'Compte déjà approuvé comme administrateur.'
                : result.status === 'already-pending'
                    ? 'Demande administrateur déjà en attente.'
                    : 'Demande administrateur envoyée et en attente d’approbation.',
    });
};

export const listAdminRequestsController = async (_req: Request, res: Response) => {
    const items = await prisma.user.findMany({
        where: { role: 'AdminPending' },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return res.json(items);
};

export const approveAdminRequestController = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID invalide' });

    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Demande introuvable' });

    const updated = await prisma.user.update({
        where: { id },
        data: {
            role: 'Admin',
            isActive: true,
        },
    });

    return res.json({
        ok: true,
        message: 'Demande approuvée. Le compte peut accéder à l’admin.',
        user: {
            id: updated.id,
            email: updated.email,
            role: updated.role,
            isActive: updated.isActive,
        },
    });
};

export const rejectAdminRequestController = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'ID invalide' });

    const current = await prisma.user.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ error: 'Demande introuvable' });

    const updated = await prisma.user.update({
        where: { id },
        data: {
            role: 'Viewer',
            isActive: true,
        },
    });

    return res.json({
        ok: true,
        message: 'Demande refusée.',
        user: {
            id: updated.id,
            email: updated.email,
            role: updated.role,
            isActive: updated.isActive,
        },
    });
};