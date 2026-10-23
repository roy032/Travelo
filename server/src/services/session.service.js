import User from "#models/user.model.js";
import { jwtToken } from "#utils/jwt.js";
import { disconnectUserSockets } from "#src/socket/chatSocket.js";

/**
 * Claims stored in the session cookie. Role and verification status are read
 * from the database on every request (see resolveSession), so they are only
 * here for older clients that decode the token.
 */
export const signSessionToken = (user) =>
  jwtToken.sign({
    id: String(user.id ?? user._id),
    email: user.email,
    role: user.role,
    tv: user.tokenVersion ?? 0,
  });

/**
 * Check a verified token against the current account. Returns the request
 * user, or null when the account was deleted or blocked, or the session was
 * revoked (password change, "sign out everywhere") after the token was issued.
 * @param {Object} decoded - Verified JWT payload
 * @returns {Promise<Object|null>}
 */
export const resolveSession = async (decoded) => {
  if (!decoded?.id) return null;

  const user = await User.findById(decoded.id)
    .select(
      "email role isBlocked tokenVersion deletedAt verificationStatus domesticVerification.status internationalVerification.status"
    )
    .lean();

  // Tokens issued before tokenVersion existed carry no "tv" and count as 0
  if (
    !user ||
    user.isBlocked ||
    user.deletedAt ||
    (user.tokenVersion ?? 0) !== (decoded.tv ?? 0)
  ) {
    return null;
  }

  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    verificationStatus: user.verificationStatus,
    domesticVerification: { status: user.domesticVerification?.status },
    internationalVerification: {
      status: user.internationalVerification?.status,
    },
  };
};

/**
 * Sign the user out on every device by invalidating all issued tokens
 * @param {string} userId
 */
export const revokeSessions = async (userId) => {
  await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
  disconnectUserSockets(String(userId));
};
