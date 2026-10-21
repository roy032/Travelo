import bcrypt from "bcrypt";
import User from "#models/user.model.js";

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    throw new Error("Error hashing");
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (e) {
    throw new Error("Error comparing password");
  }
};

/**
 * Emails listed in ADMIN_EMAILS (comma-separated) are made admins when they
 * sign in. Signing up never grants admin: there is no email verification, so
 * anyone could register an address before its owner does.
 */
export const getConfiguredAdminEmails = () =>
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isConfiguredAdmin = (email) =>
  typeof email === "string" &&
  getConfiguredAdminEmails().includes(email.trim().toLowerCase());

/**
 * Promote a user to admin (and mark them verified)
 * @param {string} email - The user's email address
 * @returns {Promise<Object|null>} Updated user, or null if no such user
 */
export const promoteToAdmin = async (email) => {
  return await User.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    {
      role: "admin",
      verificationStatus: "verified",
      "domesticVerification.status": "verified",
      "internationalVerification.status": "verified",
    },
    { new: true }
  );
};

/**
 * Create a new user account
 * @param {Object} userData - User registration data
 * @param {string} userData.name - User's full name
 * @param {string} userData.email - User's email address
 * @param {string} userData.password - User's password (will be hashed)
 * @param {string} [userData.role='user'] - User's role (user or admin)
 * @returns {Promise<Object>} Created user object
 * @throws {Error} If email already exists or validation fails
 */
export const createUser = async ({
  name,
  email,
  password,
  role = "user",
  verificationStatus,
  domesticVerification,
  internationalVerification,
}) => {
  try {
    // Check if user with email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({
      name,
      email,
      password,
      role,
      verificationStatus,
      domesticVerification,
      internationalVerification,
    });

    await user.save();

    // Return user without password
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      verificationStatus: user.verificationStatus,
      domesticVerification: user.domesticVerification,
      internationalVerification: user.internationalVerification,
      createdAt: user.createdAt,

    };
  } catch (e) {
    throw e;
  }
};

/**
 * Authenticate a user with email and password
 * @param {Object} credentials - User login credentials
 * @param {string} credentials.email - User's email address
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Authenticated user object
 * @throws {Error} If user not found or password is invalid
 */
export const authenticateUser = async ({ email, password }) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );
    if (!user) {
      throw new Error("User not found");
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    if (user.isBlocked) {
      throw new Error("User is blocked");
    }

    if (user.role !== "admin" && isConfiguredAdmin(user.email)) {
      const promoted = await promoteToAdmin(user.email);
      user.role = promoted.role;
      user.verificationStatus = promoted.verificationStatus;
      user.domesticVerification = promoted.domesticVerification;
      user.internationalVerification = promoted.internationalVerification;
    }

    // Return user without password
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      verificationStatus: user.verificationStatus,
      domesticVerification: { status: user.domesticVerification?.status },
      internationalVerification: {
        status: user.internationalVerification?.status,
      },
    };
  } catch (e) {
    throw e;
  }
};
