import { describe, expect, it, beforeAll } from "vitest";
import {
  base32Decode,
  base32Encode,
  decryptSecret,
  encryptSecret,
  generateCode,
  generateRecoveryCodes,
  generateSecret,
  hashRecoveryCode,
  verifyCode,
} from "./totp.js";

beforeAll(() => {
  process.env.JWT_SECRET ||= "test-secret";
});

describe("totp", () => {
  it("matches the RFC 6238 SHA-1 test vectors", () => {
    // Secret "12345678901234567890"; the RFC lists 8 digits, we use the last 6
    const secret = base32Encode(Buffer.from("12345678901234567890"));
    expect(generateCode(secret, Math.floor(59 / 30))).toBe("287082");
    expect(generateCode(secret, Math.floor(1111111109 / 30))).toBe("081804");
    expect(generateCode(secret, Math.floor(1234567890 / 30))).toBe("005924");
    expect(generateCode(secret, Math.floor(2000000000 / 30))).toBe("279037");
  });

  it("round-trips base32", () => {
    const bytes = Buffer.from([0, 1, 2, 250, 255, 128, 64]);
    expect(base32Decode(base32Encode(bytes))).toEqual(bytes);
  });

  it("accepts one step of drift, refuses reuse and bad input", () => {
    const secret = generateSecret();
    const now = Date.now();
    const step = Math.floor(now / 30000);
    expect(verifyCode(secret, generateCode(secret, step), { now })).toBe(step);
    expect(verifyCode(secret, generateCode(secret, step - 1), { now })).toBe(step - 1);
    expect(verifyCode(secret, generateCode(secret, step - 2), { now })).toBeNull();
    expect(
      verifyCode(secret, generateCode(secret, step), { now, afterStep: step })
    ).toBeNull();
    expect(verifyCode(secret, "abc", { now })).toBeNull();
    expect(verifyCode(secret, undefined, { now })).toBeNull();
  });

  it("encrypts secrets at rest", () => {
    const secret = generateSecret();
    const stored = encryptSecret(secret);
    expect(stored).not.toContain(secret);
    expect(decryptSecret(stored)).toBe(secret);
  });

  it("makes distinct recovery codes whose hash ignores case and dashes", () => {
    const codes = generateRecoveryCodes();
    expect(new Set(codes).size).toBe(10);
    expect(codes[0]).toMatch(/^[a-z2-9]{4}-[a-z2-9]{4}-[a-z2-9]{4}$/);
    expect(hashRecoveryCode(codes[0].toUpperCase().replace(/-/g, " "))).toBe(
      hashRecoveryCode(codes[0])
    );
  });
});
