import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
const { default: Trip } = await import('#models/trip.model.js');
const { default: Note } = await import('#models/note.model.js');
const { purgeDeletedTrips } = await import('#src/jobs/purgeDeletedTrips.js');

const DAY = 24 * 60 * 60 * 1000;

describe.skipIf(!TEST_DB_URI)('Purging deleted trips', () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(clearDb);

  it('removes trips deleted over 30 days ago with their content, and keeps newer ones', async () => {
    const { agent, user } = await signUp(app);
    await verifyUser(user.id);
    const make = async (title) => {
      const res = await agent.post('/api/trips').send({
        title,
        startDate: futureDate(10),
        endDate: futureDate(12),
        tripCategory: 'domestic',
      });
      const id = res.body.trip.id;
      await agent.post(`/api/trips/${id}/notes`).send({ content: 'note', visibility: 'shared' });
      expect((await agent.delete(`/api/trips/${id}`)).status).toBe(200);
      return id;
    };
    const old = await make('Old trip');
    const recent = await make('Recent trip');
    await Trip.updateOne({ _id: old }, { deletedAt: new Date(Date.now() - 31 * DAY) });

    expect(await purgeDeletedTrips()).toBe(1);
    expect(await Trip.findById(old)).toBeNull();
    expect(await Note.countDocuments({ trip: old })).toBe(0);
    expect(await Trip.findById(recent)).not.toBeNull();
    expect(await Note.countDocuments({ trip: recent })).toBe(1);
  });
});
