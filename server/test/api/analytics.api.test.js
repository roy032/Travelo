import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TEST_DB_URI,
  clearDb,
  connectTestDb,
  disconnectTestDb,
  signUp,
  signUpAdmin,
} from '../helpers.js';

const { default: app } = await import('#src/app.js');
const { default: Trip } = await import('#models/trip.model.js');
const { default: ErrorEvent } = await import('#models/errorEvent.model.js');
const { errorHandler } = await import('#middlewares/error.middleware.js');

const DAY_MS = 24 * 60 * 60 * 1000;
const today = () => new Date().toISOString().slice(0, 10);

describe.skipIf(!TEST_DB_URI)('Admin analytics API', () => {
  let admin;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(async () => {
    await clearDb();
    admin = await signUpAdmin(app);
  });

  it('is only available to admins', async () => {
    const user = await signUp(app);
    const res = await user.agent.get('/api/admin/analytics');
    expect(res.status).toBe(403);
  });

  it('rejects ranges other than 7, 30 or 90 days', async () => {
    const res = await admin.agent.get('/api/admin/analytics?days=1000');
    expect(res.status).toBe(400);
  });

  it('returns one point per day with sign-ups, active trips and errors', async () => {
    await signUp(app);
    const now = Date.now();
    await Trip.create([
      // Running today
      {
        title: 'Ongoing trip',
        startDate: new Date(now - 2 * DAY_MS),
        endDate: new Date(now + 2 * DAY_MS),
        tripCategory: 'domestic',
        owner: admin.user.id,
      },
      // Ended before the range starts, so never active in it
      {
        title: 'Old trip',
        startDate: new Date(now - 60 * DAY_MS),
        endDate: new Date(now - 50 * DAY_MS),
        tripCategory: 'domestic',
        owner: admin.user.id,
      },
      // Deleted trips are not counted
      {
        title: 'Deleted trip',
        startDate: new Date(now - DAY_MS),
        endDate: new Date(now + DAY_MS),
        tripCategory: 'domestic',
        owner: admin.user.id,
        isDeleted: true,
      },
    ]);
    await ErrorEvent.create({ status: 500, method: 'GET', path: '/api/trips', message: 'boom' });

    const res = await admin.agent.get('/api/admin/analytics?days=7');

    expect(res.status).toBe(200);
    const { analytics } = res.body;
    expect(analytics.series).toHaveLength(7);
    expect(analytics.range.to).toBe(today());
    const last = analytics.series.at(-1);
    expect(last).toEqual({ date: today(), signups: 2, activeTrips: 1, errors: 1 });
    expect(analytics.totals).toEqual({ users: 2, signups: 2, activeTripsToday: 1, errors: 1 });
    expect(analytics.recentErrors[0]).toMatchObject({ status: 500, path: '/api/trips', message: 'boom' });
  });

  it('records unexpected errors from the error handler without the query string', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    errorHandler(
      new Error('database exploded'),
      { method: 'POST', originalUrl: '/api/trips?token=secret' },
      res,
      vi.fn()
    );
    expect(res.status).toHaveBeenCalledWith(500);

    await vi.waitFor(async () => {
      const events = await ErrorEvent.find().lean();
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ status: 500, method: 'POST', path: '/api/trips', message: 'database exploded' });
    });
  });
});
