import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from './app.js';

describe('security headers and health check', () => {
  it('reports a degraded health status when the database is not connected', async () => {
    const res = await request(app).get('/api/health').expect(503);

    expect(res.body.status).toBe('degraded');
    expect(res.body.database).toBe('disconnected');
    expect(res.headers['cache-control']).toBe('no-store');
  });

  it('sets security headers on API responses', async () => {
    const res = await request(app).get('/api').expect(200);

    expect(res.headers['content-security-policy']).toContain(
      "frame-ancestors 'none'"
    );
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['permissions-policy']).toContain('camera=()');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
