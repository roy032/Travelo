import { randomBytes } from "crypto";
import User from "#models/user.model.js";
import Trip from "#models/trip.model.js";
import Activity from "#models/activity.model.js";
import Checklist from "#models/checklist.model.js";
import Expense from "#models/expense.model.js";
import Settlement from "#models/settlement.model.js";
import Note from "#models/note.model.js";
import Photo from "#models/photo.model.js";
import Message from "#models/message.model.js";
import Notification from "#models/notification.model.js";
import Invitation from "#models/invitation.model.js";
import Favorite from "#models/favorite.model.js";
import Review from "#models/review.model.js";
import Report from "#models/report.model.js";
import { deleteFiles } from "#config/uploadthing.config.js";
import { refreshDestinationRating } from "#services/review.service.js";
import { createNotification } from "#services/notification.service.js";
import { disconnectUserSockets } from "#src/socket/chatSocket.js";

export const DELETED_USER_NAME = "Deleted user";

const idOf = (value) => String(value?._id ?? value);

// Stored files are removed best effort: a storage outage must not leave the
// account half deleted
const removeFiles = async (keys) => {
  const present = keys.filter(Boolean);
  if (present.length === 0) return;
  try {
    await deleteFiles(present);
  } catch (error) {
    console.error("Account deletion: could not remove files", error.message);
  }
};

/**
 * Permanently remove a trip and everything in it
 * @param {string} tripId
 */
const purgeTrip = async (tripId) => {
  const [photos, expenses] = await Promise.all([
    Photo.find({ trip: tripId }).select("fileKey").lean(),
    Expense.find({ trip: tripId, "receipt.key": { $exists: true } })
      .select("receipt.key")
      .lean(),
  ]);
  await removeFiles([
    ...photos.map((p) => p.fileKey),
    ...expenses.map((e) => e.receipt?.key),
  ]);

  const byTrip = { trip: tripId };
  await Promise.all([
    Activity.deleteMany(byTrip),
    Checklist.deleteMany(byTrip),
    Expense.deleteMany(byTrip),
    Settlement.deleteMany(byTrip),
    Note.deleteMany(byTrip),
    Photo.deleteMany(byTrip),
    Message.deleteMany(byTrip),
    Invitation.deleteMany(byTrip),
    Report.deleteMany(byTrip),
    Favorite.deleteMany({ itemType: "trip", item: tripId }),
    Notification.deleteMany({ relatedTrip: tripId }),
  ]);
  await Trip.deleteOne({ _id: tripId });
};

/**
 * Delete an account and the personal data attached to it.
 *
 * - Trips the user owns alone are deleted with everything in them.
 * - Trips the user owns with other members pass to the longest-standing
 *   other member, so the group keeps its plans.
 * - The user leaves every other trip.
 * - Personal content is deleted: chat messages, uploaded photos, private
 *   notes, reviews, favorites, notifications, invitations, reports and
 *   identity documents.
 * - Shared trip records the group relies on (expenses, settlements,
 *   itinerary items, checklist items, shared notes) stay, credited to
 *   "Deleted user". The account document is kept only as that anonymous
 *   placeholder: name, email, password and documents are wiped, and it can
 *   never sign in again. The email address is free to register again.
 *
 * @param {string} userId
 * @returns {Promise<{deletedTrips: number, transferredTrips: number}>}
 */
