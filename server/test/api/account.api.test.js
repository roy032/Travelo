import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
const { setEmailProvider } = await import('#services/email/email.service.js');
const { createMemoryProvider } = await import('#services/email/providers.js');
const { default: User } = await import('#models/user.model.js');

let mail;

const emailsTo = (address) => mail.outbox.filter((m) => m.to === address);

// Wait for the email (sending is not awaited by request handlers)
const lastEmailTo = async (address, subjectPattern) => {
  let found;
  await vi.waitFor(() => {
    found = emailsTo(address)
      .filter((m) => !subjectPattern || subjectPattern.test(m.subject))
      .at(-1);
    expect(found, `no email to ${address}`).toBeDefined();
  });
  return found;
};

const tokenFrom = (email) => {
  const match = /[?&]token=([a-f0-9]{64})/.exec(email.text);
  expect(match, email.text).not.toBeNull();
  return match[1];
};

describe.skipIf(!TEST_DB_URI)('Account email API', () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(async () => {
    await clearDb();
    mail = createMemoryProvider();
    setEmailProvider(mail);
    process.env.APP_URL = 'https://travelo.test';
  });

  describe('email verification', () => {
    it('emails a confirmation link on sign-up that verifies the account once', async () => {
      const { agent, user } = await signUp(app);
      expect(user.emailVerified).toBe(false);

      const email = await lastEmailTo(user.email, /confirm/i);
      expect(email.text).toContain('https://travelo.test/verify-email?token=');
      const token = tokenFrom(email);

      // The raw token is never stored
      const stored = await User.findById(user.id).select('+emailVerificationToken');
      expect(stored.emailVerificationToken).toBeDefined();
      expect(stored.emailVerificationToken).not.toBe(token);

      const verify = await request(app).post('/api/auth/verify-email').send({ token });
      expect(verify.status).toBe(200);

      const me = await agent.get('/api/profile');
      expect(me.body.user.emailVerified).toBe(true);

      const reused = await request(app).post('/api/auth/verify-email').send({ token });
      expect(reused.status).toBe(400);
    });

    it('rejects malformed and expired links', async () => {
      const bad = await request(app).post('/api/auth/verify-email').send({ token: 'nope' });
      expect(bad.status).toBe(400);

      const { user } = await signUp(app);
      const token = tokenFrom(await lastEmailTo(user.email));
      await User.findByIdAndUpdate(user.id, { emailVerificationExpires: new Date(Date.now() - 1000) });

      const expired = await request(app).post('/api/auth/verify-email').send({ token });
      expect(expired.status).toBe(400);
      expect(expired.body.error).toBe('Invalid or expired link');
    });

    it('resends a fresh link to a signed-in user and invalidates the old one', async () => {
      const { agent, user } = await signUp(app);
      const first = tokenFrom(await lastEmailTo(user.email));

      expect((await request(app).post('/api/auth/resend-verification')).status).toBe(401);

      const resend = await agent.post('/api/auth/resend-verification');
      expect(resend.status).toBe(200);
      await vi.waitFor(() => expect(emailsTo(user.email)).toHaveLength(2));
      const second = tokenFrom(emailsTo(user.email)[1]);
      expect(second).not.toBe(first);

      expect((await request(app).post('/api/auth/verify-email').send({ token: first })).status).toBe(400);
      expect((await request(app).post('/api/auth/verify-email').send({ token: second })).status).toBe(200);

      const again = await agent.post('/api/auth/resend-verification');
      expect(again.status).toBe(400);
    });

    it('asks to confirm a changed email address again', async () => {
      const { agent, user } = await signUp(app);
      await request(app)
        .post('/api/auth/verify-email')
        .send({ token: tokenFrom(await lastEmailTo(user.email)) });

      const update = await agent.put('/api/profile').send({ email: 'new-address@example.com' });
      expect(update.status, JSON.stringify(update.body)).toBe(200);
      expect(update.body.user.emailVerified).toBe(false);

      const email = await lastEmailTo('new-address@example.com', /confirm/i);
      expect((await request(app).post('/api/auth/verify-email').send({ token: tokenFrom(email) })).status).toBe(200);
    });
  });

  describe('password reset', () => {
    it('resets the password with a single-use link', async () => {
      const { user, credentials } = await signUp(app);

      const forgot = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: credentials.email.toUpperCase() });
      expect(forgot.status).toBe(200);

      const email = await lastEmailTo(user.email, /reset/i);
      expect(email.text).toContain('https://travelo.test/reset-password?token=');
      const token = tokenFrom(email);

      const tooShort = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'short' });
      expect(tooShort.status).toBe(400);

      const reset = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'brand-new-password' });
      expect(reset.status).toBe(200);
      await lastEmailTo(user.email, /password was changed/i);

      const oldLogin = await request(app)
        .post('/api/auth/sign-in')
        .send({ email: credentials.email, password: credentials.password });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app)
        .post('/api/auth/sign-in')
        .send({ email: credentials.email, password: 'brand-new-password' });
      expect(newLogin.status).toBe(200);
      // Using the emailed link proves the user owns the address
      expect(newLogin.body.user.emailVerified).toBe(true);

      const reused = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'another-password' });
      expect(reused.status).toBe(400);
    });

    it('answers the same way for unknown emails and sends nothing', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nobody@example.com' });
      expect(res.status).toBe(200);

      const { credentials } = await signUp(app);
      const known = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: credentials.email });
      expect(known.body).toEqual(res.body);

      expect(emailsTo('nobody@example.com')).toHaveLength(0);
    });

    it('does not accept an expired link', async () => {
      const { user, credentials } = await signUp(app);
      await request(app).post('/api/auth/forgot-password').send({ email: credentials.email });
      const token = tokenFrom(await lastEmailTo(user.email, /reset/i));
      await User.findByIdAndUpdate(user.id, { passwordResetExpires: new Date(Date.now() - 1000) });

      const reset = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'brand-new-password' });
      expect(reset.status).toBe(400);
    });

    it('validates the email address', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'nope' });
      expect(res.status).toBe(400);
    });
  });

  describe('notification emails', () => {
    let owner;
    let traveller;
    let tripId;

    const markEmailVerified = (userId) => User.findByIdAndUpdate(userId, { emailVerified: true });

    beforeEach(async () => {
      owner = await signUp(app, { name: 'Owner' });
      traveller = await signUp(app, { name: 'Traveller' });
      await Promise.all([verifyUser(owner.user.id), verifyUser(traveller.user.id)]);
      await Promise.all([markEmailVerified(owner.user.id), markEmailVerified(traveller.user.id)]);

      const trip = await owner.agent.post('/api/trips').send({
        title: 'Cox <Bazar> weekend',
        description: 'Sun and sea',
        startDate: futureDate(10),
        endDate: futureDate(12),
        maxMembers: 5,
        tripCategory: 'domestic',
        destinationType: 'beach',
      });
      expect(trip.status, JSON.stringify(trip.body)).toBe(201);
      tripId = trip.body.trip.id;
    });

    const requestToJoin = async () => {
      expect((await traveller.agent.post(`/api/trips/${tripId}/join-request`)).status).toBe(200);
      const requests = await owner.agent.get(`/api/trips/${tripId}/join-requests`);
      return requests.body.requests[0]._id;
    };

    it('emails the owner about a join request and the traveller when accepted', async () => {
      const requestId = await requestToJoin();

      const toOwner = await lastEmailTo(owner.user.email, /wants to join/);
      expect(toOwner.subject).toContain('Traveller');
      expect(toOwner.html).toContain('Cox &lt;Bazar&gt; weekend');

      await owner.agent.post(`/api/trips/${tripId}/join-requests/${requestId}/accept`);

      const accepted = await lastEmailTo(traveller.user.email, /accepted/);
      expect(accepted.text).toContain(`https://travelo.test/trips/${tripId}`);
    });

    it('emails the traveller when a request is declined', async () => {
      const requestId = await requestToJoin();
      await owner.agent.post(`/api/trips/${tripId}/join-requests/${requestId}/reject`);

      const declined = await lastEmailTo(traveller.user.email, /declined/);
      expect(declined.text).toContain('https://travelo.test/explore');
    });

    it('emails an invited user', async () => {
      const invite = await owner.agent
        .post(`/api/trips/${tripId}/invitations`)
        .send({ email: traveller.user.email });
      expect(invite.status, JSON.stringify(invite.body)).toBe(201);

      const email = await lastEmailTo(traveller.user.email, /invited you/);
      expect(email.text).toContain('https://travelo.test/invitations/');
    });

    it('respects the email notifications setting and unverified addresses', async () => {
      const off = await traveller.agent.put('/api/profile').send({ emailNotifications: false });
      expect(off.body.user.emailNotifications).toBe(false);
      await User.findByIdAndUpdate(owner.user.id, { emailVerified: false });

      const requestId = await requestToJoin();
      await owner.agent.post(`/api/trips/${tripId}/join-requests/${requestId}/accept`);

      // Give the background sends a moment, then check nothing went out
      await new Promise((resolve) => setTimeout(resolve, 100));
      const notifications = mail.outbox.filter((m) => !/confirm/i.test(m.subject));
      expect(notifications).toHaveLength(0);

      // In-app notifications are still created
      const inApp = await traveller.agent.get('/api/notifications');
      expect(JSON.stringify(inApp.body)).toMatch(/accepted/i);
    });
  });
});
