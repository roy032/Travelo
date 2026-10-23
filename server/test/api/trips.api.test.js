import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
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

const tripBody = (overrides = {}) => ({
  title: 'Cox’s Bazar weekend',
  description: 'Sun and sea',
  startDate: futureDate(10),
  endDate: futureDate(12),
  tripCategory: 'domestic',
  destinationType: 'beach',
  ...overrides,
});

const createTrip = async (agent, overrides) => {
  const res = await agent.post('/api/trips').send(tripBody(overrides));
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body.trip;
};

describe.skipIf(!TEST_DB_URI)('Trips API', () => {
  let owner;
  let other;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(async () => {
    await clearDb();
    owner = await signUp(app, { name: 'Owner' });
    other = await signUp(app, { name: 'Other' });
    await verifyUser(owner.user.id);
    await verifyUser(other.user.id);
  });

  describe('create', () => {
    it('creates a trip with the owner as the only member', async () => {
      const trip = await createTrip(owner.agent);
      expect(trip.title).toBe('Cox’s Bazar weekend');
      expect(trip.members).toHaveLength(1);
      expect(trip.owner.name).toBe('Owner');
    });

    it('creates a trip without a destination type', async () => {
      const { destinationType, ...body } = tripBody();
      const res = await owner.agent.post('/api/trips').send(body);
      expect(res.status).toBe(201);
      expect(destinationType).toBe('beach');
    });

    it('requires verification for the trip category', async () => {
      const unverified = await signUp(app);
      const res = await unverified.agent.post('/api/trips').send(tripBody());
      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/verify your NID/);
    });

    it('rejects an end date before the start date', async () => {
      const res = await owner.agent
        .post('/api/trips')
        .send(tripBody({ startDate: futureDate(5), endDate: futureDate(2) }));
      expect(res.status).toBe(400);
      expect(res.body.details).toMatch(/End date/);
    });

    it('returns the custom message for an invalid trip category', async () => {
      const res = await owner.agent
        .post('/api/trips')
        .send(tripBody({ tripCategory: 'space' }));
      expect(res.status).toBe(400);
      expect(res.body.details).toMatch(/domestic or international/);
    });

    it('requires authentication', async () => {
      const res = await request(app).post('/api/trips').send(tripBody());
      expect(res.status).toBe(401);
    });
  });

  describe('read and list', () => {
    it('lists only the trips the user belongs to, with filters and search', async () => {
      await createTrip(owner.agent, { title: 'Upcoming mountains' });
      await createTrip(owner.agent, {
        title: 'Past city break',
        startDate: '2020-01-01',
        endDate: '2020-01-03',
      });
      await createTrip(other.agent, { title: 'Someone else’s trip' });

      const all = await owner.agent.get('/api/trips');
      expect(all.body.trips.map((t) => t.title).sort()).toEqual([
        'Past city break',
        'Upcoming mountains',
      ]);

      const upcoming = await owner.agent.get('/api/trips?filter=upcoming');
      expect(upcoming.body.trips.map((t) => t.title)).toEqual([
        'Upcoming mountains',
      ]);

      const past = await owner.agent.get('/api/trips?filter=past');
      expect(past.body.trips.map((t) => t.title)).toEqual(['Past city break']);

      const search = await owner.agent.get('/api/trips?search=MOUNT');
      expect(search.body.trips).toHaveLength(1);

      // Regex metacharacters are treated literally
      const regex = await owner.agent.get('/api/trips?search=.*');
      expect(regex.body.trips).toHaveLength(0);
    });

    it('hides trip details from non-members', async () => {
      const trip = await createTrip(owner.agent);
      const res = await other.agent.get(`/api/trips/${trip.id}`);
      expect(res.status).toBe(403);
    });

    it('returns 400 for a malformed trip id and 404 for a missing trip', async () => {
      const bad = await owner.agent.get('/api/trips/not-an-id');
      expect(bad.status).toBe(400);

      const missing = await owner.agent.get('/api/trips/0123456789abcdef01234567');
      expect(missing.status).toBe(404);
    });
  });

  describe('update and delete', () => {
    it('lets only the owner update a trip', async () => {
      const trip = await createTrip(owner.agent);

      const denied = await other.agent
        .put(`/api/trips/${trip.id}`)
        .send({ title: 'Hijacked' });
      expect(denied.status).toBe(403);

      const ok = await owner.agent
        .put(`/api/trips/${trip.id}`)
        .send({ title: 'Renamed trip' });
      expect(ok.status).toBe(200);
      expect(ok.body.trip.title).toBe('Renamed trip');
    });

    it('soft-deletes a trip so it disappears from lists and explore', async () => {
      const trip = await createTrip(owner.agent);

      const del = await owner.agent.delete(`/api/trips/${trip.id}`);
      expect(del.status).toBe(200);

      const list = await owner.agent.get('/api/trips');
      expect(list.body.trips).toHaveLength(0);

      const explore = await request(app).get('/api/trips/explore');
      expect(explore.body.trips).toHaveLength(0);

      const detail = await owner.agent.get(`/api/trips/${trip.id}`);
      expect(detail.status).toBe(404);
    });
  });

  describe('explore', () => {
    it('lists upcoming trips publicly and leaves out past ones', async () => {
      await createTrip(owner.agent, { title: 'Future trip' });
      await createTrip(owner.agent, {
        title: 'Old trip',
        startDate: '2020-01-01',
        endDate: '2020-01-02',
      });

      const res = await request(app).get('/api/trips/explore');
      expect(res.status).toBe(200);
      expect(res.body.trips.map((t) => t.title)).toEqual(['Future trip']);
      expect(res.body.trips[0]).toMatchObject({
        destinationType: 'beach',
        ownerId: owner.user.id,
      });
    });
  });

  describe('joining a trip', () => {
    it('sends a join request that the owner can accept', async () => {
      const trip = await createTrip(owner.agent);

      const join = await other.agent.post(`/api/trips/${trip.id}/join-request`);
      expect(join.status).toBe(200);

      const duplicate = await other.agent.post(
        `/api/trips/${trip.id}/join-request`
      );
      expect(duplicate.status).toBe(409);

      const requests = await owner.agent.get(`/api/trips/${trip.id}/join-requests`);
      expect(requests.status).toBe(200);
      expect(requests.body.requests).toHaveLength(1);
      const requestId = requests.body.requests[0]._id;

      // Only the owner can accept
      const denied = await other.agent.post(
        `/api/trips/${trip.id}/join-requests/${requestId}/accept`
      );
      expect(denied.status).toBe(403);

      const accept = await owner.agent.post(
        `/api/trips/${trip.id}/join-requests/${requestId}/accept`
      );
      expect(accept.status).toBe(200);

      const detail = await other.agent.get(`/api/trips/${trip.id}`);
      expect(detail.status).toBe(200);
      expect(detail.body.trip.members).toHaveLength(2);

      // Accepted requests no longer show up
      const after = await owner.agent.get(`/api/trips/${trip.id}/join-requests`);
      expect(after.body.requests).toHaveLength(0);
    });

    it('lets the owner reject a join request, after which the user can ask again', async () => {
      const trip = await createTrip(owner.agent);
      await other.agent.post(`/api/trips/${trip.id}/join-request`);
      const requests = await owner.agent.get(`/api/trips/${trip.id}/join-requests`);
      const requestId = requests.body.requests[0]._id;

      const reject = await owner.agent.post(
        `/api/trips/${trip.id}/join-requests/${requestId}/reject`
      );
      expect(reject.status).toBe(200);

      const after = await owner.agent.get(`/api/trips/${trip.id}/join-requests`);
      expect(after.body.requests).toHaveLength(0);

      const detail = await other.agent.get(`/api/trips/${trip.id}`);
      expect(detail.status).toBe(403);

      const again = await other.agent.post(`/api/trips/${trip.id}/join-request`);
      expect(again.status).toBe(200);
    });

    it('still blocks a duplicate request after the owner reads the notification', async () => {
      const trip = await createTrip(owner.agent);
      await other.agent.post(`/api/trips/${trip.id}/join-request`);
      await owner.agent.patch('/api/notifications/read-all');

      const duplicate = await other.agent.post(
        `/api/trips/${trip.id}/join-request`
      );
      expect(duplicate.status).toBe(409);
    });

    it('requires verification to request joining', async () => {
      const trip = await createTrip(owner.agent);
      const unverified = await signUp(app);
      const res = await unverified.agent.post(`/api/trips/${trip.id}/join-request`);
      expect(res.status).toBe(403);
    });

    it('stops the owner from requesting to join their own trip', async () => {
      const trip = await createTrip(owner.agent);
      const res = await owner.agent.post(`/api/trips/${trip.id}/join-request`);
      expect(res.status).toBe(400);
    });

    it('returns 400 for a malformed trip id', async () => {
      const res = await other.agent.post('/api/trips/not-an-id/join-request');
      expect(res.status).toBe(400);
    });
  });

  describe('invitations', () => {
    it('invites a user by email who can accept and become a member', async () => {
      const trip = await createTrip(owner.agent);

      const invite = await owner.agent
        .post(`/api/trips/${trip.id}/invitations`)
        .send({ email: other.user.email });
      expect(invite.status, JSON.stringify(invite.body)).toBe(201);

      const pending = await other.agent.get('/api/invitations/pending');
      expect(pending.status).toBe(200);
      expect(pending.body.invitations).toHaveLength(1);
      const invitationId =
        pending.body.invitations[0].id || pending.body.invitations[0]._id;

      const preview = await other.agent.get(
        `/api/invitations/${invitationId}/preview`
      );
      expect(preview.status).toBe(200);

      const accept = await other.agent.post(
        `/api/invitations/${invitationId}/accept`
      );
      expect(accept.status).toBe(200);

      const members = await other.agent.get(`/api/trips/${trip.id}/members`);
      expect(members.status).toBe(200);
      expect(members.body.members).toHaveLength(2);
    });

    it('does not let another user accept someone else’s invitation', async () => {
      const trip = await createTrip(owner.agent);
      await owner.agent
        .post(`/api/trips/${trip.id}/invitations`)
        .send({ email: other.user.email });
      const pending = await other.agent.get('/api/invitations/pending');
      const invitationId =
        pending.body.invitations[0].id || pending.body.invitations[0]._id;

      const intruder = await signUp(app);
      const res = await intruder.agent.post(
        `/api/invitations/${invitationId}/accept`
      );
      expect(res.status).toBe(403);
    });

    it('rejects inviting an unknown email or an existing member', async () => {
      const trip = await createTrip(owner.agent);

      const unknown = await owner.agent
        .post(`/api/trips/${trip.id}/invitations`)
        .send({ email: 'ghost@example.com' });
      expect(unknown.status).toBe(404);

      const self = await owner.agent
        .post(`/api/trips/${trip.id}/invitations`)
        .send({ email: owner.user.email });
      expect([400, 409]).toContain(self.status);
    });

    it('lets the owner remove a member but not themselves', async () => {
      const trip = await createTrip(owner.agent);
      await owner.agent
        .post(`/api/trips/${trip.id}/invitations`)
        .send({ email: other.user.email });
      const pending = await other.agent.get('/api/invitations/pending');
      const invitationId =
        pending.body.invitations[0].id || pending.body.invitations[0]._id;
      await other.agent.post(`/api/invitations/${invitationId}/accept`);

      const removeSelf = await owner.agent.delete(
        `/api/trips/${trip.id}/members/${owner.user.id}`
      );
      expect(removeSelf.status).toBe(400);

      const remove = await owner.agent.delete(
        `/api/trips/${trip.id}/members/${other.user.id}`
      );
      expect(remove.status).toBe(200);

      const detail = await other.agent.get(`/api/trips/${trip.id}`);
      expect(detail.status).toBe(403);
    });
  });
});
