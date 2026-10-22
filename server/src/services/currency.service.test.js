import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FALLBACK_USD_RATES,
  SUPPORTED_CURRENCIES,
  clearRateCache,
  convertAmount,
  getRates,
} from './currency.service.js';

const jsonResponse = (body, ok = true) => ({
  ok,
  status: ok ? 200 : 503,
  json: async () => body,
});

const erApiRates = { ...FALLBACK_USD_RATES, EUR: 0.9, BDT: 120 };

describe('currency service', () => {
  let warn;

  beforeEach(() => {
    clearRateCache();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    warn.mockRestore();
  });

  it('has a fallback rate for every supported currency', () => {
    SUPPORTED_CURRENCIES.forEach((code) => {
      expect(FALLBACK_USD_RATES[code]).toBeGreaterThan(0);
    });
  });

  it('uses open.er-api.com and caches the table', async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ result: 'success', rates: erApiRates })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await convertAmount(9, 'EUR', 'BDT');
    expect(result).toMatchObject({
      from: 'EUR',
      to: 'BDT',
      converted: 1200,
      source: 'open.er-api.com',
      approximate: false,
    });

    await getRates();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to Frankfurter, filling currencies the ECB does not publish', async () => {
    const fetchMock = vi.fn(async (url) =>
      url.includes('open.er-api.com')
        ? jsonResponse({}, false)
        : jsonResponse({ base: 'USD', rates: { EUR: 0.8, GBP: 0.7 } })
    );
    vi.stubGlobal('fetch', fetchMock);

    const table = await getRates();
    expect(table.source).toBe('frankfurter.dev');
    expect(table.approximate).toBe(true);
    expect(table.rates.EUR).toBe(0.8);
    expect(table.rates.BDT).toBe(FALLBACK_USD_RATES.BDT);
  });

  it('keeps working with bundled rates when every API is down', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network down');
    }));

    const result = await convertAmount(1, 'USD', 'BDT');
    expect(result.source).toBe('fallback');
    expect(result.approximate).toBe(true);
    expect(result.converted).toBe(FALLBACK_USD_RATES.BDT);
  });

  it('converts a currency to itself without a lookup', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({}, false));
    vi.stubGlobal('fetch', fetchMock);
    const result = await convertAmount(12.5, 'bdt', 'BDT');
    expect(result).toMatchObject({ rate: 1, converted: 12.5, approximate: false });
  });

  it('rejects unsupported currencies', async () => {
    await expect(convertAmount(1, 'XYZ', 'BDT')).rejects.toThrow('Unsupported currency');
  });
});
