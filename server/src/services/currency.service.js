/**
 * Exchange rates from free, keyless APIs with an in-memory cache.
 *
 * Rates are kept as one table against USD and crossed for any other pair.
 * open.er-api.com covers every currency below (including BDT); Frankfurter
 * (ECB data) is the second source for the currencies it publishes. If both
 * are unreachable, a bundled table of approximate rates keeps the app working
 * and responses say so with `approximate: true`.
 */

export const SUPPORTED_CURRENCIES = [
  'AED', 'AUD', 'BDT', 'BRL', 'CAD', 'CHF', 'CNY', 'DKK', 'EUR', 'GBP',
  'HKD', 'IDR', 'INR', 'JPY', 'KRW', 'LKR', 'MVR', 'MXN', 'MYR', 'NOK',
  'NPR', 'NZD', 'PHP', 'PKR', 'QAR', 'SAR', 'SEK', 'SGD', 'THB', 'TRY',
  'USD', 'VND', 'ZAR',
];

export const isSupportedCurrency = (code) =>
  SUPPORTED_CURRENCIES.includes(String(code || '').toUpperCase());

// Approximate units per 1 USD, used only when no rate API can be reached
export const FALLBACK_USD_RATES = {
  AED: 3.67, AUD: 1.52, BDT: 122, BRL: 5.4, CAD: 1.38, CHF: 0.8, CNY: 7.1,
  DKK: 6.4, EUR: 0.86, GBP: 0.75, HKD: 7.78, IDR: 16400, INR: 88, JPY: 150,
  KRW: 1400, LKR: 302, MVR: 15.4, MXN: 18.4, MYR: 4.2, NOK: 10, NPR: 141,
  NZD: 1.73, PHP: 58, PKR: 282, QAR: 3.64, SAR: 3.75, SEK: 9.4, SGD: 1.3,
  THB: 32.5, TRY: 42, USD: 1, VND: 26300, ZAR: 17.4,
};

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 5000;

let cache = null; // { rates, source, fetchedAt, approximate, expiresAt }

const fetchJson = async (url) => {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Rate request failed with ${response.status}`);
  }
  return response.json();
};

const pickSupported = (rates) => {
  const picked = {};
  for (const code of SUPPORTED_CURRENCIES) {
    if (Number.isFinite(rates?.[code]) && rates[code] > 0) {
      picked[code] = rates[code];
    }
  }
  return picked;
};

const PROVIDERS = [
  {
    name: 'open.er-api.com',
    load: async () => {
      const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
      if (data.result !== 'success') throw new Error('Rate API returned an error');
      return pickSupported(data.rates);
    },
  },
  {
    name: 'frankfurter.dev',
    load: async () => {
      const data = await fetchJson('https://api.frankfurter.dev/v1/latest?base=USD');
      return pickSupported({ ...data.rates, USD: 1 });
    },
  },
];

/**
 * Get the USD rate table, from the cache when it is fresh.
 * Never throws: falls back to the bundled table (not cached, so the next
 * request tries the APIs again).
 */
export const getRates = async () => {
  if (cache && cache.expiresAt > Date.now()) {
    return cache;
  }

  for (const provider of PROVIDERS) {
    try {
      const rates = await provider.load();
      // Fill any gaps from the bundled table so every supported code converts
      const missing = SUPPORTED_CURRENCIES.filter((code) => !rates[code]);
      missing.forEach((code) => {
        rates[code] = FALLBACK_USD_RATES[code];
      });
      cache = {
        base: 'USD',
        rates,
        source: provider.name,
        approximate: missing.length > 0,
        fetchedAt: new Date().toISOString(),
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return cache;
    } catch (error) {
      console.warn(`Exchange rates from ${provider.name} unavailable: ${error.message}`);
    }
  }

  // Keep serving the last good table rather than the rough bundled one
  if (cache) {
    return cache;
  }

  return {
    base: 'USD',
    rates: { ...FALLBACK_USD_RATES },
    source: 'fallback',
    approximate: true,
    fetchedAt: null,
  };
};

/**
 * Rate to multiply an amount in `from` by to get `to`
 */
export const crossRate = (rates, from, to) => {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  if (fromCode === toCode) return 1;
  if (!rates[fromCode] || !rates[toCode]) {
    throw new Error('Unsupported currency');
  }
  return rates[toCode] / rates[fromCode];
};

const round = (value, places) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

/**
 * Convert an amount between two supported currencies
 * @returns {Promise<{amount:number, from:string, to:string, rate:number,
 *   converted:number, source:string, approximate:boolean, fetchedAt:string|null}>}
 */
export const convertAmount = async (amount, from, to) => {
  if (!isSupportedCurrency(from) || !isSupportedCurrency(to)) {
    throw new Error('Unsupported currency');
  }
  const table = await getRates();
  const rate = crossRate(table.rates, from, to);
  return {
    amount,
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    rate: round(rate, 6),
    converted: round(amount * rate, 2),
    source: from.toUpperCase() === to.toUpperCase() ? 'identity' : table.source,
    approximate: from.toUpperCase() === to.toUpperCase() ? false : table.approximate,
    fetchedAt: table.fetchedAt,
  };
};

// Tests reset the cache between cases
export const clearRateCache = () => {
  cache = null;
};
