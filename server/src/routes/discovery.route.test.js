import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// These checks run before any database access, so no MongoDB is needed
let app;
let token;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  app = (await import('#src/app.js')).default;
  const { jwtToken } = await import('#utils/jwt.js');
  token = jwtToken.sign({ id: '64b000000000000000000002', role: 'user' });
});

describe('search, favorites and reviews routes', () => {
  it('rejects unknown destination filters', async () => {
    const res = await request(app).get('/api/destinations?category=moon');
    expect(res.status).toBe(400);
  });

  it('rejects an inverted explore date range', async () => {
    const res = await request(app).get(
      '/api/trips/explore?from=2030-05-01&to=2030-01-01'
    );
    expect(res.status).toBe(400);
    expect(res.body.details).toMatch(/date range/);
  });

  it('requires sign-in for favorites', async () => {
    expect((await request(app).get('/api/favorites')).status).toBe(401);
    expect(
      (await request(app).post('/api/favorites').send({ itemType: 'trip' })).status
    ).toBe(401);
  });

  it('validates the favorite body', async () => {
    const res = await request(app)
      .post('/api/favorites')
      .set('Cookie', `token=${token}`)
      .send({ itemType: 'hotel', itemId: 'nope' });
    expect(res.status).toBe(400);
  });

  it('requires sign-in to review', async () => {
    const res = await request(app)
      .put('/api/destinations/64b000000000000000000001/reviews')
      .send({ rating: 5 });
    expect(res.status).toBe(401);
  });

  it('validates the rating', async () => {
    const res = await request(app)
      .put('/api/destinations/64b000000000000000000001/reviews')
      .set('Cookie', `token=${token}`)
      .send({ rating: 9 });
    expect(res.status).toBe(400);
    expect(res.body.details).toMatch(/between 1 and 5/);
  });
});
