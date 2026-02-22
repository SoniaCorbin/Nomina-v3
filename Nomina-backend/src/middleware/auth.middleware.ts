import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { isUserAdmin } from '../services/auth/adminAccess';

const devAdminUserId = () => (process.env.DEV_ADMIN_USER_ID || '').trim();
const devAdminBypassEnabled = () =>
  process.env.ALLOW_DEV_ADMIN_BYPASS === 'true' && process.env.NODE_ENV !== 'production';
const tokenClockSkewInMs = () => {
  const raw = Number(process.env.CLERK_CLOCK_SKEW_MS ?? 300_000);
  return Number.isFinite(raw) && raw >= 0 ? raw : 300_000;
};

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);
  const forcedDevAdminUserId = devAdminUserId();
  const devFallbackUserId = forcedDevAdminUserId.length > 0 ? forcedDevAdminUserId : 'dev-admin';

  if (!token) {
    if (devAdminBypassEnabled()) {
      req.auth = { userId: devFallbackUserId, sessionId: 'dev-bypass' };
      return next();
    }
    return res.status(401).json({ error: 'Authorization manquante' });
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    if (devAdminBypassEnabled()) {
      req.auth = { userId: devFallbackUserId, sessionId: 'dev-bypass' };
      return next();
    }

    console.error('CLERK_SECRET_KEY non défini');
    return res.status(500).json({
      error:
        'Configuration serveur manquante: CLERK_SECRET_KEY non défini (configure Nomina-backend/.env puis redémarre le serveur)',
    });
  }

  try {
    const { payload } = await verifyToken(token, {
      secretKey,
      clockSkewInMs: tokenClockSkewInMs(),
    });
    const p = payload as {
      sub?: unknown;
      sid?: unknown;
      email?: unknown;
      email_address?: unknown;
      primary_email_address?: unknown;
    };
    const userId = typeof p.sub === 'string' ? p.sub : null;
    if (!userId) return res.status(401).json({ error: 'Token invalide' });
    const rawEmail =
      typeof p.email === 'string'
        ? p.email
        : typeof p.email_address === 'string'
          ? p.email_address
          : typeof p.primary_email_address === 'string'
            ? p.primary_email_address
            : null;
    const email = rawEmail?.trim().toLowerCase();

    req.auth = {
      userId,
      sessionId: typeof p.sid === 'string' ? p.sid : undefined,
      email: email && email.length > 0 ? email : undefined,
    };
    next();
  } catch (err) {
    console.error('Clerk token verification failed:', err);
    if (devAdminBypassEnabled()) {
      req.auth = { userId: devFallbackUserId, sessionId: 'dev-bypass' };
      return next();
    }
    return res.status(401).json({ error: 'Token invalide ou expiré. Reconnecte-toi puis réessaie.' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (devAdminBypassEnabled()) {
    const forcedDevAdminUserId = devAdminUserId();
    if (forcedDevAdminUserId.length === 0 || req.auth?.userId === forcedDevAdminUserId) {
      return next();
    }
  }

  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const ok = await isUserAdmin(userId, req.auth?.email);
    if (!ok) return res.status(403).json({ error: 'Accès refusé' });
  } catch {
    return res.status(500).json({ error: 'Erreur de vérification des droits admin' });
  }

  next();
};