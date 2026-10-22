import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TEST_DB_URI,
  clearDb,
  connectTestDb,
  disconnectTestDb,
  futureDate,
  signUp,
  verifyUser,
} from '../helpers.js';
import { clearRateCache, FALLBACK_USD_RATES } from '#services/currency.service.js';
import { clearWeatherCache, tripDateKeys } from '#services/weather.service.js';

const { default: app } = await import('#src/app.js');

// Round numbers make the conversions easy to check: 1 EUR = 140 BDT
const RATES = { ...FALLBACK_USD_RATES, USD: 1, EUR: 0.5, BDT: 70 };

const fakeExternalApis = vi.fn(async (url) => {
  const json = (body) => ({ ok: true, status: 200, json: async () => body });
  if (url.startsWith('https://open.er-api.com/')) {
    return json({ result: 'success', rates: RATES });
  }
  if (url.includes('open-meteo.com')) {
    const params = new URL(url).searchParams;
    const dates = tripDateKeys(params.get('start_date'), params.get('end_date'));
    return json({
      daily: {
        time: dates,
        weather_code: dates.map(() => 63),
        temperature_2m_max: dates.map(() => 33),
        temperature_2m_min: dates.map(() => 26),
        precipitation_probability_max: dates.map(() => 90),
        precipitation_sum: dates.map(() => 12),
        wind_speed_10m_max: dates.map(() => 15),
        uv_index_max: dates.map(() => 9),
      },
    });
  }
  throw new Error(`Unexpected request to ${url}`);
});

