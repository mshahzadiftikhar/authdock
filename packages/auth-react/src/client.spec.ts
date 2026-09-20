import { describe, expect, it, vi, afterEach } from 'vitest';
import { createAuthClient } from './client';

describe('createAuthClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('always sends credentials: include — cookie sessions depend on this', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ user: {} }) });
    vi.stubGlobal('fetch', fetchMock);
    const client = createAuthClient({ baseUrl: 'http://localhost:3000/api/auth' });

    await client.getSession();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/me',
      expect.objectContaining({ credentials: 'include' }),
    );
  });

  it('builds signIn as a POST with a JSON body against /login', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ user: {} }) });
    vi.stubGlobal('fetch', fetchMock);
    const client = createAuthClient({ baseUrl: 'http://localhost:3000/api/auth' });

    await client.signIn('a@b.com', 'hunter2');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/auth/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ email: 'a@b.com', password: 'hunter2' });
  });

  it('builds verifyEmail as a GET with the token in the query string', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ message: 'ok' }) });
    vi.stubGlobal('fetch', fetchMock);
    const client = createAuthClient({ baseUrl: 'http://localhost:3000/api/auth' });

    await client.verifyEmail('a token with spaces');

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3000/api/auth/verify-email?token=a%20token%20with%20spaces');
    expect(options.method).toBeUndefined(); // GET is fetch's default
  });

  it('throws the server-provided message on a non-ok response', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 401, json: () => Promise.resolve({ message: 'Invalid credentials' }) });
    vi.stubGlobal('fetch', fetchMock);
    const client = createAuthClient({ baseUrl: 'http://localhost:3000/api/auth' });

    await expect(client.signIn('a@b.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('falls back to a generic message when the error response has no body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    });
    vi.stubGlobal('fetch', fetchMock);
    const client = createAuthClient({ baseUrl: 'http://localhost:3000/api/auth' });

    await expect(client.signIn('a@b.com', 'x')).rejects.toThrow(/failed \(500\)/);
  });
});
