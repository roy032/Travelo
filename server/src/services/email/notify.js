import User from "#models/user.model.js";
import { queueEmail } from "./email.service.js";

/**
 * Email a trip update to a user if they have a verified address and haven't
 * turned email notifications off. Never throws: the in-app notification is
 * the source of truth and email is best effort.
 * @param {string} userId - Recipient
 * @param {(user: Object) => Object} buildEmail - Returns { subject, text, html }
 * @returns {Promise<boolean>} Whether an email was queued
 */
export const emailUser = async (userId, buildEmail) => {
  try {
    const user = await User.findById(userId).select(
      "name email emailVerified emailNotifications isBlocked"
    );
    // Unverified addresses may belong to someone else, so they only ever get
    // the verification and password reset emails
    if (
      !user ||
      !user.emailVerified ||
      user.emailNotifications === false ||
      user.isBlocked
    ) {
      return false;
    }
    queueEmail({ to: user.email, ...buildEmail(user) });
    return true;
  } catch (error) {
    console.error(`Failed to queue notification email: ${error.message}`);
    return false;
  }
};
