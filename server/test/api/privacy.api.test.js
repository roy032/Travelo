import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  TEST_DB_URI,
  clearDb,
  connectTestDb,
  disconnectTestDb,
  futureDate,
  signUp,
  signUpAdmin,
  verifyUser,
} from '../helpers.js';

const { default: app } = await import('#src/app.js');
const { default: User } = await import('#models/user.model.js');
const { default: Trip } = await import('#models/trip.model.js');
const { default: Message } = await import('#models/message.model.js');
const { default: Note } = await import('#models/note.model.js');

const createTrip = async (agent, title) => {
  const res = await agent.post('/api/trips').send({
    title,
    startDate: futureDate(20),
    endDate: futureDate(23),
    tripCategory: 'domestic',
  });
  expect(res.status, JSON.stringify(res.body)).toBe(201);
  return res.body.trip.id;
};

const addMember = async (owner, member, tripId) => {
  await owner.agent
    .post(`/api/trips/${tripId}/invitations`)
    .send({ email: member.user.email });
  const pending = await member.agent.get('/api/invitations/pending');
  const invitation = pending.body.invitations[0];
  const res = await member.agent.post(
    `/api/invitations/${invitation.id || invitation._id}/accept`
  );
  expect(res.status, JSON.stringify(res.body)).toBe(200);
};

