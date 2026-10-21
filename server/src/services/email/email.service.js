import { createProviderFromEnv } from "./providers.js";

let providerPromise;

/**
 * The configured provider, created on first use so dotenv has loaded
 */
export const getEmailProvider = () => {
  providerPromise ??= createProviderFromEnv();
  return providerPromise;
};

/**
 * Replace the provider (tests) or pass nothing to rebuild it from the env
 */
export const setEmailProvider = (provider) => {
  providerPromise = provider ? Promise.resolve(provider) : undefined;
};

/**
 * Send an email and wait for the provider to accept it
 * @param {Object} message - { to, subject, text, html }
 */
export const sendEmail = async (message) => {
  const provider = await getEmailProvider();
  return provider.send(message);
};

/**
 * Send without making the caller wait or fail. Used from request handlers so
 * a slow or broken email provider never breaks sign-up or a join request,
 * and so response times don't reveal whether an account exists.
 */
export const queueEmail = (message) => {
  sendEmail(message).catch((error) => {
    console.error(
      `Failed to send "${message.subject}" email: ${error.message}`
    );
  });
};

/**
 * Base URL of the web client, used for links in emails
 */
export const getAppUrl = () => {
  const url =
    process.env.APP_URL ||
    process.env.SITE_URL ||
    (process.env.CLIENT_URL || "").split(",")[0].trim() ||
    "http://localhost:5173";
  return url.replace(/\/+$/, "");
};

export const appLink = (pathname, params = {}) => {
  const url = new URL(pathname, `${getAppUrl()}/`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
};
