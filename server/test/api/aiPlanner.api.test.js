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

const { default: app } = await import('#src/app.js');
const { setPlannerClient } = await import('#services/aiPlanner.service.js');

const fakeClient = (respond) => {
  const parse = vi.fn(respond);
  return { client: { beta: { messages: { parse } } }, parse };
};

const activity = (overrides = {}) => ({
  title: 'Tea estate walk',
  time: '09:30',
  description: 'Guided walk through the estate.',
  locationName: 'Malnicherra Tea Garden',
  address: 'Airport Rd',
  country: 'Bangladesh',
  lat: 24.92,
  lng: 91.87,
  estimatedCost: 5,
  ...overrides,
});

describe.skipIf(!TEST_DB_URI)('AI itinerary planner API', () => {
  let owner;
  let outsider;
  let tripId;
  const start = futureDate(20);
  const second = futureDate(21);

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  afterEach(() => setPlannerClient(null));
  beforeEach(async () => {
    await clearDb();
    owner = await signUp(app, { name: 'Owner' });
    outsider = await signUp(app, { name: 'Outsider' });
    await verifyUser(owner.user.id);
    const trip = await owner.agent.post('/api/trips').send({
      title: 'Sylhet tea gardens',
      startDate: start,
      endDate: futureDate(22),
      tripCategory: 'domestic',
    });
    tripId = trip.body.trip.id;
  });

  it('reports itself disabled without an API key', async () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const status = await owner.agent.get('/api/ai-planner/status');
      expect(status.body.enabled).toBe(false);

      const res = await owner.agent
        .post(`/api/trips/${tripId}/ai-plan`)
        .send({ destination: 'Sylhet' });
      expect(res.status).toBe(503);
    } finally {
      if (previous !== undefined) process.env.ANTHROPIC_API_KEY = previous;
    }
  });

  it('returns a cleaned-up plan for the trip dates', async () => {
    const { client, parse } = fakeClient(async () => ({
      stop_reason: 'end_turn',
      parsed_output: {
        summary: 'Three green days.',
        days: [
          {
            date: second,
            theme: 'Lakes',
            activities: [
              activity({ title: 'Ratargul boat ride', time: '14:00' }),
              activity({ title: 'Breakfast', time: '8:15' }),
            ],
          },
          // Outside the trip, dropped
          { date: futureDate(40), theme: 'Extra', activities: [activity()] },
          {
            date: start,
            theme: 'Tea',
            activities: [activity(), activity({ time: '25:00' }), activity({ lat: 200 })],
          },
        ],
        estimatedTotalPerPerson: 60,
        tips: ['Book boats early'],
      },
    }));
    setPlannerClient(client);

    const res = await owner.agent.post(`/api/trips/${tripId}/ai-plan`).send({
      destination: 'Sylhet',
      budget: { amount: 100, currency: 'usd' },
      interests: ['nature', 'food'],
      pace: 'relaxed',
    });

    expect(res.status).toBe(200);
    const { plan } = res.body;
    expect(plan.currency).toBe('USD');
    expect(plan.days.map((d) => d.date)).toEqual([start, second]);
    expect(plan.days[0].activities).toHaveLength(1);
    expect(plan.days[1].activities.map((a) => a.time)).toEqual(['08:15', '14:00']);
    expect(plan.days[0].activities[0].location.coordinates).toEqual({
      lat: 24.92,
      lng: 91.87,
    });

    const request = parse.mock.calls[0][0];
    expect(request.model).toBe('claude-opus-5-5');
    expect(request.fallbacks).toBe('default');
    expect(request.messages[0].content).toContain('Budget: 100 USD');
    expect(request.messages[0].content).toContain('Interests: nature, food');
  });

  it('validates the request and keeps outsiders out', async () => {
    const { client, parse } = fakeClient();
    setPlannerClient(client);

    const invalid = await owner.agent
      .post(`/api/trips/${tripId}/ai-plan`)
      .send({ destination: 'S', budget: { amount: -1, currency: 'dollars' } });
    expect(invalid.status).toBe(400);

    const forbidden = await outsider.agent
      .post(`/api/trips/${tripId}/ai-plan`)
      .send({ destination: 'Sylhet' });
    expect(forbidden.status).toBe(403);
    expect(parse).not.toHaveBeenCalled();
  });

  it('turns a refusal into a clear error', async () => {
    const { client } = fakeClient(async () => ({
      stop_reason: 'refusal',
      parsed_output: null,
    }));
    setPlannerClient(client);

    const res = await owner.agent
      .post(`/api/trips/${tripId}/ai-plan`)
      .send({ destination: 'Sylhet' });
    expect(res.status).toBe(422);
  });

  it('adds the chosen activities to the itinerary', async () => {
    const chosen = {
      title: 'Tea estate walk',
      description: 'Guided walk.',
      date: start,
      time: '09:30',
      location: {
        name: 'Malnicherra Tea Garden',
        address: '',
        country: 'Bangladesh',
        coordinates: { lat: 24.92, lng: 91.87 },
      },
    };

    const res = await owner.agent
      .post(`/api/trips/${tripId}/ai-plan/apply`)
      .send({ activities: [chosen, { ...chosen, time: '15:00' }] });
    expect(res.status).toBe(201);
    expect(res.body.activities).toHaveLength(2);

    const list = await owner.agent.get(`/api/trips/${tripId}/activities`);
    expect(JSON.stringify(list.body)).toContain('Tea estate walk');

    const outside = await owner.agent
      .post(`/api/trips/${tripId}/ai-plan/apply`)
      .send({ activities: [{ ...chosen, date: futureDate(60) }] });
    expect(outside.status).toBe(400);

    const forbidden = await outsider.agent
      .post(`/api/trips/${tripId}/ai-plan/apply`)
      .send({ activities: [chosen] });
    expect(forbidden.status).toBe(403);
  });
});
