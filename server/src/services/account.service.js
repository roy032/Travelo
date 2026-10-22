import { createHash, randomBytes } from "crypto";
import User from "#models/user.model.js";
import { appLink, queueEmail } from "#services/email/email.service.js";
import {
  passwordChangedTemplate,
  passwordResetTemplate,
  verifyEmailTemplate,
} from "#services/email/templates.js";

export const EMAIL_VERIFICATION_TTL_HOURS = 24;
export const PASSWORD_RESET_TTL_MINUTES = 60;

export const hashToken = (token) =>
  createHash("sha256").update(String(token)).digest("hex");

// 256 random bits; only the hash is stored so a database leak can't be used
// to reset passwords
const createToken = () => {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashToken(token) };
};

/**
 * Email a new verification link to the user (replaces any earlier link)
 * @param {Object} user - User document or { _id, name, email }
 */
export const sendVerificationEmail = async (user) => {
  const { token, hash } = createToken();

  await User.updateOne(
    { _id: user._id ?? user.id },
    {
      emailVerificationToken: hash,
      emailVerificationExpires: new Date(
        Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000
      ),
    }
  );

  queueEmail({
    to: user.email,
    ...verifyEmailTemplate({
      name: user.name,
      url: appLink("/verify-email", { token }),
      expiresInHours: EMAIL_VERIFICATION_TTL_HOURS,
    }),
  });
};

/**
 * Resend the verification link for a signed-in user
 * @throws {Error} "User not found" | "Email already verified"
 */
export const resendVerificationEmail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }
  if (user.emailVerified) {
    throw new Error("Email already verified");
  }
  await sendVerificationEmail(user);
};

/**
 * Mark the email behind a verification link as verified
 * @returns {Promise<Object>} { id, email }
 * @throws {Error} "Invalid or expired token"
 */
export const verifyEmail = async (token) => {
  const user = await User.findOneAndUpdate(
    {
      emailVerificationToken: hashToken(token),
      emailVerificationExpires: { $gt: new Date() },
    },
    {
      emailVerified: true,
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
    },
    { returnDocument: "after" }
  );

  if (!user) {
    throw new Error("Invalid or expired token");
  }

  return { id: user._id, email: user.email };
};

/**
 * Email a password reset link if an account exists for this address.
 * Resolves the same way whether or not it does, so callers can't use it to
 * find out which emails are registered.
 */
export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user || user.isBlocked) {
    return;
  }

  const { token, hash } = createToken();
  user.passwordResetToken = hash;
  user.passwordResetExpires = new Date(
    Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000
  );
  await user.save();

  queueEmail({
    to: user.email,
    ...passwordResetTemplate({
      name: user.name,
      url: appLink("/reset-password", { token }),
      expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
    }),
  });
};

/**
 * Set a new password using a reset link. The link works once.
 * @throws {Error} "Invalid or expired token"
 */
export const resetPassword = async (token, password) => {
  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    throw new Error("Invalid or expired token");
  }

  // Hashed by the pre-save hook
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Opening the link proves the user controls the inbox
  user.emailVerified = true;
  await user.save();

  queueEmail({ to: user.email, ...passwordChangedTemplate({ name: user.name }) });

  return { id: user._id, email: user.email };
};
