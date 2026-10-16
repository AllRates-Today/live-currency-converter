import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setup, Convert, Rate, Rates, Symbols } from './index';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockClear();
  vi.stubGlobal('fetch', mockFetch);
  setup({ apiKey: 'art_test_key' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function mockResponse(data: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    statusText: 'OK',
    json: () => Promise.resolve(data),
  });
}

describe('Convert', () => {
  it('converts amount with fluent API', async () => {
    // /api/v1/rates answers with an array of { rate, source, target, time }.
    mockResponse([{ rate: 0.9245, source: 'USD', target: 'EUR', time: '2026-10-16T08:00:00+0000' }]);

    const result = await Convert(100).from('USD').to('EUR');

    expect(result.amount).toBeCloseTo(92.45, 10);
    expect(result.rate).toBe(0.9245);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('EUR');
    expect(result.originalAmount).toBe(100);

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get('source')).toBe('USD');
    expect(url.searchParams.get('target')).toBe('EUR');
  });

  it('normalizes currency codes to uppercase', async () => {
    mockResponse([{ rate: 0.79, source: 'USD', target: 'GBP', time: '2026-10-16T08:00:00+0000' }]);

    await Convert(50).from('usd').to('gbp');

    const url = new URL(mockFetch.mock.calls[0][0]);
    expect(url.searchParams.get('source')).toBe('USD');
    expect(url.searchParams.get('target')).toBe('GBP');
  });

  it('throws when the allrates provider is chosen without an API key', async () => {
    setup({ provider: 'allrates' });
    await expect(Convert(100).from('USD').to('EUR')).rejects.toThrow('API key required');
  });

  it('falls back to the keyless frankfurter provider when no key is set', async () => {
    setup({});
    mockResponse({ base: 'USD', date: '2026-10-16', rates: { EUR: 0.89 } });

    const result = await Convert(100).from('USD').to('EUR');

    expect(mockFetch.mock.calls[0][0]).toContain('frankfurter');
    expect(result.rate).toBe(0.89);
  });
});

describe('Rate', () => {
  it('gets exchange rate between two currencies', async () => {
    mockResponse([{ rate: 0.9245, source: 'USD', target: 'EUR', time: '2026-10-16T08:00:00+0000' }]);

    const result = await Rate('USD').to('EUR');

    expect(result.rate).toBe(0.9245);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('EUR');
  });
});

describe('Rates', () => {
  it('gets multiple rates', async () => {
    mockResponse([
      { rate: 0.92, target: 'EUR', time: '2026-04-19T00:00:00Z' },
      { rate: 0.78, target: 'GBP', time: '2026-04-19T00:00:00Z' },
    ]);

    const rates = await Rates('USD', ['EUR', 'GBP']);

    expect(rates).toEqual({ EUR: 0.92, GBP: 0.78 });
  });

  it('handles single rate response', async () => {
    mockResponse({ rate: 0.92, target: 'EUR', time: '2026-04-19T00:00:00Z' });

    const rates = await Rates('USD', ['EUR']);

    expect(rates).toEqual({ EUR: 0.92 });
  });
});

describe('Symbols', () => {
  it('returns currency symbols', async () => {
    mockResponse({ currencies: [{ code: 'USD', name: 'United States Dollar', symbol: '$' }, { code: 'EUR', name: 'Euro', symbol: '€' }], count: 2 });

    const symbols = await Symbols();

    expect(symbols).toEqual({ USD: 'United States Dollar', EUR: 'Euro' });
  });
});

describe('authentication', () => {
  it('sends Bearer token in Authorization header', async () => {
    mockResponse([{ rate: 1.0, source: 'USD', target: 'USD', time: '2026-10-16T08:00:00+0000' }]);

    await Rate('USD').to('USD');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer art_test_key');
  });

  it('supports per-request config override', async () => {
    mockResponse([{ rate: 0.92, source: 'USD', target: 'EUR', time: '2026-10-16T08:00:00+0000' }]);

    await Convert(10, { apiKey: 'art_override_key' }).from('USD').to('EUR');

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe('Bearer art_override_key');
  });
});

describe('error handling', () => {
  it('throws on HTTP error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ error: 'Invalid API key' }),
    });

    await expect(Rate('USD').to('EUR')).rejects.toThrow('Invalid API key');
  });
});
