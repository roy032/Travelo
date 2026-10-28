import {
  signupSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "#validations/auth.validation.js";
import { formatValidationError } from "#utils/format.js";
import { createUser, authenticateUser } from "#services/auth.service.js";
import {
  requestPasswordReset,
  resendVerificationEmail,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
} from "#services/account.service.js";
import { signSessionToken } from "#services/session.service.js";
import { createSignInChallenge } from "#services/twoFactor.service.js";
import { cookies } from "#utils/cookies.js";

export const signup = async (req, res, next) => {
  try {
    const validationResult = signupSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { name, email, password } = validationResult.data;

    // Role is never taken from the request body. New accounts are always
    // regular users; ADMIN_EMAILS accounts are promoted when they sign in.
    const verificationStatus = "unverified";
    const role = "user";

    const user = await createUser({
      name,
      email,
      password,
      role,
      verificationStatus,
      domesticVerification: { status: verificationStatus },
      internationalVerification: { status: verificationStatus },
    });
    const token = signSessionToken(user);

    cookies.set(res, "token", token);

    await sendVerificationEmail(user);

    res.status(201).json({
      message: "User registered",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        verificationStatus: user.verificationStatus,
        domesticVerification: user.domesticVerification,
        internationalVerification: user.internationalVerification,
      },
    });
  } catch (e) {
    if (e.message === "User with this email already exists") {
      return res.status(409).json({ error: "Email already exist" });
    }

    next(e);
  }
};

export const signIn = async (req, res, next) => {
  try {
    const validationResult = signInSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { email, password } = validationResult.data;

    const user = await authenticateUser({ email, password });

    // The password was right, but the session waits for the app code
    if (user.twoFactorEnabled) {
      return res.status(200).json({
        message: "Enter the code from your authenticator app",
        twoFactorRequired: true,
        challenge: createSignInChallenge(user),
      });
    }

    const token = signSessionToken(user);

    cookies.set(res, "token", token);

    res.status(200).json({
      message: "User signed in successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        verificationStatus: user.verificationStatus,
        domesticVerification: user.domesticVerification,
        internationalVerification: user.internationalVerification,
      },
    });
  } catch (e) {
    if (e.message === "User not found" || e.message === "Invalid password") {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (e.message === "User is blocked") {
      return res.status(403).json({
        error: "Access denied",
        message: "This account has been blocked",
      });
    }

    next(e);
  }
};

export const signOut = async (req, res, next) => {
  try {
    cookies.clear(res, "token");
    res.status(200).json({
      message: "User signed out successfully",
    });
  } catch (e) {
    next(e);
  }
};

const validationFailed = (res, error) =>
  res.status(400).json({
    error: "Validation failed",
    details: formatValidationError(error),
  });

const INVALID_LINK = {
  error: "Invalid or expired link",
  message:
    "This link is invalid or has expired. Please request a new one.",
};

// Same response whether or not the email is registered
const RESET_REQUESTED_MESSAGE =
  "If an account exists for that email, we've sent a link to reset the password.";

export const forgotPassword = async (req, res, next) => {
  try {
    const validationResult = forgotPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return validationFailed(res, validationResult.error);
    }

    await requestPasswordReset(validationResult.data.email);

    res.status(200).json({ message: RESET_REQUESTED_MESSAGE });
  } catch (e) {
    next(e);
  }
};

export const resetPasswordController = async (req, res, next) => {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      return validationFailed(res, validationResult.error);
    }

    const { token, password } = validationResult.data;
    await resetPassword(token, password);

    // Sign out this browser; the user signs in with the new password
    cookies.clear(res, "token");
    res.status(200).json({
      message: "Your password has been reset. You can now sign in.",
    });
  } catch (e) {
    if (e.message === "Invalid or expired token") {
      return res.status(400).json(INVALID_LINK);
    }
    next(e);
  }
};

export const verifyEmailController = async (req, res, next) => {
  try {
    const validationResult = verifyEmailSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(INVALID_LINK);
    }

    const result = await verifyEmail(validationResult.data.token);

    res.status(200).json({
      message: "Your email address is confirmed",
      email: result.email,
    });
  } catch (e) {
    if (e.message === "Invalid or expired token") {
      return res.status(400).json(INVALID_LINK);
    }
    next(e);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    await resendVerificationEmail(req.user.id);
    res.status(200).json({
      message: "We've sent a new confirmation link to your email",
    });
  } catch (e) {
    if (e.message === "Email already verified") {
      return res.status(400).json({
        error: "Already verified",
        message: "Your email address is already confirmed",
      });
    }
    if (e.message === "User not found") {
      return res.status(404).json({
        error: "Resource not found",
        message: "User not found",
      });
    }
    next(e);
  }
};
