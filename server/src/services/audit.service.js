import AdminActionLog from "#models/adminActionLog.model.js";

/**
 * Record an admin action on a user. Never throws: a failed audit write is
 * logged, and the action it describes has already happened.
 * @param {import("express").Request} req - the admin's request
 * @param {Object} entry
 * @param {string} entry.actionType - see AdminActionLog actionType
 * @param {string} entry.targetId - the user acted on
 * @param {string} entry.message - what happened, in words
 * @param {Object} [entry.metadata]
 */
export const logUserAction = async (req, { actionType, targetId, message, metadata }) => {
  try {
    await AdminActionLog.create({
      admin: req.user.id,
      actionType,
      targetType: "user",
      targetId,
      message,
      metadata,
      ipAddress: req.ip,
    });
  } catch (error) {
    console.error("Audit log write failed", { actionType, targetId, error: error.message });
  }
};

/**
 * Newest admin actions first
 * @param {{page?: number, limit?: number}} options
 */
export const listAdminActions = async ({ page = 1, limit = 50 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const [entries, total] = await Promise.all([
    AdminActionLog.find()
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate("admin", "name email")
      .select("-ipAddress")
      .lean(),
    AdminActionLog.countDocuments(),
  ]);
  return { entries, total, page: safePage, limit: safeLimit };
};
