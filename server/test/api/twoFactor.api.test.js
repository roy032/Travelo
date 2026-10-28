import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import {
  TEST_DB_URI,
  clearDb,
  connectTestDb,
  disconnectTestDb,
  signUp,
} from '../helpers.js';

const { default: app } = await import('#src/app.js');
const { default: User } = await import('#models/user.model.js');
const { generateCode, currentStep } = await import('#utils/totp.js');

// A code for a step after the last one used, so replay protection passes
const codeFor = (secret, offset = 0) => generateCode(secret, currentStep() + offset);

const turnOn = async (agent) => {
  const setup = await agent.post('/api/auth/2fa/setup');
  expect(setup.status).toBe(200);
  expect(setup.body.qrCode).toMatch(/^data:image\/png;base64,/);
  expect(setup.body.otpauthUrl).toMatch(/^otpauth:\/\/totp\/Travelo:/);
  const { secret } = setup.body;

  const enabled = await agent.post('/api/auth/2fa/enable').send({ code: codeFor(secret) });
  expect(enabled.status, JSON.stringify(enabled.body)).toBe(200);
  expect(enabled.body.recoveryCodes).toHaveLength(10);
  return { secret, recoveryCodes: enabled.body.recoveryCodes };
};

describe.skipIf(!TEST_DB_URI)('Two-factor sign-in', () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(clearDb);

  it('sets up with an app code and stores nothing in the clear', async () => {
    const { agent, user } = await signUp(app);
    const wrong = await agent.post('/api/auth/2fa/setup');
    expect(
      (await agent.post('/api/auth/2fa/enable').send({ code: '000000' })).status
    ).toBe(400);

    const { secret, recoveryCodes } = await turnOn(agent);
    expect(wrong.body.secret).not.toBe(secret);

    const stored = await User.findById(user.id)
      .select('+twoFactor.secret +twoFactor.recoveryCodes')
      .lean();
    expect(stored.twoFactor.enabled).toBe(true);
    expect(stored.twoFactor.secret).not.toContain(secret);
    expect(stored.twoFactor.recoveryCodes).not.toContain(recoveryCodes[0]);

    // The session that turned it on keeps working
    const status = await agent.get('/api/auth/2fa');
    expect(status.body).toMatchObject({ enabled: true, recoveryCodesLeft: 10 });
  });

  it('asks for a code after the password, and refuses replays', async () => {
    const { agent, credentials } = await signUp(app);
    const { secret } = await turnOn(agent);

    const browser = request.agent(app);
    const first = await browser.post('/api/auth/sign-in').send(credentials);
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ twoFactorRequired: true });
    expect(first.body.user).toBeUndefined();
    expect(first.headers['set-cookie']).toBeUndefined();
    // The challenge is not a session
    expect(
      (await request(app).get('/api/profile').set('Cookie', `token=${first.body.challenge}`))
        .status
    ).toBe(401);

    const bad = await browser
      .post('/api/auth/2fa/verify')
      .send({ challenge: first.body.challenge, code: '123456' });
    expect(bad.status).toBe(400);

    const code = codeFor(secret, 1);
    const ok = await browser
      .post('/api/auth/2fa/verify')
      .send({ challenge: first.body.challenge, code });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    expect(ok.body.user.email).toBe(credentials.email.toLowerCase());
    expect((await browser.get('/api/profile')).status).toBe(200);

    // Same code again is refused
    const again = await request(app).post('/api/auth/sign-in').send(credentials);
    const replay = await request(app)
      .post('/api/auth/2fa/verify')
      .send({ challenge: again.body.challenge, code });
    expect(replay.status).toBe(400);
  });

  it('accepts each recovery code once', async () => {
    const { agent, credentials } = await signUp(app);
    const { recoveryCodes } = await turnOn(agent);

    const signInWith = async (recoveryCode) => {
      const step1 = await request(app).post('/api/auth/sign-in').send(credentials);
      return request(app)
        .post('/api/auth/2fa/verify')
        .send({ challenge: step1.body.challenge, recoveryCode });
    };

    const used = await signInWith(recoveryCodes[0].toUpperCase());
    expect(used.status).toBe(200);
    expect(used.body).toMatchObject({ method: 'recovery', remainingRecoveryCodes: 9 });
    expect((await signInWith(recoveryCodes[0])).status).toBe(400);
  });

  it('turns off only with the password and a code', async () => {
    const { agent, credentials } = await signUp(app);
    const { secret } = await turnOn(agent);

    expect(
      (
        await agent
          .post('/api/auth/2fa/disable')
          .send({ password: 'wrong-password', code: codeFor(secret, 1) })
      ).status
    ).toBe(400);
    const off = await agent
      .post('/api/auth/2fa/disable')
      .send({ password: credentials.password, code: codeFor(secret, 1) });
    expect(off.status, JSON.stringify(off.body)).toBe(200);

    const signIn = await request(app).post('/api/auth/sign-in').send(credentials);
    expect(signIn.body.twoFactorRequired).toBeUndefined();
    expect(signIn.body.user).toBeDefined();
  });

  it('signs out other devices when it is turned on', async () => {
    const { agent, credentials } = await signUp(app);
    const laptop = request.agent(app);
    await laptop.post('/api/auth/sign-in').send(credentials);

    await turnOn(agent);
    expect((await laptop.get('/api/profile')).status).toBe(401);
    expect((await agent.get('/api/profile')).status).toBe(200);
  });
});
