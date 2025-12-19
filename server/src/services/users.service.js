import User from "#models/user.model.js";
import bcrypt from "bcrypt";

export const getAllUsers = async () => {
  try {
    //  TODO: get all users
  } catch (e) {
    throw e;
  }
};

/**
 * Get user profile by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User profile object
 * @throws {Error} If user not found
 */
export const getUserProfile = async (id) => {
  try {
    const user = await User.findById(id).select("-password");

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      domesticVerification: user.domesticVerification,
      internationalVerification: user.internationalVerification,
      verificationDocument: user.verificationDocument,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

export const getUserById = async (id) => {
  try {
    // TODO: get user by id

    return user;
  } catch (e) {
    throw e;
  }
};

/**
 * Update user profile
 * @param {string} id - User ID
 * @param {Object} updates - Profile updates
 * @param {string} [updates.name] - Updated name
 * @param {string} [updates.email] - Updated email
 * @param {string} [updates.currentPassword] - Current password (required for password change)
 * @param {string} [updates.newPassword] - New password
 * @returns {Promise<Object>} Updated user profile
 * @throws {Error} If user not found, email already exists, or password verification fails
 */
export const updateProfile = async (id, updates) => {
  try {
    const user = await User.findById(id);

    if (!user) {
      throw new Error("User not found");
    }

    // Handle email update with uniqueness check
    if (updates.email && updates.email !== user.email) {
      const existingUser = await User.findOne({
        email: updates.email.toLowerCase(),
      });
      if (existingUser) {
        throw new Error("Email already exists");
      }
      user.email = updates.email;
    }

    // Handle name update
    if (updates.name) {
      user.name = updates.name;
    }

    // Handle password change
    if (updates.newPassword) {
      // Require current password verification
      if (!updates.currentPassword) {
        throw new Error("Current password is required to change password");
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(
        updates.currentPassword
      );
      if (!isPasswordValid) {
        throw new Error("Current password is incorrect");
      }

      // Set new password (will be hashed by pre-save hook)
      user.password = updates.newPassword;
    }

    await user.save();

    // Return updated user without password
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      domesticVerification: user.domesticVerification,
      internationalVerification: user.internationalVerification,
      verificationDocument: user.verificationDocument,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (e) {
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    //  TODO: update user and return updated user
  } catch (e) {
    throw e;
  }
};

export const deleteUser = async (id) => {
  try {
    // TODO: delete user by id
  } catch (e) {
    throw e;
  }
};
