import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  PNG_BYTES,
  TEST_DB_URI,
  clearDb,
  connectTestDb,
  disconnectTestDb,
  futureDate,
  signUp,
  verifyUser,
} from '../helpers.js';

const { default: app } = await import('#src/app.js');

const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'src');

describe.skipIf(!TEST_DB_URI)('Trip collaboration API', () => {
  let owner;
  let member;
  let outsider;
  let tripId;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(async () => {
    await clearDb();
    owner = await signUp(app, { name: 'Owner' });
    member = await signUp(app, { name: 'Member' });
    outsider = await signUp(app, { name: 'Outsider' });

    const trip = await owner.agent.post('/api/trips').send({
      title: 'Sylhet tea gardens',
      startDate: futureDate(20),
      endDate: futureDate(23),
      tripCategory: 'domestic',
    });
    tripId = trip.body.trip.id;

    // Add the member through an accepted invitation
    await owner.agent
      .post(`/api/trips/${tripId}/invitations`)
      .send({ email: member.user.email });
    const pending = await member.agent.get('/api/invitations/pending');
    const invitation = pending.body.invitations[0];
    await member.agent.post(
      `/api/invitations/${invitation.id || invitation._id}/accept`
    );
    await verifyUser(member.user.id);
  });

  describe('checklist', () => {
    it('lets members add, toggle and delete items, and keeps outsiders out', async () => {
      const created = await member.agent
        .post(`/api/trips/${tripId}/checklist`)
        .send({ text: 'Rain jacket' });
      expect(created.status).toBe(201);
      const itemId = created.body.checklistItem.id;

      const toggled = await owner.agent.patch(`/api/checklist/${itemId}/toggle`);
      expect(toggled.status).toBe(200);
      expect(toggled.body.checklistItem.isChecked).toBe(true);

      const list = await member.agent.get(`/api/trips/${tripId}/checklist`);
      expect(list.body.checklistItems).toHaveLength(1);

      expect(
        (await outsider.agent.get(`/api/trips/${tripId}/checklist`)).status
      ).toBe(403);
      expect(
        (await outsider.agent.patch(`/api/checklist/${itemId}/toggle`)).status
      ).toBe(403);
      expect((await outsider.agent.delete(`/api/checklist/${itemId}`)).status).toBe(
        403
      );

      const removed = await member.agent.delete(`/api/checklist/${itemId}`);
      expect(removed.status).toBe(200);
    });

    it('notifies the other members when an item is added', async () => {
      await member.agent
        .post(`/api/trips/${tripId}/checklist`)
        .send({ text: 'Torch' });

      const count = await owner.agent.get('/api/notifications/unread-count');
      expect(count.status).toBe(200);
      expect(count.body.count ?? count.body.unreadCount).toBeGreaterThan(0);
    });
  });

  describe('notes', () => {
    it('keeps private notes visible only to their author', async () => {
      const shared = await owner.agent
        .post(`/api/trips/${tripId}/notes`)
        .send({ title: 'Plan', content: 'Meet at the station', visibility: 'shared' });
      expect(shared.status).toBe(201);

      const privateNote = await owner.agent
        .post(`/api/trips/${tripId}/notes`)
        .send({ content: 'Buy a surprise gift', visibility: 'private' });
      expect(privateNote.status).toBe(201);

      const ownerNotes = await owner.agent.get(`/api/trips/${tripId}/notes`);
      expect(ownerNotes.body.notes).toHaveLength(2);

      const memberNotes = await member.agent.get(`/api/trips/${tripId}/notes`);
      expect(memberNotes.body.notes.map((n) => n.content)).toEqual([
        'Meet at the station',
      ]);
    });

    it('lets only the author edit or delete a note', async () => {
      const note = await owner.agent
        .post(`/api/trips/${tripId}/notes`)
        .send({ content: 'Original' });
      const noteId = note.body.note.id;

      const edit = await member.agent
        .patch(`/api/notes/${noteId}`)
        .send({ content: 'Changed' });
      expect(edit.status).toBe(403);

      const del = await member.agent.delete(`/api/notes/${noteId}`);
      expect(del.status).toBe(403);

      const ownEdit = await owner.agent
        .patch(`/api/notes/${noteId}`)
        .send({ content: 'Changed by owner' });
      expect(ownEdit.status).toBe(200);
    });
  });

  describe('expenses', () => {
    it('records expenses and splits them equally between members', async () => {
      const first = await owner.agent
        .post(`/api/trips/${tripId}/expenses`)
        .send({
          amount: 100,
          category: 'food',
          description: 'Dinner',
          payer: owner.user.id,
        });
      expect(first.status, JSON.stringify(first.body)).toBe(201);
      expect(first.body.expense.currency).toBe('BDT');

      // Multipart form data, as the client sends it, with a receipt
      const second = await member.agent
        .post(`/api/trips/${tripId}/expenses`)
        .field('amount', '50.5')
        .field('category', 'transport')
        .field('description', 'Taxi')
        .field('payer', member.user.id)
        .attach('receipt', PNG_BYTES, {
          filename: 'receipt.png',
          contentType: 'image/png',
        });
      expect(second.status, JSON.stringify(second.body)).toBe(201);
      expect(second.body.expense.receipt.url).toMatch(/^\/uploads\/receipts\//);

      const splits = await member.agent.get(`/api/trips/${tripId}/expenses/splits`);
      expect(splits.status).toBe(200);
      expect(splits.body.totalExpenses).toBe(150.5);
      const byName = Object.fromEntries(
        splits.body.splits.map((s) => [s.user.name, s])
      );
      expect(byName.Owner.totalPaid).toBe(100);
      expect(byName.Member.totalPaid).toBe(50.5);
      // Balances always sum to zero
      expect(byName.Owner.netBalance + byName.Member.netBalance).toBeCloseTo(0);
    });

    it('rejects a payer who is not a trip member', async () => {
      const res = await owner.agent.post(`/api/trips/${tripId}/expenses`).send({
        amount: 10,
        category: 'food',
        description: 'Snacks',
        payer: outsider.user.id,
      });
      expect(res.status).toBe(400);
    });

    it('returns the custom message for an invalid category', async () => {
      const res = await owner.agent.post(`/api/trips/${tripId}/expenses`).send({
        amount: 10,
        category: 'gambling',
        description: 'Casino',
        payer: owner.user.id,
      });
      expect(res.status).toBe(400);
      expect(res.body.details).toBe('Invalid category');
    });

    it('keeps outsiders away from expenses', async () => {
      const res = await outsider.agent.get(`/api/trips/${tripId}/expenses`);
      expect(res.status).toBe(403);
    });
  });

  describe('photos', () => {
    it('uploads a photo, lists it and only lets the uploader delete it', async () => {
      const upload = await member.agent
        .post(`/api/trips/${tripId}/photos`)
        .field('caption', 'Tea garden at sunrise')
        .attach('photo', PNG_BYTES, { filename: 'sunrise.png', contentType: 'image/png' });
      expect(upload.status, JSON.stringify(upload.body)).toBe(201);
      const photo = upload.body.photo;
      expect(photo.caption).toBe('Tea garden at sunrise');
      expect(photo.url).toMatch(/^\/uploads\/photos\/.+\.png$/);

      const filePath = path.join(srcDir, photo.url);
      expect(existsSync(filePath)).toBe(true);

      // The stored file is served back
      const served = await request(app).get(photo.url);
      expect(served.status).toBe(200);
      expect(served.headers['content-type']).toMatch(/image\/png/);

      const list = await owner.agent.get(`/api/trips/${tripId}/photos`);
      expect(list.body.photos).toHaveLength(1);

      const denied = await owner.agent.delete(
        `/api/trips/${tripId}/photos/${photo.id}`
      );
      expect(denied.status).toBe(403);

      const removed = await member.agent.delete(
        `/api/trips/${tripId}/photos/${photo.id}`
      );
      expect(removed.status).toBe(200);
      expect(existsSync(filePath)).toBe(false);
    });

    it('rejects a file whose content is not really an image', async () => {
      const res = await owner.agent
        .post(`/api/trips/${tripId}/photos`)
        .attach('photo', Buffer.from('<script>alert(1)</script>'), {
          filename: 'evil.png',
          contentType: 'image/png',
        });
      expect(res.status).toBe(415);
    });

    it('rejects a disallowed file type', async () => {
      const res = await owner.agent
        .post(`/api/trips/${tripId}/photos`)
        .attach('photo', Buffer.from('GIF89a'), {
          filename: 'anim.gif',
          contentType: 'image/gif',
        });
      expect(res.status).toBe(415);
    });

    it('does not let outsiders upload', async () => {
      const res = await outsider.agent
        .post(`/api/trips/${tripId}/photos`)
        .attach('photo', PNG_BYTES, { filename: 'x.png', contentType: 'image/png' });
      expect(res.status).toBe(403);
    });

    it('does not delete a photo through another trip’s URL', async () => {
      const upload = await owner.agent
        .post(`/api/trips/${tripId}/photos`)
        .attach('photo', PNG_BYTES, { filename: 'x.png', contentType: 'image/png' });
      const otherTrip = await owner.agent.post('/api/trips').send({
        title: 'Another trip',
        startDate: futureDate(40),
        endDate: futureDate(41),
        tripCategory: 'domestic',
      });

      const res = await owner.agent.delete(
        `/api/trips/${otherTrip.body.trip.id}/photos/${upload.body.photo.id}`
      );
      expect(res.status).toBe(404);
    });
  });

  describe('itinerary', () => {
    it('adds activities that show up on the map', async () => {
      const res = await member.agent.post(`/api/trips/${tripId}/activities`).send({
        title: 'Lawachara forest walk',
        date: futureDate(21),
        time: '09:30',
        location: {
          name: 'Lawachara National Park',
          coordinates: { lat: 24.32, lng: 91.78 },
        },
      });
      expect(res.status, JSON.stringify(res.body)).toBe(201);

      const map = await owner.agent.get(`/api/trips/${tripId}/map`);
      expect(map.status).toBe(200);
      expect(map.body.activities).toHaveLength(1);
    });
  });

  describe('chat', () => {
    it('stores messages for members only', async () => {
      const sent = await member.agent
        .post(`/api/trips/${tripId}/messages`)
        .send({ text: 'Hello team' });
      expect(sent.status).toBe(201);

      const list = await owner.agent.get(`/api/trips/${tripId}/messages`);
      expect(list.status).toBe(200);
      expect(list.body.messages.map((m) => m.text)).toContain('Hello team');

      const outsiderSend = await outsider.agent
        .post(`/api/trips/${tripId}/messages`)
        .send({ text: 'Let me in' });
      expect(outsiderSend.status).toBe(403);
    });
  });

  describe('reports', () => {
    it('accepts one report per user per trip', async () => {
      const body = { category: 'spam', description: 'This trip looks like spam' };
      const first = await outsider.agent.post(`/api/trips/${tripId}/report`).send(body);
      expect(first.status).toBe(201);

      const second = await outsider.agent.post(`/api/trips/${tripId}/report`).send(body);
      expect(second.status).toBe(409);
    });

    it('lets the admin list reports and blocks everyone else', async () => {
      await outsider.agent
        .post(`/api/trips/${tripId}/report`)
        .send({ category: 'fake', description: 'Fake listing for sure' });

      // The first account is the admin
      const admin = await owner.agent.get('/api/admin/reports');
      expect(admin.status).toBe(200);
      expect(admin.body.reports).toHaveLength(1);

      const user = await member.agent.get('/api/admin/reports');
      expect(user.status).toBe(403);
    });
  });
});
