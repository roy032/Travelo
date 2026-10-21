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

describe.skipIf(!TEST_DB_URI)('Auth API', () => {
  beforeAll(connectTestDb);
  afterAll(disconnectTestDb);
  beforeEach(clearDb);

  it('signs up a user, sets an httpOnly cookie and never returns the password', async () => {
    const res = await request(app).post('/api/auth/sign-up').send({
      name: 'Ada Lovelace',
      email: 'Ada@Example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(res.body.user.password).toBeUndefined();
    const cookie = res.headers['set-cookie'].join(';');
    expect(cookie).toMatch(/token=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('makes only the first account an admin', async () => {
    const first = await signUp(app);
    const second = await signUp(app);

    expect(first.user.role).toBe('admin');
    expect(second.user.role).toBe('user');
    expect(second.user.verificationStatus).toBe('unverified');
  });

  it('ignores a role sent in the sign-up body', async () => {
    await signUp(app);
    const { user } = await signUp(app, { role: 'admin' });
    expect(user.role).toBe('user');
  });

  it('rejects a duplicate email regardless of case', async () => {
    await signUp(app, { email: 'dup@example.com' });
    const res = await request(app).post('/api/auth/sign-up').send({
      name: 'Dup',
      email: 'DUP@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });

  it('returns readable validation details for bad input', async () => {
    const res = await request(app)
      .post('/api/auth/sign-up')
      .send({ name: 'A', email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(typeof res.body.details).toBe('string');
    expect(res.body.details.length).toBeGreaterThan(0);
  });

  it('signs in with the right password only', async () => {
    const { credentials } = await signUp(app);

    const wrong = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: credentials.email, password: 'wrong-password' });
    expect(wrong.status).toBe(401);

    const unknown = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(unknown.status).toBe(401);

    const ok = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: credentials.email.toUpperCase(), password: 'password123' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.email).toBe(credentials.email);
  });

  it('blocks sign-in for a blocked account', async () => {
    const { user, credentials } = await signUp(app);
    const { default: User } = await import('#models/user.model.js');
    await User.findByIdAndUpdate(user.id, { isBlocked: true });

    const res = await request(app)
      .post('/api/auth/sign-in')
      .send({ email: credentials.email, password: 'password123' });
    expect(res.status).toBe(403);
  });

  it('returns the profile for a signed-in user and 401 otherwise', async () => {
    const { agent, user } = await signUp(app);

    const me = await agent.get('/api/profile');
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(user.email);

    const anonymous = await request(app).get('/api/profile');
    expect(anonymous.status).toBe(401);
  });

  it('signs out by clearing the cookie', async () => {
    const { agent } = await signUp(app);

    const res = await agent.post('/api/auth/sign-out');
    expect(res.status).toBe(200);

    const me = await agent.get('/api/profile');
    expect(me.status).toBe(401);
  });

  it('rejects a forged token', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Cookie', 'token=not-a-real-token');
    expect(res.status).toBe(401);
  });
});
