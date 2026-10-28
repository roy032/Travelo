import {
  completeSignIn,
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  startTwoFactorSetup,
  twoFactorStatus,
} from "#services/twoFactor.service.js";
import { signSessionToken } from "#services/session.service.js";
import {
  twoFactorCodeSchema,
  twoFactorDisableSchema,
  twoFactorSignInSchema,
} from "#validations/twoFactor.validation.js";
import { formatValidationError } from "#utils/format.js";
import { cookies } from "#utils/cookies.js";

const parse = (schema, req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      error: "Validation failed",
      details: formatValidationError(result.error),
    });
    return null;
  }
  return result.data;
};

// Known failures, as [status, body]
const FAILURES = {
  "Invalid code": [400, { error: "Invalid code", message: "That code didn't work. Check the time on your phone and try again." }],
  "Invalid password": [400, { error: "Validation failed", message: "Password is incorrect" }],
  "Invalid challenge": [401, { error: "Sign-in expired", message: "Please sign in again." }],
  "Two-factor already enabled": [409, { error: "Conflict", message: "Two-factor sign-in is already on" }],
  "Two-factor not enabled": [409, { error: "Conflict", message: "Two-factor sign-in is off" }],
  "Two-factor setup not started": [409, { error: "Conflict", message: "Start the setup again" }],
};

const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (e) {
    const failure = FAILURES[e.message];
    if (failure) return res.status(failure[0]).json(failure[1]);
    next(e);
  }
};

export const getStatus = handle(async (req, res) => {
  res.json(await twoFactorStatus(req.user.id));
});

export const startSetup = handle(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(await startTwoFactorSetup(req.user.id));
});

export const enable = handle(async (req, res) => {
  const data = parse(twoFactorCodeSchema, req, res);
  if (!data) return;
  const { recoveryCodes, user } = await enableTwoFactor(req.user.id, data.code);
  // Other sessions were revoked; keep this one
  cookies.set(res, "token", signSessionToken(user));
  res.setHeader("Cache-Control", "no-store");
  res.json({ message: "Two-factor sign-in is on", recoveryCodes });
});

export const disable = handle(async (req, res) => {
  const data = parse(twoFactorDisableSchema, req, res);
  if (!data) return;
  await disableTwoFactor(req.user.id, data);
  res.json({ message: "Two-factor sign-in is off" });
});

export const newRecoveryCodes = handle(async (req, res) => {
  const data = parse(twoFactorCodeSchema, req, res);
  if (!data) return;
  const recoveryCodes = await regenerateRecoveryCodes(req.user.id, data.code);
  res.setHeader("Cache-Control", "no-store");
  res.json({ recoveryCodes });
});

/** POST /api/auth/2fa/verify - second step of sign-in */
export const verifySignIn = handle(async (req, res) => {
  const data = parse(twoFactorSignInSchema, req, res);
  if (!data) return;
  const { user, method, remainingRecoveryCodes } = await completeSignIn(
    data.challenge,
    data
  );
  cookies.set(res, "token", signSessionToken(user));
  res.json({
    message: "User signed in successfully",
    method,
    remainingRecoveryCodes,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    },
  });
});