export const deleteAccount = async (userId) => {
  const user = await User.findById(userId);
  if (!user || user.deletedAt) {
    throw new Error("User not found");
  }

  const ownedTrips = await Trip.find({ owner: userId })
    .select("title members isDeleted")
    .lean();

  let deletedTrips = 0;
  let transferredTrips = 0;
  for (const trip of ownedTrips) {
    const heir = trip.members.find((member) => idOf(member) !== String(userId));
    if (trip.isDeleted || !heir) {
      await purgeTrip(trip._id);
      deletedTrips += 1;
      continue;
    }
    await Trip.updateOne(
      { _id: trip._id },
      { owner: heir, $pull: { members: user._id } }
    );
    transferredTrips += 1;
    await createNotification({
      user: heir,
      type: "trip_owner_changed",
      title: "You now own a trip",
      message: `The owner of "${trip.title}" deleted their account, so you are now its owner.`,
      relatedTrip: trip._id,
    }).catch(() => {});
  }

  await Trip.updateMany({ members: user._id }, { $pull: { members: user._id } });

  // Personal content
  const photos = await Photo.find({ uploader: userId }).select("fileKey").lean();
  await removeFiles([
    ...photos.map((p) => p.fileKey),
    user.verificationDocument?.key,
    user.domesticVerification?.document?.key,
    user.internationalVerification?.document?.key,
  ]);

  const reviewedDestinations = await Review.distinct("destination", {
    user: userId,
  });

  await Promise.all([
    Message.deleteMany({ sender: userId }),
    Message.updateMany(
      { "readBy.user": userId },
      { $pull: { readBy: { user: userId } } }
    ),
    Photo.deleteMany({ uploader: userId }),
    Note.deleteMany({ creator: userId, visibility: "private" }),
    Review.deleteMany({ user: userId }),
    Favorite.deleteMany({ user: userId }),
    Favorite.deleteMany({ itemType: "user", item: userId }),
    Notification.deleteMany({
      $or: [{ user: userId }, { relatedResource: user._id }],
    }),
    Invitation.deleteMany({
      $or: [{ invitedUser: userId }, { invitedBy: userId }],
    }),
    Report.deleteMany({ reporter: userId }),
  ]);
  await Promise.all(reviewedDestinations.map(refreshDestinationRating));

  // Keep an anonymous placeholder so shared records still resolve
  await User.replaceOne(
    { _id: user._id },
    {
      name: DELETED_USER_NAME,
      email: `deleted-${user._id}@deleted.invalid`,
      // Not a bcrypt hash, so no password can ever match it
      password: `!deleted-${randomBytes(16).toString("hex")}`,
      role: "user",
      isBlocked: true,
      emailNotifications: false,
      tokenVersion: (user.tokenVersion || 0) + 1,
      deletedAt: new Date(),
      createdAt: user.createdAt,
    }
  );

  disconnectUserSockets(String(user._id));

  return { deletedTrips, transferredTrips };
};

const pick = (doc, fields) =>
  Object.fromEntries(fields.map((field) => [field, doc[field]]));

/**
 * Everything Travelo stores about a user, as one JSON document they can
 * download (GDPR right of access and data portability)
 * @param {string} userId
 */
export const exportAccountData = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user || user.deletedAt) {
    throw new Error("User not found");
  }

  const [
    trips,
    activities,
    checklistItems,
    expenses,
    settlements,
    notes,
    photos,
    messages,
    reviews,
    favorites,
    notifications,
    invitations,
    reports,
  ] = await Promise.all([
    Trip.find({ members: userId, isDeleted: false })
      .select(
        "title description startDate endDate destinationType tripCategory owner baseCurrency budget createdAt"
      )
      .lean(),
    Activity.find({ creator: userId }).lean(),
    Checklist.find({ creator: userId }).lean(),
    Expense.find({
      $or: [{ creator: userId }, { payer: userId }, { splitBetween: userId }],
    }).lean(),
    Settlement.find({ $or: [{ from: userId }, { to: userId }] }).lean(),
    Note.find({ creator: userId }).lean(),
    Photo.find({ uploader: userId }).select("-__v").lean(),
    Message.find({ sender: userId }).select("trip text createdAt").lean(),
    Review.find({ user: userId }).lean(),
    Favorite.find({ user: userId }).lean(),
    Notification.find({ user: userId }).lean(),
    Invitation.find({
      $or: [{ invitedUser: userId }, { invitedBy: userId }],
    }).lean(),
    Report.find({ reporter: userId }).lean(),
  ]);

  const documentInfo = (doc) =>
    doc?.filename
      ? pick(doc, ["filename", "size", "uploadedAt", "reviewedAt"])
      : undefined;

  return {
    exportedAt: new Date().toISOString(),
    format: "travelo-account-export/1",
    account: {
      id: String(user._id),
      ...pick(user, [
        "name",
        "email",
        "role",
        "emailVerified",
        "emailNotifications",
        "createdAt",
        "updatedAt",
      ]),
      domesticVerification: {
        status: user.domesticVerification?.status,
        document: documentInfo(user.domesticVerification?.document),
      },
      internationalVerification: {
        status: user.internationalVerification?.status,
        document: documentInfo(user.internationalVerification?.document),
      },
    },
    trips: trips.map((trip) => ({
      ...trip,
      role: idOf(trip.owner) === String(userId) ? "owner" : "member",
    })),
    activities,
    checklistItems,
    expenses,
    settlements,
    notes,
    photos,
    messages,
    reviews,
    favorites,
    notifications,
    invitations,
    reports,
  };
};
