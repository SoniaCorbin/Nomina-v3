import {
  ApiError,
  apiFetch,
  enqueueOutbox,
  flushOutbox,
  getApiBaseUrl,
  getOutboxSize,
  setApiTokenProvider,
} from './api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('api helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    setApiTokenProvider(null);
    vi.unstubAllEnvs();
    vi.restoreAllMocks();

    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
  });

  it('returns default base URL when env is missing', () => {
    expect(getApiBaseUrl()).toBe('http://localhost:3000');
  });

  it('trims trailing slash from VITE_API_URL', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.com/');
    expect(getApiBaseUrl()).toBe('https://api.example.com');
  });

  it('stores GET response in cache and falls back to cache on network error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: async () => ({ total: 3 }),
      })
      .mockRejectedValueOnce(new Error('network down'));

    vi.stubGlobal('fetch', fetchMock);

    const first = await apiFetch<{ total: number }>('/cultures/total');
    expect(first.total).toBe(3);

    const second = await apiFetch<{ total: number }>('/cultures/total');
    expect(second.total).toBe(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('queues mutation requests while offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });

    await expect(
      apiFetch('/categories', {
        method: 'POST',
        body: { name: 'Test' },
      })
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
      payload: { queued: true },
    });

    expect(getOutboxSize()).toBe(1);
  });

  it('flushes outbox when online', async () => {
    enqueueOutbox({
      method: 'POST',
      path: '/categories',
      body: { name: 'Queued' },
      needsAuth: false,
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await flushOutbox();
    expect(result.sent).toBe(1);
    expect(result.remaining).toBe(0);
    expect(getOutboxSize()).toBe(0);
  });

  it('throws ApiError with HTTP status when response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: { get: () => 'application/json' },
        json: async () => ({ error: 'Unauthorized' }),
      })
    );

    await expect(apiFetch('/auth/me')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Unauthorized',
    });
  });

  it('creates ApiError with payload and status', () => {
    const err = new ApiError('boom', 418, { error: 'teapot' });
    expect(err.message).toBe('boom');
    expect(err.status).toBe(418);
    expect(err.payload?.error).toBe('teapot');
  });
});
