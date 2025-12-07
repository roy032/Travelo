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

export const getUserCount = async () => {
  try {
    return await User.countDocuments();
  } catch (e) {
    throw new Error("Error counting users");
  }
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
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new Error("User not found");
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    // Return user without password
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
    };
  } catch (e) {
    throw e;
  }
};
