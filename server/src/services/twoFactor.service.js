import QRCode from "qrcode";
import User from "#models/user.model.js";
import { jwtToken } from "#utils/jwt.js";
import {
  decryptSecret,
  encryptSecret,
  generateRecoveryCodes,
  generateSecret,
  hashRecoveryCode,
  otpauthUrl,
  verifyCode,
} from "#utils/totp.js";

const SECRET_FIELDS =
  "+twoFactor.secret +twoFactor.pendingSecret +twoFactor.lastStep +twoFactor.recoveryCodes";

// How long the step between password and code may take
const CHALLENGE_TTL = "5m";

const loadUser = async (userId) => {
  const user = await User.findById(userId).select(`${SECRET_FIELDS} +password`);
  if (!user || user.deletedAt) throw new Error("User not found");
  return user;
};

/**
 * Start setup: store a new pending secret and return what the
 * authenticator app needs (QR code and the secret for manual entry)
 */
export const startTwoFactorSetup = async (userId) => {
  const user = await loadUser(userId);
  if (user.twoFactor?.enabled) throw new Error("Two-factor already enabled");

  const secret = generateSecret();
  user.set("twoFactor.pendingSecret", encryptSecret(secret));
  await user.save();

  const url = otpauthUrl({ secret, account: user.email });
  return { secret, otpauthUrl: url, qrCode: await QRCode.toDataURL(url, { margin: 1, width: 220 }) };
};

/**
 * Confirm setup with a code from the app. Returns the recovery codes,
 * which are shown once and only stored hashed.
 */
export const enableTwoFactor = async (userId, code) => {
  const user = await loadUser(userId);
  if (user.twoFactor?.enabled) throw new Error("Two-factor already enabled");
  if (!user.twoFactor?.pendingSecret) throw new Error("Two-factor setup not started");

  const secret = decryptSecret(user.twoFactor.pendingSecret);
  const step = verifyCode(secret, code);
  if (step === null) throw new Error("Invalid code");

  const recoveryCodes = generateRecoveryCodes();
  user.set("twoFactor", {
    enabled: true,
    secret: user.twoFactor.pendingSecret,
    pendingSecret: undefined,
    lastStep: step,
    recoveryCodes: recoveryCodes.map(hashRecoveryCode),
    enabledAt: new Date(),
  });
  // Other devices signed in with the password alone are signed out
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return { recoveryCodes, user };
};

/**
 * Check a code or a recovery code for a user with two-factor on. A used
 * recovery code is removed; a used app code can't be replayed.
 * @returns {Promise<{method: "app"|"recovery", remainingRecoveryCodes: number}|null>}
 */
const consumeSecondFactor = async (user, { code, recoveryCode }) => {
  if (recoveryCode) {
    const hash = hashRecoveryCode(recoveryCode);
    const result = await User.updateOne(
      { _id: user._id, "twoFactor.recoveryCodes": hash },
      { $pull: { "twoFactor.recoveryCodes": hash } }
    );
    if (result.modifiedCount !== 1) return null;
    return {
      method: "recovery",
      remainingRecoveryCodes: (user.twoFactor.recoveryCodes?.length ?? 1) - 1,
    };
  }

  const secret = decryptSecret(user.twoFactor.secret);
  const step = verifyCode(secret, code, { afterStep: user.twoFactor.lastStep ?? -1 });
  if (step === null) return null;
  // Conditional write so two requests with the same code can't both pass
  const result = await User.updateOne(
    {
      _id: user._id,
      $or: [
        { "twoFactor.lastStep": { $lt: step } },
        { "twoFactor.lastStep": { $exists: false } },
      ],
    },
    { $set: { "twoFactor.lastStep": step } }
  );
  if (result.modifiedCount !== 1) return null;
  return { method: "app", remainingRecoveryCodes: user.twoFactor.recoveryCodes?.length ?? 0 };
};

/** Short-lived token proving the password step passed */
export const createSignInChallenge = (user) =>
  jwtToken.sign({
    purpose: "2fa",
    id: String(user.id ?? user._id),
    tv: user.tokenVersion ?? 0,
  }, { expiresIn: CHALLENGE_TTL });

/**
 * Finish a sign-in that needs a second factor
 * @throws {Error} "Invalid challenge" | "Invalid code"
 */
export const completeSignIn = async (challenge, factors) => {
  let decoded;
  try {
    decoded = jwtToken.verify(challenge);
  } catch {
    throw new Error("Invalid challenge");
  }
  if (decoded.purpose !== "2fa") throw new Error("Invalid challenge");

  const user = await User.findById(decoded.id).select(SECRET_FIELDS);
  if (
    !user ||
    user.deletedAt ||
    user.isBlocked ||
    !user.twoFactor?.enabled ||
    (user.tokenVersion ?? 0) !== (decoded.tv ?? 0)
  ) {
    throw new Error("Invalid challenge");
  }

  const result = await consumeSecondFactor(user, factors);
  if (!result) throw new Error("Invalid code");
  return { user, ...result };
};

/** Turn two-factor off; needs the password and a current code */
export const disableTwoFactor = async (userId, { password, code, recoveryCode }) => {
  const user = await loadUser(userId);
  if (!user.twoFactor?.enabled) throw new Error("Two-factor not enabled");
  if (!(await user.comparePassword(password))) throw new Error("Invalid password");
  if (!(await consumeSecondFactor(user, { code, recoveryCode }))) throw new Error("Invalid code");

  await User.updateOne({ _id: user._id }, { $set: { twoFactor: { enabled: false } } });
};

/** Replace the recovery codes; needs a current code */
export const regenerateRecoveryCodes = async (userId, code) => {
  const user = await loadUser(userId);
  if (!user.twoFactor?.enabled) throw new Error("Two-factor not enabled");
  if (!(await consumeSecondFactor(user, { code }))) throw new Error("Invalid code");

  const recoveryCodes = generateRecoveryCodes();
  await User.updateOne(
    { _id: user._id },
    { $set: { "twoFactor.recoveryCodes": recoveryCodes.map(hashRecoveryCode) } }
  );
  return recoveryCodes;
};

/** What the profile page shows */
export const twoFactorStatus = async (userId) => {
  const user = await User.findById(userId).select("+twoFactor.recoveryCodes");
  return {
    enabled: Boolean(user?.twoFactor?.enabled),
    enabledAt: user?.twoFactor?.enabledAt,
    recoveryCodesLeft: user?.twoFactor?.enabled ? user.twoFactor.recoveryCodes?.length ?? 0 : 0,
  };
};
