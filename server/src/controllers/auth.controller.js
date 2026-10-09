import { signupSchema, signInSchema } from "#validations/auth.validation.js";
import { formatValidationError } from "#utils/format.js";
import {
  createUser,
  authenticateUser,
  getUserCount,
} from "#services/auth.service.js";
import { jwtToken } from "#utils/jwt.js";
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

    // Role is never taken from the request body; only the first account becomes admin
    let verificationStatus = "unverified";
    let role = "user";

    const getUsers = await getUserCount();
    if (getUsers === 0) {
      // First user to register becomes admin
      role = "admin";
      verificationStatus = "verified";
    }

    const user = await createUser({
      name,
      email,
      password,
      role,
      verificationStatus,
      domesticVerification: { status: verificationStatus },
      internationalVerification: { status: verificationStatus },
    });
    const token = jwtToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      domesticVerification: user.domesticVerification,
      internationalVerification: user.internationalVerification,
    });

    cookies.set(res, "token", token);

    res.status(201).json({
      message: "User registered",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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

    const token = jwtToken.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      domesticVerification: user.domesticVerification,
      internationalVerification: user.internationalVerification,
    });

    cookies.set(res, "token", token);

    res.status(200).json({
      message: "User signed in successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
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