describe.skipIf(!TEST_DB_URI)('Sessions, data export and account deletion', () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(clearDb);

  describe('sessions', () => {
    it('signs out every device with sign-out-everywhere', async () => {
      const { agent, credentials } = await signUp(app);
      const laptop = request.agent(app);
      await laptop.post('/api/auth/sign-in').send(credentials);
      expect((await laptop.get('/api/profile')).status).toBe(200);

      const res = await agent.post('/api/auth/sign-out-everywhere');
      expect(res.status).toBe(200);

      expect((await laptop.get('/api/profile')).status).toBe(401);
      expect((await agent.get('/api/profile')).status).toBe(401);

      // Signing in again works
      const fresh = request.agent(app);
      expect((await fresh.post('/api/auth/sign-in').send(credentials)).status).toBe(200);
      expect((await fresh.get('/api/profile')).status).toBe(200);
    });

    it('keeps this session but ends others after a password change', async () => {
      const { agent, credentials } = await signUp(app);
      const phone = request.agent(app);
      await phone.post('/api/auth/sign-in').send(credentials);

      const res = await agent.put('/api/profile').send({
        currentPassword: credentials.password,
        newPassword: 'a-new-password-1',
      });
      expect(res.status).toBe(200);

      expect((await agent.get('/api/profile')).status).toBe(200);
      expect((await phone.get('/api/profile')).status).toBe(401);
    });

    it('ends the sessions of a blocked user right away', async () => {
      const admin = await signUpAdmin(app);
      const user = await signUp(app);
      expect((await user.agent.get('/api/profile')).status).toBe(200);

      const res = await admin.agent
        .patch(`/api/admin/users/${user.user.id}/block`)
        .send({ blocked: true });
      expect(res.status).toBe(200);

      expect((await user.agent.get('/api/profile')).status).toBe(401);
    });

    it('applies a role change without signing in again', async () => {
      const admin = await signUpAdmin(app);
      const user = await signUp(app);
      expect((await user.agent.get('/api/admin/users')).status).toBe(403);

      await admin.agent
        .patch(`/api/admin/users/${user.user.id}/role`)
        .send({ role: 'admin' });
      expect((await user.agent.get('/api/admin/users')).status).toBe(200);

      await admin.agent
        .patch(`/api/admin/users/${user.user.id}/role`)
        .send({ role: 'user' });
      expect((await user.agent.get('/api/admin/users')).status).toBe(403);
    });
  });

  describe('data export', () => {
    it('downloads the account and its content as JSON without secrets', async () => {
      const owner = await signUp(app, { name: 'Exporter' });
      await verifyUser(owner.user.id);
      const tripId = await createTrip(owner.agent, 'Cox’s Bazar');
      await owner.agent
        .post(`/api/trips/${tripId}/notes`)
        .send({ content: 'Pack sunscreen', visibility: 'private' });

      const res = await owner.agent.get('/api/profile/export');
      expect(res.status).toBe(200);
      expect(res.headers['content-disposition']).toMatch(
        /attachment; filename="travelo-data-\d{4}-\d{2}-\d{2}\.json"/
      );
      expect(res.headers['cache-control']).toBe('no-store');

      const data = JSON.parse(res.text);
      expect(data.account).toMatchObject({ name: 'Exporter', email: owner.user.email });
      expect(data.trips).toHaveLength(1);
      expect(data.trips[0]).toMatchObject({ title: 'Cox’s Bazar', role: 'owner' });
      expect(data.notes[0].content).toBe('Pack sunscreen');
      expect(res.text).not.toMatch(/password|tokenVersion|\$2[aby]\$/i);
    });

    it('requires sign-in', async () => {
      expect((await request(app).get('/api/profile/export')).status).toBe(401);
    });
  });

  describe('account deletion', () => {
    it('needs the right password', async () => {
      const { agent } = await signUp(app);
      const res = await agent.delete('/api/profile').send({ password: 'wrong-password' });
      expect(res.status).toBe(400);
      expect((await agent.get('/api/profile')).status).toBe(200);
    });

    it('deletes solo trips, hands shared trips on and anonymises shared records', async () => {
      const leaver = await signUp(app, { name: 'Leaver' });
      const friend = await signUp(app, { name: 'Friend' });
      await verifyUser(leaver.user.id);
      await verifyUser(friend.user.id);

      const soloTrip = await createTrip(leaver.agent, 'Solo hike');
      const sharedTrip = await createTrip(leaver.agent, 'Group beach trip');
      await addMember(leaver, friend, sharedTrip);

      await leaver.agent
        .post(`/api/trips/${sharedTrip}/messages`)
        .send({ text: 'See you there' });
      await leaver.agent
        .post(`/api/trips/${sharedTrip}/notes`)
        .send({ content: 'My secret', visibility: 'private' });
      await leaver.agent
        .post(`/api/trips/${sharedTrip}/notes`)
        .send({ title: 'Hotel', content: 'Booked the hotel', visibility: 'shared' });
      const expense = await leaver.agent.post(`/api/trips/${sharedTrip}/expenses`).send({
        amount: 1000,
        category: 'accommodation',
        description: 'Hotel',
        payer: leaver.user.id,
      });
      expect(expense.status, JSON.stringify(expense.body)).toBe(201);

      const res = await leaver.agent
        .delete('/api/profile')
        .send({ password: leaver.credentials.password });
      expect(res.status, JSON.stringify(res.body)).toBe(200);
      expect(res.body).toMatchObject({ deletedTrips: 1, transferredTrips: 1 });

      // Signed out, and the account can't sign in again
      expect((await leaver.agent.get('/api/profile')).status).toBe(401);
      const signIn = await request(app)
        .post('/api/auth/sign-in')
        .send(leaver.credentials);
      expect(signIn.status).toBe(401);

      // The email address can be used for a new account
      await signUp(app, { email: leaver.user.email });

      // Personal data is gone; a placeholder keeps shared records readable
      const placeholder = await User.findById(leaver.user.id).lean();
      expect(placeholder).toMatchObject({ name: 'Deleted user' });
      expect(placeholder.email).not.toBe(leaver.user.email);
      expect(placeholder.deletedAt).toBeInstanceOf(Date);

      expect(await Trip.findById(soloTrip)).toBeNull();
      const shared = await Trip.findById(sharedTrip).lean();
      expect(String(shared.owner)).toBe(friend.user.id);
      expect(shared.members.map(String)).toEqual([friend.user.id]);

      expect(await Message.countDocuments({ sender: leaver.user.id })).toBe(0);
      expect(await Note.countDocuments({ trip: sharedTrip, visibility: 'private' })).toBe(0);

      // The group keeps the shared note and the expense
      const notes = await friend.agent.get(`/api/trips/${sharedTrip}/notes`);
      expect(notes.body.notes).toHaveLength(1);
      const splits = await friend.agent.get(`/api/trips/${sharedTrip}/expenses/splits`);
      expect(splits.status).toBe(200);
      const expenses = await friend.agent.get(`/api/trips/${sharedTrip}/expenses`);
      expect(expenses.status).toBe(200);

      // The new owner is told
      const notifications = await friend.agent.get('/api/notifications');
      expect(JSON.stringify(notifications.body)).toMatch(/You now own a trip/);

      // Deleted accounts don't show up for admins
      const admin = await signUpAdmin(app);
      const users = await admin.agent.get('/api/admin/users');
      expect(JSON.stringify(users.body)).not.toMatch(/Deleted user/);
    });

    it('lets an admin delete a user with the same cleanup', async () => {
      const admin = await signUpAdmin(app);
      const user = await signUp(app);
      await verifyUser(user.user.id);
      const tripId = await createTrip(user.agent, 'Removed trip');

      const res = await admin.agent.delete(`/api/admin/users/${user.user.id}`);
      expect(res.status).toBe(200);
      expect(await Trip.findById(tripId)).toBeNull();
      expect((await user.agent.get('/api/profile')).status).toBe(401);
    });
  });
});
