import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "crypto";

// Time-based one-time passwords (RFC 6238) as used by Google Authenticator,
// 1Password, Authy and others: SHA-1, 6 digits, 30-second steps.
const STEP_SECONDS = 30;
const DIGITS = 6;
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const base32Encode = (buffer) => {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31];
  return output;
};

export const base32Decode = (text) => {
  const clean = String(text).toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (const char of clean) {
    const index = BASE32.indexOf(char);
    if (index === -1) throw new Error("Invalid base32");
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
};

/** A new random 160-bit secret, base32 encoded */
export const generateSecret = () => base32Encode(randomBytes(20));

export const currentStep = (now = Date.now()) =>
  Math.floor(now / 1000 / STEP_SECONDS);

/** The code for one time step */
export const generateCode = (secret, step = currentStep()) => {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const hmac = createHmac("sha1", base32Decode(secret)).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 15;
  const binary = hmac.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
};

/**
 * Check a code, allowing one step of clock drift either way. Returns the
 * matching step (store it to refuse the same code twice) or null.
 * @param {string} secret
 * @param {string} code
 * @param {{now?: number, afterStep?: number}} [options] - codes at or before
 *   afterStep were already used
 */
export const verifyCode = (secret, code, { now = Date.now(), afterStep = -1 } = {}) => {
  const candidate = String(code ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(candidate)) return null;
  const step = currentStep(now);
  for (const drift of [0, -1, 1]) {
    const tryStep = step + drift;
    if (tryStep <= afterStep) continue;
    const expected = Buffer.from(generateCode(secret, tryStep));
    if (timingSafeEqual(expected, Buffer.from(candidate))) return tryStep;
  }
  return null;
};

/** otpauth:// link that authenticator apps read from the QR code */
export const otpauthUrl = ({ secret, account, issuer = "Travelo" }) =>
  `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=${DIGITS}&period=${STEP_SECONDS}`;

// Secrets are encrypted at rest so a database leak alone can't produce codes.
// The key comes from TOTP_ENCRYPTION_KEY, or is derived from JWT_SECRET.
const encryptionKey = () => {
  const source = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!source) throw new Error("JWT_SECRET environment variable is not set");
  return createHash("sha256").update(`travelo-totp:${source}`).digest();
};

export const encryptSecret = (secret) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64")).join(".");
};

export const decryptSecret = (stored) => {
  const [iv, tag, data] = String(stored).split(".").map((p) => Buffer.from(p, "base64"));
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
};

/** Ten single-use recovery codes like "k3f9-x2m7-q8wd" */
export const generateRecoveryCodes = (count = 10) => {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: count }, () => {
    const bytes = randomBytes(12);
    const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
    return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
  });
};

export const normalizeRecoveryCode = (code) =>
  String(code ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const hashRecoveryCode = (code) =>
  createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
