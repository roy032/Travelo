import { createServer } from 'http';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { io as connect } from 'socket.io-client';
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
const { initializeSocket } = await import('#src/socket/chatSocket.js');
const { jwtToken } = await import('#utils/jwt.js');
const { resolveTripChange, setTripLiveServer } = await import('#src/socket/tripLive.js');

describe('resolveTripChange', () => {
  const id = '0123456789abcdef01234567';
  it('maps trip paths to the section they change', () => {
    expect(resolveTripChange(`/trips/${id}`)).toEqual({ tripId: id, resource: 'trip' });
    expect(resolveTripChange(`/trips/${id}/expenses/abc`)).toEqual({
      tripId: id,
      resource: 'expenses',
    });
    expect(resolveTripChange(`/trips/${id}/share`)).toMatchObject({ action: 'updated' });
    expect(resolveTripChange(`/trips/${id}/messages`)).toBeNull();
    expect(resolveTripChange(`/trips/${id}/ai-plan`)).toBeNull();
    expect(resolveTripChange('/trips/explore')).toBeNull();
  });
});

const once = (socket, event, timeout = 3000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`no ${event}`)), timeout);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });

const emit = (socket, event, payload) =>
  new Promise((resolve) => socket.emit(event, payload, resolve));

describe.skipIf(!TEST_DB_URI)('Live trip collaboration', () => {
  let httpServer;
  let url;
  let owner;
  let member;
  let outsider;
  let tripId;
  const sockets = [];

  const connectAs = async ({ user }) => {
    const socket = connect(url, {
      auth: { token: jwtToken.sign({ id: user.id, role: 'user' }) },
      transports: ['websocket'],
      forceNew: true,
    });
    sockets.push(socket);
    await once(socket, 'connect');
    return socket;
  };

  beforeAll(async () => {
    await connectTestDb();
    httpServer = createServer(app);
    initializeSocket(httpServer);
    await new Promise((resolve) => httpServer.listen(0, resolve));
    url = `http://localhost:${httpServer.address().port}`;
  });
  afterAll(async () => {
    setTripLiveServer(null);
    await new Promise((resolve) => httpServer.close(resolve));
    await disconnectTestDb();
  });
  afterEach(() => {
    sockets.splice(0).forEach((s) => s.disconnect());
  });
  beforeEach(async () => {
    await clearDb();
    owner = await signUp(app, { name: 'Owner' });
    member = await signUp(app, { name: 'Member' });
    outsider = await signUp(app, { name: 'Outsider' });
    await verifyUser(owner.user.id);
    const trip = await owner.agent.post('/api/trips').send({
      title: 'Sylhet tea gardens',
      startDate: futureDate(20),
      endDate: futureDate(23),
      tripCategory: 'domestic',
    });
    tripId = trip.body.trip.id;
    await owner.agent
      .post(`/api/trips/${tripId}/invitations`)
      .send({ email: member.user.email });
    const pending = await member.agent.get('/api/invitations/pending');
    const invitation = pending.body.invitations[0];
    await member.agent.post(`/api/invitations/${invitation.id || invitation._id}/accept`);
  });

  it('shows who is viewing and keeps outsiders out', async () => {
    const ownerSocket = await connectAs(owner);
    const memberSocket = await connectAs(member);
    const outsiderSocket = await connectAs(outsider);

    expect(await emit(ownerSocket, 'watchTrip', { tripId })).toMatchObject({
      success: true,
      userIds: [owner.user.id],
    });

    const presence = once(ownerSocket, 'tripPresence');
    const joined = await emit(memberSocket, 'watchTrip', { tripId });
    expect(joined.userIds.sort()).toEqual([owner.user.id, member.user.id].sort());
    expect((await presence).userIds).toHaveLength(2);

    expect(await emit(outsiderSocket, 'watchTrip', { tripId })).toEqual({
      error: 'You are not a member of this trip',
    });
    expect(await emit(outsiderSocket, 'watchTrip', { tripId: 'nope' })).toEqual({
      error: 'Invalid trip ID',
    });

    const left = once(ownerSocket, 'tripPresence');
    memberSocket.disconnect();
    expect((await left).userIds).toEqual([owner.user.id]);
  });

  it('tells other viewers when a section changes, but not the author', async () => {
    const ownerSocket = await connectAs(owner);
    const memberSocket = await connectAs(member);
    await emit(ownerSocket, 'watchTrip', { tripId });
    await emit(memberSocket, 'watchTrip', { tripId });

    let ownerHeard = false;
    ownerSocket.on('tripChange', () => {
      ownerHeard = true;
    });

    const change = once(memberSocket, 'tripChange');
    const created = await owner.agent
      .post(`/api/trips/${tripId}/checklist`)
      .set('X-Socket-Id', ownerSocket.id)
      .send({ text: 'Rain jacket' });
    expect(created.status).toBe(201);
    expect(await change).toMatchObject({
      tripId,
      resource: 'checklist',
      action: 'created',
      actorId: owner.user.id,
    });
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(ownerHeard).toBe(false);

    // Paths without the trip ID (toggle) still notify
    const toggled = once(memberSocket, 'tripChange');
    await owner.agent.patch(`/api/checklist/${created.body.checklistItem.id}/toggle`);
    expect(await toggled).toMatchObject({ resource: 'checklist', action: 'updated' });

    // Failed writes don't
    let failed = false;
    memberSocket.once('tripChange', () => {
      failed = true;
    });
    await owner.agent.post(`/api/trips/${tripId}/checklist`).send({});
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(failed).toBe(false);
  });

  it('stops updates reaching a removed member', async () => {
    const memberSocket = await connectAs(member);
    await emit(memberSocket, 'watchTrip', { tripId });

    const removed = await owner.agent.delete(`/api/trips/${tripId}/members/${member.user.id}`);
    expect(removed.status).toBe(200);

    let heard = false;
    memberSocket.on('tripChange', () => {
      heard = true;
    });
    await owner.agent.post(`/api/trips/${tripId}/checklist`).send({ text: 'Umbrella' });
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(heard).toBe(false);
  });
});
