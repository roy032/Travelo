/**
 * Email providers. Each one is { name, send(message) } where message is
 * { to, subject, text, html }. Pick one with EMAIL_PROVIDER; when it is unset
 * emails are written to the server log so local development needs no setup.
 */

// Writes the email to the log instead of sending it (development default)
export const createConsoleProvider = ({ logger = console } = {}) => ({
  name: "console",
  send: async ({ to, subject, text }) => {
    logger.info(
      `[email] To: ${to}\n[email] Subject: ${subject}\n${text}\n[email] ---`
    );
    return { id: null };
  },
});

// Keeps emails in memory; used by the test suites to read sent links
export const createMemoryProvider = () => {
  const outbox = [];
  return {
    name: "memory",
    outbox,
    send: async (message) => {
      outbox.push({ ...message, sentAt: new Date() });
      return { id: String(outbox.length) };
    },
  };
};

// https://resend.com/docs/api-reference/emails/send-email
export const createResendProvider = ({ apiKey, from, fetchImpl = fetch }) => {
  if (!apiKey) throw new Error("RESEND_API_KEY is required for EMAIL_PROVIDER=resend");
  return {
    name: "resend",
    send: async ({ to, subject, text, html }) => {
      const response = await fetchImpl("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, text, html }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Resend responded ${response.status}: ${body}`);
      }
      const data = await response.json().catch(() => ({}));
      return { id: data.id ?? null };
    },
  };
};

// Any SMTP server (Gmail, Mailgun, SES, Postmark, ...) through nodemailer
export const createSmtpProvider = async ({ url, host, port, user, pass, secure, from }) => {
  const { default: nodemailer } = await import("nodemailer");
  const transporter = url
    ? nodemailer.createTransport(url)
    : nodemailer.createTransport({
        host,
        port: Number(port) || 587,
        secure: secure ?? Number(port) === 465,
        auth: user ? { user, pass } : undefined,
      });
  return {
    name: "smtp",
    send: async ({ to, subject, text, html }) => {
      const info = await transporter.sendMail({ from, to, subject, text, html });
      return { id: info.messageId ?? null };
    },
  };
};

/**
 * Build the provider named by EMAIL_PROVIDER (console, resend, smtp, memory)
 */
export const createProviderFromEnv = async (env = process.env) => {
  const name = (env.EMAIL_PROVIDER || "console").trim().toLowerCase();
  const from = env.EMAIL_FROM || "Travelo <no-reply@travelo.app>";

  switch (name) {
    case "console":
      if (env.NODE_ENV === "production") {
        console.warn(
          "EMAIL_PROVIDER is not set: emails (including password reset links) are only written to the log"
        );
      }
      return createConsoleProvider();
    case "memory":
      return createMemoryProvider();
    case "resend":
      return createResendProvider({ apiKey: env.RESEND_API_KEY, from });
    case "smtp":
      return createSmtpProvider({
        url: env.SMTP_URL,
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
        secure: env.SMTP_SECURE === undefined ? undefined : env.SMTP_SECURE === "true",
        from,
      });
    default:
      throw new Error(
        `Unknown EMAIL_PROVIDER "${name}" (use console, resend or smtp)`
      );
  }
};
