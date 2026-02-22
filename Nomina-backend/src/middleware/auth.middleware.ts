import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { isUserAdmin } from '../services/auth/adminAccess';

const devAdminUserId = () => (process.env.DEV_ADMIN_USER_ID || '').trim();
const devAdminBypassEnabled = () =>
  process.env.ALLOW_DEV_ADMIN_BYPASS === 'true' && devAdminUserId().length > 0;

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);

  if (!token) {
    if (devAdminBypassEnabled()) {
      req.auth = { userId: devAdminUserId(), sessionId: 'dev-bypass' };
      return next();
    }
    return res.status(401).json({ error: 'Authorization manquante' });
  }

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    if (devAdminBypassEnabled()) {
      req.auth = { userId: devAdminUserId(), sessionId: 'dev-bypass' };
      return next();
    }

    console.error('CLERK_SECRET_KEY non défini');
    return res.status(500).json({
      error:
        'Configuration serveur manquante: CLERK_SECRET_KEY non défini (configure Nomina-backend/.env puis redémarre le serveur)',
    });
  }

  try {
    const { payload } = await verifyToken(token, { secretKey });
    const p = payload as { sub?: unknown; sid?: unknown };
    const userId = typeof p.sub === 'string' ? p.sub : null;
    if (!userId) return res.status(401).json({ error: 'Token invalide' });

    req.auth = {
      userId,
      sessionId: typeof p.sid === 'string' ? p.sid : undefined,
    };
    next();
  } catch (err) {
    console.error('Clerk token verification failed:', err);
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (devAdminBypassEnabled() && req.auth?.userId === devAdminUserId()) {
    return next();
  }

  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Non authentifié' });

  try {
    const ok = await isUserAdmin(userId);
    if (!ok) return res.status(403).json({ error: 'Accès refusé' });
  } catch {
    return res.status(500).json({ error: 'Erreur de vérification des droits admin' });
  }

  next();
};