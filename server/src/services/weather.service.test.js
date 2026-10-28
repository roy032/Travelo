import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  assignDayLocations,
  clearWeatherCache,
  getTripWeather,
  sameDayLastYear,
  tripDateKeys,
} from './weather.service.js';

const dhaka = { name: 'Dhaka', coordinates: { lat: 23.81, lng: 90.41 } };
const sylhet = { name: 'Sylhet', coordinates: { lat: 24.89, lng: 91.87 } };

const daily = (dates, overrides = {}) => ({
  daily: {
    time: dates,
    weather_code: dates.map(() => 61),
    temperature_2m_max: dates.map(() => 31.24),
    temperature_2m_min: dates.map(() => 24),
    precipitation_sum: dates.map(() => 5),
    wind_speed_10m_max: dates.map(() => 12),
    ...overrides,
  },
});

// Answers an Open-Meteo URL with data for every date it asks for
const openMeteo = (handler) =>
  vi.fn(async (url) => {
    const params = new URL(url).searchParams;
    const start = params.get('start_date');
    const end = params.get('end_date');
    const dates = tripDateKeys(start, end);
    return { ok: true, status: 200, json: async () => handler(url, dates) };
  });

describe('trip dates and locations', () => {
  it('lists every trip date', () => {
    expect(tripDateKeys('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
  });

  it('caps very long trips', () => {
    expect(tripDateKeys('2026-01-01', '2026-12-31')).toHaveLength(31);
  });

  it('maps 29 February to the 28th of the previous year', () => {
    expect(sameDayLastYear('2028-02-29')).toBe('2027-02-28');
    expect(sameDayLastYear('2027-07-04')).toBe('2026-07-04');
  });

  it('uses each day’s activity, or the nearest day with one', () => {
    const days = tripDateKeys('2026-11-01', '2026-11-05');
    const locations = assignDayLocations(days, [
      { date: '2026-11-02T00:00:00Z', location: dhaka },
      { date: '2026-11-04T00:00:00Z', location: sylhet },
      { date: '2026-11-04T00:00:00Z', location: { name: 'No coordinates' } },
    ]);
    expect(locations['2026-11-01'].name).toBe('Dhaka');
    expect(locations['2026-11-02'].name).toBe('Dhaka');
    // Tie between the 2nd and 4th: stay where the traveller already is
    expect(locations['2026-11-03'].name).toBe('Dhaka');
    expect(locations['2026-11-04'].name).toBe('Sylhet');
    expect(locations['2026-11-05'].name).toBe('Sylhet');
  });
});

describe('getTripWeather', () => {
  const now = new Date('2026-10-22T09:00:00Z');
  let warn;

  beforeEach(() => {
    clearWeatherCache();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    warn.mockRestore();
  });

  it('uses the forecast near today and last year’s weather further out', async () => {
    const fetchMock = openMeteo((url, dates) => daily(dates));
    vi.stubGlobal('fetch', fetchMock);

    // 6 Nov is the last forecast day (today + 15)
    const result = await getTripWeather(
      { startDate: '2026-11-05', endDate: '2026-11-08' },
      [{ date: '2026-11-05', location: dhaka }],
      { now }
    );

    expect(result.days.map((d) => d.source)).toEqual([
      'forecast',
      'forecast',
      'typical',
      'typical',
    ]);
    expect(result.days[0]).toMatchObject({
      date: '2026-11-05',
      tempMax: 31.2,
      description: 'Light rain',
      location: { name: 'Dhaka' },
    });
    expect(result.days[2].basedOn).toBe('2025-11-07');

    const urls = fetchMock.mock.calls.map(([url]) => url);
    expect(urls.some((u) => u.startsWith('https://api.open-meteo.com/v1/forecast'))).toBe(true);
    expect(
      urls.some(
        (u) =>
          u.startsWith('https://archive-api.open-meteo.com') &&
          u.includes('start_date=2025-11-07')
      )
    ).toBe(true);
  });

  it('marks days unavailable when Open-Meteo cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline');
    }));

    const result = await getTripWeather(
      { startDate: '2026-10-25', endDate: '2026-10-26' },
      [{ date: '2026-10-25', location: dhaka }],
      { now }
    );
    expect(result.hasLocation).toBe(true);
    expect(result.days.map((d) => d.source)).toEqual(['unavailable', 'unavailable']);
  });

  it('geocodes a place name when no activity has coordinates', async () => {
    const fetchMock = openMeteo((url, dates) =>
      url.includes('geocoding-api')
        ? { results: [{ name: "Cox's Bazar", latitude: 21.43, longitude: 92.01 }] }
        : daily(dates)
    );
    // The geocoding URL has no dates, so answer it separately
    fetchMock.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        results: [{ name: "Cox's Bazar", latitude: 21.43, longitude: 92.01 }],
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await getTripWeather(
      { startDate: '2026-10-24', endDate: '2026-10-24' },
      [{ date: '2026-10-24', location: { name: "Cox's Bazar" } }],
      { now }
    );
    expect(result.locations).toEqual([{ name: "Cox's Bazar", lat: 21.43, lng: 92.01 }]);
    expect(result.days[0].source).toBe('forecast');
  });

  it('reports no location when nothing can be placed', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const result = await getTripWeather(
      { startDate: '2026-10-24', endDate: '2026-10-25' },
      [],
      { now }
    );
    expect(result.hasLocation).toBe(false);
    expect(result.days.every((d) => d.source === 'no-location')).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
});