describe.skipIf(!TEST_DB_URI)('Budget, currency and weather API', () => {
  let owner;
  let member;
  let third;
  let outsider;
  let tripId;

  const join = async (user) => {
    await owner.agent
      .post(`/api/trips/${tripId}/invitations`)
      .send({ email: user.user.email });
    const pending = await user.agent.get('/api/invitations/pending');
    const invitation = pending.body.invitations[0];
    await user.agent.post(`/api/invitations/${invitation.id || invitation._id}/accept`);
  };

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(async () => {
    vi.stubGlobal('fetch', fakeExternalApis);
    clearRateCache();
    clearWeatherCache();
    await clearDb();
    owner = await signUp(app, { name: 'Owner' });
    member = await signUp(app, { name: 'Member' });
    third = await signUp(app, { name: 'Third' });
    outsider = await signUp(app, { name: 'Outsider' });
    await verifyUser(owner.user.id);

    const trip = await owner.agent.post('/api/trips').send({
      title: 'Sundarbans boat trip',
      startDate: futureDate(3),
      endDate: futureDate(5),
      tripCategory: 'domestic',
      baseCurrency: 'BDT',
      budget: 30000,
    });
    expect(trip.status, JSON.stringify(trip.body)).toBe(201);
    expect(trip.body.trip).toMatchObject({ baseCurrency: 'BDT', budget: 30000 });
    tripId = trip.body.trip.id;
    await join(member);
    await join(third);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('converts foreign-currency expenses into the trip currency', async () => {
    const res = await owner.agent.post(`/api/trips/${tripId}/expenses`).send({
      amount: 10,
      currency: 'eur',
      category: 'food',
      description: 'Lunch in euros',
      payer: owner.user.id,
    });
    expect(res.status, JSON.stringify(res.body)).toBe(201);
    expect(res.body.expense).toMatchObject({
      amount: 10,
      currency: 'EUR',
      convertedAmount: 1400,
      baseCurrency: 'BDT',
      exchangeRate: 140,
      rateSource: 'open.er-api.com',
    });

    // Without a currency the trip's own is used
    const local = await owner.agent.post(`/api/trips/${tripId}/expenses`).send({
      amount: 300,
      category: 'transport',
      description: 'Rickshaw',
      payer: member.user.id,
    });
    expect(local.body.expense).toMatchObject({ currency: 'BDT', convertedAmount: 300 });

    const unsupported = await owner.agent.post(`/api/trips/${tripId}/expenses`).send({
      amount: 1,
      currency: 'XYZ',
      category: 'food',
      description: 'Bad currency',
      payer: owner.user.id,
    });
    expect(unsupported.status).toBe(400);
    expect(unsupported.body.details).toContain('Unsupported currency');
  });

  it('splits between chosen members, suggests payments and records them', async () => {
    await owner.agent.post(`/api/trips/${tripId}/expenses`).send({
      amount: 900,
      category: 'accommodation',
      description: 'Boat cabin',
      payer: owner.user.id,
    });
    // Only the owner and member shared this one
    const shared = await member.agent
      .post(`/api/trips/${tripId}/expenses`)
      .field('amount', '200')
      .field('category', 'food')
      .field('description', 'Fish dinner')
      .field('payer', member.user.id)
      .field('splitBetween', JSON.stringify([owner.user.id, member.user.id]));
    expect(shared.status, JSON.stringify(shared.body)).toBe(201);
    expect(shared.body.expense.splitBetween).toHaveLength(2);

    const notOnTrip = await owner.agent.post(`/api/trips/${tripId}/expenses`).send({
      amount: 10,
      category: 'food',
      description: 'Tea',
      payer: owner.user.id,
      splitBetween: [outsider.user.id],
    });
    expect(notOnTrip.status).toBe(400);

    let splits = await third.agent.get(`/api/trips/${tripId}/expenses/splits`);
    expect(splits.status).toBe(200);
    const byName = (body) => Object.fromEntries(body.splits.map((s) => [s.user.name, s]));
    // Shares: owner 300 + 100, member 300 + 100, third 300
    expect(byName(splits.body).Owner).toMatchObject({ totalPaid: 900, share: 400, netBalance: 500 });
    expect(byName(splits.body).Member).toMatchObject({ share: 400, netBalance: -200 });
    expect(byName(splits.body).Third).toMatchObject({ share: 300, netBalance: -300 });
    expect(splits.body).toMatchObject({
      currency: 'BDT',
      totalExpenses: 1100,
      budget: 30000,
      budgetRemaining: 28900,
    });
    expect(splits.body.byCategory[0]).toEqual({ category: 'accommodation', total: 900 });
    expect(
      splits.body.suggestedPayments.map((p) => [p.from.name, p.to.name, p.amount])
    ).toEqual([
      ['Third', 'Owner', 300],
      ['Member', 'Owner', 200],
    ]);

    // Third pays the owner back
    const paid = await third.agent
      .post(`/api/trips/${tripId}/settlements`)
      .send({ from: third.user.id, to: owner.user.id, amount: 300 });
    expect(paid.status, JSON.stringify(paid.body)).toBe(201);

    splits = await owner.agent.get(`/api/trips/${tripId}/expenses/splits`);
    expect(byName(splits.body).Third.netBalance).toBe(0);
    expect(splits.body.suggestedPayments).toHaveLength(1);
    expect(splits.body.recordedPayments).toHaveLength(1);

    // Only people involved (or the owner) can undo a payment
    const settlementId = paid.body.settlement.id;
    expect(
      (await member.agent.delete(`/api/trips/${tripId}/settlements/${settlementId}`)).status
    ).toBe(403);
    expect(
      (await outsider.agent.delete(`/api/trips/${tripId}/settlements/${settlementId}`)).status
    ).toBe(403);
    expect(
      (await owner.agent.delete(`/api/trips/${tripId}/settlements/${settlementId}`)).status
    ).toBe(200);

    const self = await owner.agent
      .post(`/api/trips/${tripId}/settlements`)
      .send({ from: owner.user.id, to: owner.user.id, amount: 5 });
    expect(self.status).toBe(400);
    const stranger = await owner.agent
      .post(`/api/trips/${tripId}/settlements`)
      .send({ from: outsider.user.id, to: owner.user.id, amount: 5 });
    expect(stranger.status).toBe(400);
  });

  it('re-converts expenses when the owner changes the trip currency', async () => {
    await owner.agent.post(`/api/trips/${tripId}/expenses`).send({
      amount: 700,
      category: 'food',
      description: 'Market',
      payer: owner.user.id,
    });

    expect(
      (await member.agent.put(`/api/trips/${tripId}`).send({ baseCurrency: 'USD' })).status
    ).toBe(403);

    const updated = await owner.agent
      .put(`/api/trips/${tripId}`)
      .send({ baseCurrency: 'USD', budget: null });
    expect(updated.status, JSON.stringify(updated.body)).toBe(200);
    expect(updated.body.trip).toMatchObject({ baseCurrency: 'USD', budget: null });

    const splits = await owner.agent.get(`/api/trips/${tripId}/expenses/splits`);
    expect(splits.body).toMatchObject({ currency: 'USD', totalExpenses: 10, budget: null });

    const expenses = await owner.agent.get(`/api/trips/${tripId}/expenses`);
    expect(expenses.body.expenses[0]).toMatchObject({
      amount: 700,
      currency: 'BDT',
      convertedAmount: 10,
      baseCurrency: 'USD',
    });
  });

  it('converts amounts for signed-in users', async () => {
    const res = await member.agent.get('/api/currency/convert?amount=2&from=EUR&to=BDT');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ converted: 280, rate: 140 });

    const rates = await member.agent.get('/api/currency/rates');
    expect(rates.body.currencies).toContain('BDT');

    expect((await member.agent.get('/api/currency/convert?from=EUR&to=NOPE')).status).toBe(400);
    expect((await (await import('supertest')).default(app).get('/api/currency/rates')).status).toBe(401);
  });

  it('returns per-day weather and a matching packing list', async () => {
    const empty = await member.agent.get(`/api/trips/${tripId}/weather`);
    expect(empty.status).toBe(200);
    expect(empty.body.hasLocation).toBe(false);
    expect(empty.body.days).toHaveLength(3);
    expect(empty.body.packing).toEqual([]);

    const activity = await owner.agent.post(`/api/trips/${tripId}/activities`).send({
      title: 'Boat departs',
      date: futureDate(3),
      time: '08:00',
      location: { name: 'Khulna', coordinates: { lat: 22.82, lng: 89.55 } },
    });
    expect(activity.status, JSON.stringify(activity.body)).toBe(201);

    const res = await member.agent.get(`/api/trips/${tripId}/weather`);
    expect(res.status).toBe(200);
    expect(res.body.days.map((d) => d.source)).toEqual(['forecast', 'forecast', 'forecast']);
    expect(res.body.days[0]).toMatchObject({
      tempMax: 33,
      description: 'Rain',
      location: { name: 'Khulna' },
    });
    const items = res.body.packing.map((p) => p.item);
    expect(items).toEqual(expect.arrayContaining(['Rain jacket', 'Sunscreen (SPF 50)']));

    // Adding them to the checklist twice does not duplicate anything
    const add = () =>
      member.agent
        .post(`/api/trips/${tripId}/packing-suggestions/add-to-checklist`)
        .send({ items });
    expect((await add()).body.data.items).toHaveLength(items.length);
    expect((await add()).body.data.skipped).toBe(items.length);

    expect((await outsider.agent.get(`/api/trips/${tripId}/weather`)).status).toBe(403);
  });
});
