import { describe, it, expect, afterEach } from 'vitest';
import { isConfiguredAdmin } from './auth.service.js';

describe('isConfiguredAdmin', () => {
  const original = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (original === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = original;
  });

  it('matches listed emails case-insensitively', () => {
    process.env.ADMIN_EMAILS = ' Owner@Example.com , ops@example.com';

    expect(isConfiguredAdmin('owner@example.com')).toBe(true);
    expect(isConfiguredAdmin('OPS@example.com ')).toBe(true);
    expect(isConfiguredAdmin('someone@example.com')).toBe(false);
  });

  it('grants nobody admin when ADMIN_EMAILS is unset', () => {
    delete process.env.ADMIN_EMAILS;

    expect(isConfiguredAdmin('owner@example.com')).toBe(false);
    expect(isConfiguredAdmin(undefined)).toBe(false);
  });
});
