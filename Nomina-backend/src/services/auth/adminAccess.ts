import { createClerkClient } from '@clerk/backend';
import prisma from '../../utils/prisma';

const getConfiguredAdminUserIds = (): string[] => {
  const csv = process.env.ADMIN_CLERK_USER_IDS;
  if (csv && csv.trim().length > 0) {
    return csv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const single = process.env.ADMIN_CLERK_USER_ID;
  return single && single.trim().length > 0 ? [single.trim()] : [];
};

const getClerkClient = () => {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  return createClerkClient({ secretKey });
};

const allowFirstAdminBootstrap = (): boolean => {
  if (process.env.BOOTSTRAP_FIRST_ADMIN === 'true') return true;
  if (process.env.BOOTSTRAP_FIRST_ADMIN === 'false') return false;
  return process.env.NODE_ENV !== 'production';
};

const resolvePrimaryEmail = (user: any): string | null => {
  const primaryId = user?.primaryEmailAddressId;
  const emailAddresses = Array.isArray(user?.emailAddresses) ? user.emailAddresses : [];

  if (primaryId) {
    const primary = emailAddresses.find((e: any) => e?.id === primaryId);
    const value = typeof primary?.emailAddress === 'string' ? primary.emailAddress.trim().toLowerCase() : '';
    if (value) return value;
  }

  const first = emailAddresses[0];
  const value = typeof first?.emailAddress === 'string' ? first.emailAddress.trim().toLowerCase() : '';
  return value || null;
};

export const getClerkUserEmail = async (userId: string): Promise<string | null> => {
  const clerk = getClerkClient();
  if (!clerk) return null;

  try {
    const user = await clerk.users.getUser(userId);
    return resolvePrimaryEmail(user);
  } catch {
    return null;
  }
};

export const isUserAdmin = async (userId: string): Promise<boolean> => {
  const configured = getConfiguredAdminUserIds();
  if (configured.includes(userId)) return true;

  const email = await getClerkUserEmail(userId);
  if (!email) return false;

  const row = await prisma.user.findUnique({ where: { email } });
  if (row) {
    return Boolean(row.isActive && row.role === 'Admin');
  }

  if (!allowFirstAdminBootstrap()) return false;

  const activeAdmins = await prisma.user.count({
    where: { role: 'Admin', isActive: true },
  });

  if (activeAdmins > 0) return false;

  const username = await makeUniqueUsername(email.split('@')[0] || 'admin');
  await prisma.user.create({
    data: {
      username,
      email,
      password: `clerk-managed-${Date.now()}`,
      role: 'Admin',
      isActive: true,
    },
  });

  return true;
};

const toBaseUsername = (candidate: string) =>
  candidate
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const makeUniqueUsername = async (preferred: string): Promise<string> => {
  const base = toBaseUsername(preferred) || `admin-request`;
  const existing = await prisma.user.findUnique({ where: { username: base }, select: { id: true } });
  if (!existing) return base;

  for (let i = 1; i <= 9999; i++) {
    const candidate = `${base}-${i}`.slice(0, 60);
    const taken = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }

  return `${base}-${Date.now()}`.slice(0, 60);
};

export const createOrUpdateAdminRequest = async (params: { email: string; username?: string }) => {
  const email = params.email.trim().toLowerCase();
  const rawUsername = (params.username || email.split('@')[0] || 'admin-request').trim();

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing?.role === 'Admin' && existing.isActive) {
    return { status: 'already-approved' as const, request: existing };
  }

  if (existing?.role === 'AdminPending') {
    return { status: 'already-pending' as const, request: existing };
  }

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'AdminPending',
        isActive: false,
      },
    });
    return { status: 'pending' as const, request: updated };
  }

  const username = await makeUniqueUsername(rawUsername);
  const created = await prisma.user.create({
    data: {
      username,
      email,
      password: `clerk-managed-${Date.now()}`,
      role: 'AdminPending',
      isActive: false,
    },
  });

  return { status: 'pending' as const, request: created };
};
