import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createConsoleProvider,
  createProviderFromEnv,
  createResendProvider,
} from './providers.js';
import { appLink, getAppUrl, queueEmail, sendEmail, setEmailProvider } from './email.service.js';
import {
  joinRequestAcceptedTemplate,
  passwordResetTemplate,
  tripInvitationTemplate,
} from './templates.js';

const ENV_KEYS = ['APP_URL', 'SITE_URL', 'CLIENT_URL'];
const savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
  setEmailProvider();
  vi.restoreAllMocks();
});

describe('email providers', () => {
  it('logs to the console when EMAIL_PROVIDER is unset', async () => {
    const provider = await createProviderFromEnv({});
    expect(provider.name).toBe('console');
  });

  it('rejects an unknown provider name', async () => {
    await expect(createProviderFromEnv({ EMAIL_PROVIDER: 'pigeon' })).rejects.toThrow(
      /Unknown EMAIL_PROVIDER/
    );
  });

  it('requires an API key for Resend', async () => {
    await expect(createProviderFromEnv({ EMAIL_PROVIDER: 'resend' })).rejects.toThrow(
      /RESEND_API_KEY/
    );
  });

  it('builds an SMTP transport from SMTP_URL', async () => {
    const provider = await createProviderFromEnv({
      EMAIL_PROVIDER: 'smtp',
      SMTP_URL: 'smtp://user:pass@localhost:2525',
    });
    expect(provider.name).toBe('smtp');
  });

  it('console provider prints the message', async () => {
    const logger = { info: vi.fn() };
    await createConsoleProvider({ logger }).send({
      to: 'a@example.com',
      subject: 'Hi',
      text: 'Body with https://link',
    });
    expect(logger.info.mock.calls[0][0]).toContain('a@example.com');
    expect(logger.info.mock.calls[0][0]).toContain('https://link');
  });

  it('sends through the Resend API', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'email_123' }),
    });
    const provider = createResendProvider({
      apiKey: 're_test',
      from: 'Travelo <hi@travelo.app>',
      fetchImpl,
    });

    const result = await provider.send({ to: 'a@example.com', subject: 'S', text: 'T', html: '<p>T</p>' });

    expect(result.id).toBe('email_123');
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.headers.Authorization).toBe('Bearer re_test');
    expect(JSON.parse(init.body)).toMatchObject({
      from: 'Travelo <hi@travelo.app>',
      to: ['a@example.com'],
      subject: 'S',
    });
  });

  it('surfaces Resend errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 422, text: async () => 'bad from' });
    const provider = createResendProvider({ apiKey: 'k', from: 'x', fetchImpl });
    await expect(provider.send({ to: 'a@example.com', subject: 'S', text: 'T' })).rejects.toThrow(
      /422: bad from/
    );
  });
});

describe('email service', () => {
  it('uses the provider that was set', async () => {
    const send = vi.fn().mockResolvedValue({ id: '1' });
    setEmailProvider({ name: 'fake', send });
    await sendEmail({ to: 'a@example.com', subject: 'S', text: 'T' });
    expect(send).toHaveBeenCalledWith({ to: 'a@example.com', subject: 'S', text: 'T' });
  });

  it('queueEmail never throws when the provider fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    setEmailProvider({ name: 'broken', send: vi.fn().mockRejectedValue(new Error('SMTP down')) });

    expect(() => queueEmail({ to: 'a@example.com', subject: 'Hello', text: 'T' })).not.toThrow();

    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    expect(error.mock.calls[0][0]).toContain('SMTP down');
  });

  it('builds links from APP_URL, then the first CLIENT_URL', () => {
    delete process.env.SITE_URL;
    process.env.APP_URL = 'https://travelo.app/';
    expect(appLink('/reset-password', { token: 'abc' })).toBe(
      'https://travelo.app/reset-password?token=abc'
    );

    delete process.env.APP_URL;
    process.env.CLIENT_URL = 'https://a.example.com, https://b.example.com';
    expect(getAppUrl()).toBe('https://a.example.com');
  });
});

describe('email templates', () => {
  it('includes the link in both the text and HTML versions', () => {
    const email = passwordResetTemplate({
      name: 'Ada',
      url: 'https://travelo.app/reset-password?token=abc',
      expiresInMinutes: 60,
    });
    expect(email.subject).toMatch(/reset/i);
    expect(email.text).toContain('https://travelo.app/reset-password?token=abc');
    expect(email.html).toContain('https://travelo.app/reset-password?token=abc');
    expect(email.text).toContain('60 minutes');
  });

  it('escapes user-provided text in HTML', () => {
    const email = tripInvitationTemplate({
      name: 'Ada',
      inviterName: '<script>alert(1)</script>',
      tripTitle: 'Bali & "friends"',
      invitationId: 'inv1',
    });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).toContain('Bali &amp; &quot;friends&quot;');
    // Plain text keeps the original characters
    expect(email.text).toContain('Bali & "friends"');
  });

  it('links an accepted member to the trip', () => {
    process.env.APP_URL = 'https://travelo.app';
    const email = joinRequestAcceptedTemplate({ name: 'Ada', tripTitle: 'Alps', tripId: 't1' });
    expect(email.text).toContain('https://travelo.app/trips/t1');
    expect(email.text).toMatch(/turn them off/i);
  });
});
