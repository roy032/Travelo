import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
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

// Serve a stand-in client build so the link-preview HTML can be checked
const clientDist = mkdtempSync(path.join(tmpdir(), 'travelo-client-'));
writeFileSync(
  path.join(clientDist, 'index.html'),
  `<!doctype html><html><head><title>Travelo</title>
<meta name="description" content="Default" />
<meta property="og:title" content="Travelo" />
<meta property="og:description" content="Default" />
</head><body><div id="root"></div></body></html>`
);
process.env.CLIENT_DIST = clientDist;
process.env.SITE_URL = 'https://travelo.example';

const { default: app } = await import('#src/app.js');

describe.skipIf(!TEST_DB_URI)('Trip sharing and calendar API', () => {
  let owner;
  let member;
  let outsider;
  let tripId;

  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(async () => {
    await clearDb();
    owner = await signUp(app, { name: 'Owner Person' });
    member = await signUp(app, { name: 'Member Person' });
    outsider = await signUp(app, { name: 'Outsider' });
    await verifyUser(owner.user.id);

    const trip = await owner.agent.post('/api/trips').send({
      title: 'Sylhet tea gardens',
      description: 'Tea, hills and waterfalls',
      startDate: futureDate(20),
      endDate: futureDate(23),
      tripCategory: 'domestic',
    });
    expect(trip.status, JSON.stringify(trip.body)).toBe(201);
    tripId = trip.body.trip.id;

    await owner.agent
      .post(`/api/trips/${tripId}/invitations`)
      .send({ email: member.user.email });
    const pending = await member.agent.get('/api/invitations/pending');
    const invitation = pending.body.invitations[0];
    await member.agent.post(
      `/api/invitations/${invitation.id || invitation._id}/accept`
    );

    const activity = await member.agent
      .post(`/api/trips/${tripId}/activities`)
      .send({
        title: 'Ratargul swamp forest',
        description: 'Boat ride, bring sunscreen',
        date: futureDate(21),
        time: '09:30',
        location: {
          name: 'Ratargul',
          address: 'Gowainghat, Sylhet',
          country: 'Bangladesh',
          coordinates: { lat: 25.0, lng: 91.98 },
        },
      });
    expect(activity.status, JSON.stringify(activity.body)).toBe(201);
  });

  const enableSharing = async () => {
    const res = await owner.agent.post(`/api/trips/${tripId}/share`);
    expect(res.status, JSON.stringify(res.body)).toBe(200);
    return res.body;
  };

  describe('calendar export', () => {
    it('gives members an .ics file of the trip and its activities', async () => {
      const res = await member.agent.get(`/api/trips/${tripId}/calendar.ics`);
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/^text\/calendar/);
      expect(res.headers['content-disposition']).toBe(
        'attachment; filename="sylhet-tea-gardens.ics"'
      );
      expect(res.text).toContain('SUMMARY:Sylhet tea gardens');
      expect(res.text).toContain('SUMMARY:Ratargul swamp forest');
      expect(res.text).toMatch(/DTSTART:\d{8}T093000\r\n/);
      expect(res.text).toContain('GEO:25;91.98');
      expect(res.text).toContain(
        `URL:https://travelo.example/trips/${tripId}`
      );
    });

    it('keeps outsiders and signed-out visitors out', async () => {
      expect(
        (await outsider.agent.get(`/api/trips/${tripId}/calendar.ics`)).status
      ).toBe(403);
      expect(
        (await request(app).get(`/api/trips/${tripId}/calendar.ics`)).status
      ).toBe(401);
    });
  });

  describe('share links', () => {
    it('is off until the owner turns it on', async () => {
      const trip = await owner.agent.get(`/api/trips/${tripId}`);
      expect(trip.body.trip.shareToken).toBeNull();
    });

    it('only lets the owner turn sharing on or off', async () => {
      expect(
        (await member.agent.post(`/api/trips/${tripId}/share`)).status
      ).toBe(403);
      expect(
        (await outsider.agent.post(`/api/trips/${tripId}/share`)).status
      ).toBe(403);
      await enableSharing();
      expect(
        (await member.agent.delete(`/api/trips/${tripId}/share`)).status
      ).toBe(403);
    });

    it('shows the plan to anyone with the link, without personal details', async () => {
      const { shareToken, url } = await enableSharing();
      expect(shareToken).toMatch(/^[A-Za-z0-9_-]{22}$/);
      expect(url).toBe(`https://travelo.example/share/${shareToken}`);

      // Turning it on again keeps the same link
      expect((await enableSharing()).shareToken).toBe(shareToken);
      const trip = await member.agent.get(`/api/trips/${tripId}`);
      expect(trip.body.trip.shareToken).toBe(shareToken);

      const res = await request(app).get(`/api/shared/${shareToken}`);
      expect(res.status).toBe(200);
      expect(res.headers['x-robots-tag']).toBe('noindex');
      expect(res.body.trip).toMatchObject({
        title: 'Sylhet tea gardens',
        memberCount: 2,
      });
      expect(res.body.activities).toHaveLength(1);
      expect(res.body.activities[0].location.coordinates).toEqual({
        lat: 25,
        lng: 91.98,
      });

      const body = JSON.stringify(res.body);
      expect(body).not.toContain(owner.user.email);
      expect(body).not.toContain(member.user.email);
      expect(body).not.toContain('Member Person');
      expect(body).not.toContain(shareToken);
    });

    it('serves a public calendar for the shared trip', async () => {
      const { shareToken } = await enableSharing();
      const res = await request(app).get(
        `/api/shared/${shareToken}/calendar.ics`
      );
      expect(res.status).toBe(200);
      expect(res.text).toContain('SUMMARY:Ratargul swamp forest');
      expect(res.text).toContain(
        `URL:https://travelo.example/share/${shareToken}`
      );
    });

    it('stops working once turned off, and a new link is made next time', async () => {
      const { shareToken } = await enableSharing();
      const off = await owner.agent.delete(`/api/trips/${tripId}/share`);
      expect(off.status).toBe(200);

      expect((await request(app).get(`/api/shared/${shareToken}`)).status).toBe(
        404
      );
      expect(
        (await request(app).get(`/api/shared/${shareToken}/calendar.ics`))
          .status
      ).toBe(404);

      const again = await enableSharing();
      expect(again.shareToken).not.toBe(shareToken);
    });

    it('stops working when the trip is deleted', async () => {
      const { shareToken } = await enableSharing();
      await owner.agent.delete(`/api/trips/${tripId}`);
      expect((await request(app).get(`/api/shared/${shareToken}`)).status).toBe(
        404
      );
    });

    it('rejects malformed and unknown tokens', async () => {
      expect((await request(app).get('/api/shared/short')).status).toBe(404);
      expect(
        (await request(app).get('/api/shared/AAAAAAAAAAAAAAAAAAAAAA')).status
      ).toBe(404);
    });

    it('writes the trip into the link preview of the share page', async () => {
      const { shareToken } = await enableSharing();
      const res = await request(app).get(`/share/${shareToken}`);
      expect(res.status).toBe(200);
      expect(res.text).toContain('<title>Sylhet tea gardens | Travelo</title>');
      expect(res.text).toMatch(
        /<meta property="og:description" content="[^"]*1 stop: Ratargul\. Tea, hills and waterfalls" \/>/
      );
      expect(res.text).toContain('<meta name="robots" content="noindex" />');

      await owner.agent.delete(`/api/trips/${tripId}/share`);
      const gone = await request(app).get(`/share/${shareToken}`);
      expect(gone.text).toContain('<title>Shared trip | Travelo</title>');
      expect(gone.text).not.toContain('Sylhet');
    });
  });
});
