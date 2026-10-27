import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRateLimiter } from './rateLimit.middleware.js';

const buildApp = (limiter) => {
  const app = express();
  app.use(express.json());
  app.post('/', limiter, (req, res) => res.status(200).json({ ok: true }));
  return app;
};

describe('createRateLimiter', () => {
  it('returns 429 with Retry-After once the limit is exceeded', async () => {
    const app = buildApp(createRateLimiter({ windowMs: 60_000, max: 2 }));

    await request(app).post('/').expect(200);
    await request(app).post('/').expect(200);
    const res = await request(app).post('/').expect(429);

    expect(res.body.error).toBe('Too many requests');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  it('limits per key from a custom key generator', async () => {
    const app = buildApp(
      createRateLimiter({
        windowMs: 60_000,
        max: 1,
        keyGenerator: (req) => req.body?.email?.toLowerCase() ?? null,
      })
    );

    await request(app).post('/').send({ email: 'a@x.com' }).expect(200);
    await request(app).post('/').send({ email: 'A@x.com' }).expect(429);
    await request(app).post('/').send({ email: 'b@x.com' }).expect(200);
    // Requests without a key are not limited
    await request(app).post('/').send({}).expect(200);
    await request(app).post('/').send({}).expect(200);
  });
});

describe("per-user content limits", () => {
  it("caps one user without affecting another", async () => {
    const { userRateLimiter, takeUserQuota, CONTENT_LIMITS } = await import(
      "./rateLimit.middleware.js"
    );
    const limiter = userRateLimiter("report");
    const run = (userId) => {
      const res = {
        statusCode: 200,
        set: () => res,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json: () => res,
      };
      let passed = false;
      limiter({ user: { id: userId }, ip: "1.2.3.4" }, res, () => {
        passed = true;
      });
      return { passed, status: res.statusCode };
    };

    for (let i = 0; i < CONTENT_LIMITS.report.max; i += 1) {
      expect(run("u1").passed).toBe(true);
    }
    expect(run("u1")).toEqual({ passed: false, status: 429 });
    expect(run("u2").passed).toBe(true);

    // The chat socket shares the message quota
    for (let i = 0; i < CONTENT_LIMITS.message.max; i += 1) {
      expect(takeUserQuota("message", "chatty")).toBe(true);
    }
    expect(takeUserQuota("message", "chatty")).toBe(false);
  });
});
