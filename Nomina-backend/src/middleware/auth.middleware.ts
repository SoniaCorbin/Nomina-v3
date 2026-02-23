import type { Request, Response, NextFunction } from 'express';
import { createClerkClient, verifyToken } from '@clerk/backend';
import { isUserAdmin } from '../services/auth/adminAccess';

const normalizeSecretKey = (value: string | undefined): string => {
  if (!value) return '';
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const tokenClockSkewInMs = () => {
  const raw = Number(process.env.CLERK_CLOCK_SKEW_MS ?? 300_000);
  return Number.isFinite(raw) && raw >= 0 ? raw : 300_000;
};

const tokenAuthorizedParties = () => {
  const envList = (process.env.CLERK_AUTHORIZED_PARTIES ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const fallback = [
    process.env.FRONTEND_URL?.trim(),
    'https://nomina-v3.vercel.app',
    'http://localhost:5173',
  ].filter((value): value is string => Boolean(value));

  const merged = [...envList, ...fallback];
  return Array.from(new Set(merged));
};

const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length < 2) return null;

  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

const fallbackValidateSession = async (token: string, secretKey: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const sid = typeof payload.sid === 'string' ? payload.sid : null;
  const userId = typeof payload.sub === 'string' ? payload.sub : null;
  if (!sid || !userId) return null;

  const clerk = createClerkClient({ secretKey });

  try {
    const session = await clerk.sessions.getSession(sid);
    if (!session) return null;
    if (session.userId !== userId) return null;
    if (session.status && session.status !== 'active') return null;

    const rawEmail =
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload.email_address === 'string'
          ? payload.email_address
          : typeof payload.primary_email_address === 'string'
            ? payload.primary_email_address
            : null;

    return {
      userId,
      sessionId: sid,
      email: typeof rawEmail === 'string' && rawEmail.trim().length > 0 ? rawEmail.trim().toLowerCase() : undefined,
    };
  } catch {
    return null;
  }
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Authorization manquante' });
  }

  const secretKey = normalizeSecretKey(process.env.CLERK_SECRET_KEY);
  if (!secretKey) {
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
    const message = err instanceof Error ? err.message : String(err);
    console.error('Clerk token verification failed:', {
      message,
      fallbackAuthorizedParties: tokenAuthorizedParties(),
    });

    const fallbackAuth = await fallbackValidateSession(token, secretKey);
    if (fallbackAuth) {
      req.auth = fallbackAuth;
      return next();
    }

    return res.status(401).json({ error: 'Token invalide ou expiré. Reconnecte-toi puis réessaie.' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
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