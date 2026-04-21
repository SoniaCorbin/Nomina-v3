export type ApiErrorPayload = {
  error?: string;
  message?: string;
  queued?: boolean;
};

function isLocalHostLike(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
}

export const getApiBaseUrl = (): string => {
  const primary = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  const secondary = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  const configured = primary && primary.length > 0 ? primary : secondary && secondary.length > 0 ? secondary : null;

  const browserOrigin = typeof window !== 'undefined' ? window.location.origin : null;
  const browserHost = typeof window !== 'undefined' ? window.location.hostname : null;

  if (!configured) {
    const base = (browserOrigin || 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/api`;
  }

  try {
    const parsed = new URL(configured);
    if (browserHost && !isLocalHostLike(browserHost) && isLocalHostLike(parsed.hostname)) {
      const base = (browserOrigin || configured).replace(/\/$/, '');
      return `${base}/api`;
    }

    const normalizedPath = parsed.pathname.replace(/\/$/, '');
    if (normalizedPath === '' || normalizedPath === '/') {
      parsed.pathname = '/api';
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    // ignore malformed URL and keep configured value
  }

  return configured.replace(/\/$/, '');
};

export class ApiError extends Error {
  status: number;
  payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

type TokenProvider = () => Promise<string | null>;

let tokenProvider: TokenProvider | null = null;

export function setApiTokenProvider(provider: TokenProvider | null) {
  tokenProvider = provider;
}

type CachedItem = {
  ts: number;
  ttlMs: number;
  value: unknown;
};

type OutboxItem = {
  id: string;
  ts: number;
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  needsAuth: boolean;
};

const CACHE_PREFIX = 'nomina_api_cache:v1:';
const OUTBOX_KEY = 'nomina_api_outbox:v1';
const DEFAULT_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

const now = () => Date.now();

function safeJsonParse<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function safeJsonStringify(value: unknown): string | undefined {
  try {
    return JSON.stringify(value);
  } catch {
    return undefined;
  }
}

function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore quota / disabled storage
  }
}

function storageRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function getCacheKey(url: string, hasAuth: boolean) {
  return `${CACHE_PREFIX}${hasAuth ? 'auth' : 'anon'}:${url}`;
}

function readCache(url: string, hasAuth: boolean): unknown | undefined {
  const key = getCacheKey(url, hasAuth);
  const item = safeJsonParse<CachedItem>(storageGet(key));
  if (!item) return undefined;
  if (item.ttlMs > 0 && now() - item.ts > item.ttlMs) {
    storageRemove(key);
    return undefined;
  }
  return item.value;
}

function writeCache(url: string, hasAuth: boolean, value: unknown, ttlMs: number) {
  const key = getCacheKey(url, hasAuth);
  const payload = safeJsonStringify({ ts: now(), ttlMs, value } satisfies CachedItem);
  if (!payload) return;
  storageSet(key, payload);
}

function readOutbox(): OutboxItem[] {
  return safeJsonParse<OutboxItem[]>(storageGet(OUTBOX_KEY)) ?? [];
}

function writeOutbox(items: OutboxItem[]) {
  const payload = safeJsonStringify(items);
  if (!payload) return;
  storageSet(OUTBOX_KEY, payload);
}

function randomId() {
  return `${now()}-${Math.random().toString(16).slice(2)}`;
}

export function enqueueOutbox(item: Omit<OutboxItem, 'id' | 'ts'>) {
  const items = readOutbox();
  items.push({ ...item, id: randomId(), ts: now() });
  writeOutbox(items);
}

export function getOutboxSize(): number {
  return readOutbox().length;
}

export async function flushOutbox(): Promise<{ sent: number; remaining: number }> {
  const items = readOutbox();
  if (items.length === 0) return { sent: 0, remaining: 0 };

  // Si pas de réseau, ne tente pas.
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { sent: 0, remaining: items.length };
  }

  let sent = 0;
  const remaining: OutboxItem[] = [];

  for (const item of items) {
    const headers: Record<string, string> = { ...(item.headers ?? {}) };
    if (item.body !== undefined) {
      headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
    }

    if (item.needsAuth) {
      const token = await tokenProvider?.().catch(() => null);
      if (!token) {
        // Impossible de rejouer sans token; on garde le reste (y compris cet item)
        remaining.push(item);
        continue;
      }
      headers.Authorization = `Bearer ${token}`;
    }

    const url = `${getApiBaseUrl()}${item.path.startsWith('/') ? item.path : `/${item.path}`}`;

    try {
      const res = await fetch(url, {
        method: item.method,
        headers,
        body: item.body === undefined ? undefined : JSON.stringify(item.body),
      });

      if (!res.ok) {
        // On garde la requête pour réessayer plus tard.
        remaining.push(item);
        continue;
      }
      sent++;
    } catch {
      remaining.push(item);
    }
  }

  writeOutbox(remaining);
  return { sent, remaining: remaining.length };
}

export type ApiFetchOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
  cacheTtlMs?: number;
};

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export async function apiFetch<T>(
  path: string,
  opts: ApiFetchOptions = {}
): Promise<T> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  const method = (opts.method ?? 'GET').toUpperCase();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const needsAuthWarmup = normalizedPath === '/auth/me' || normalizedPath.startsWith('/auth/admin');

  // Si aucun token n'est fourni explicitement, on tente d'en récupérer un via Clerk.
  // Ça permet de garder l'appel simple: apiFetch('/users') sans répéter getToken() partout.
  let effectiveToken = opts.token ?? null;
  if (!effectiveToken && tokenProvider) {
    effectiveToken = await tokenProvider().catch(() => null);

    if (!effectiveToken && needsAuthWarmup) {
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        effectiveToken = await tokenProvider().catch(() => null);
        if (effectiveToken) break;
      }
    }
  }

  const hasAuth = Boolean(effectiveToken);
  const cacheTtlMs = opts.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const canUseCache = !hasAuth && cacheTtlMs > 0;

  const headers: Record<string, string> = {
    ...(opts.headers ?? {}),
  };

  const isFormDataBody = typeof FormData !== 'undefined' && opts.body instanceof FormData;

  if (opts.body !== undefined && !isFormDataBody) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  if (effectiveToken) {
    headers.Authorization = `Bearer ${effectiveToken}`;
  }

  // OFFLINE: cache des GET / outbox pour mutations
  if (method === 'GET') {
    if (isOffline()) {
      const cached = canUseCache ? readCache(url, hasAuth) : undefined;
      if (cached !== undefined) return cached as T;
      throw new ApiError('Réseau indisponible (offline) et aucun cache disponible', 0);
    }
  } else {
    // Pour les mutations: si offline, on met en file d'attente.
    if (isOffline()) {
      if (isFormDataBody) {
        throw new ApiError('Hors-ligne: upload de fichier indisponible', 0);
      }
      enqueueOutbox({
        method,
        path,
        headers: Object.fromEntries(
          Object.entries(headers).filter(([k]) => k.toLowerCase() !== 'authorization')
        ),
        body: opts.body,
        needsAuth: Boolean(opts.token) || Boolean(tokenProvider),
      });
      throw new ApiError('Hors-ligne: requête mise en attente (outbox)', 0, { queued: true });
    }
  }

  const doRequest = async (requestHeaders: Record<string, string>) => {
    return fetch(url, {
      method,
      headers: requestHeaders,
      body: opts.body === undefined ? undefined : isFormDataBody ? (opts.body as FormData) : JSON.stringify(opts.body),
    });
  };

  let res: Response;
  try {
    res = await doRequest(headers);
  } catch {
    // network error: si GET, fallback cache
    if (method === 'GET') {
      const cached = canUseCache ? readCache(url, hasAuth) : undefined;
      if (cached !== undefined) return cached as T;
    }
    throw new ApiError('Erreur réseau (impossible de joindre l’API)', 0);
  }

  if (
    res.status === 401 &&
    !opts.token &&
    tokenProvider &&
    !isOffline()
  ) {
    const refreshedToken = await tokenProvider().catch(() => null);
    if (refreshedToken) {
      const retryHeaders = { ...headers, Authorization: `Bearer ${refreshedToken}` };
      try {
        res = await doRequest(retryHeaders);
      } catch {
        // On laisse ensuite la gestion d'erreur standard.
      }
    }
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => undefined) : undefined;

  if (!res.ok) {
    const msg = (payload as ApiErrorPayload | undefined)?.error || res.statusText || 'API error';
    throw new ApiError(msg, res.status, payload as ApiErrorPayload | undefined);
  }

  const noContentStatus = res.status === 204 || res.status === 205 || res.status === 304;
  if (!isJson && !noContentStatus) {
    const textBody = await res.text().catch(() => '');
    if ((textBody ?? '').trim().length > 0) {
      throw new ApiError('Réponse API invalide: JSON attendu mais contenu non-JSON reçu', 502);
    }
  }

  // Cache GET (network-first)
  if (method === 'GET' && canUseCache) {
    writeCache(url, hasAuth, payload, cacheTtlMs);
  }

  return (payload as T) ?? (undefined as T);
}
