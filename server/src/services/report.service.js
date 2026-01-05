import Report from "#models/report.model.js";
import Trip from "#models/trip.model.js";
import AdminActionLog from "#models/adminActionLog.model.js";
import { createNotification } from "#services/notification.service.js";
import mongoose from "mongoose";

/**
 * Create a new report for a trip
 * @param {string} tripId - Trip ID
 * @param {string|null} reporterId - Reporter's user ID (null for anonymous)
 * @param {object} reportData - Report data (category, description)
 * @returns {Promise<object>} Created report
 */
export const createTripReport = async (tripId, reporterId, reportData) => {
  // Verify trip exists
  const trip = await Trip.findById(tripId);
  if (!trip) {
    throw new Error("Trip not found");
  }

  // Check if trip is already deleted
  if (trip.isDeleted) {
    throw new Error("Cannot report a deleted trip");
  }

  // Check if authenticated user already reported this trip
  if (reporterId) {
    const existingReport = await Report.findOne({
      trip: tripId,
      reporter: reporterId,
    });

    if (existingReport) {
      throw new Error("You have already reported this trip");
    }
  }

  // Create the report
  const report = await Report.create({
    trip: tripId,
    reporter: reporterId || null, // null for anonymous reports
    category: reportData.category,
    description: reportData.description,
    status: "pending",
  });

  // Populate reporter and trip details
  await report.populate([
    { path: "reporter", select: "name email" },
    { path: "trip", select: "title owner" },
  ]);

  return report;
};

/**
 * Get all reports with filtering, sorting, and pagination
 * @param {object} filters - Filter options
 * @returns {Promise<object>} Paginated reports
 */
export const getAllReports = async (filters = {}) => {
  const {
    category,
    status,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  // Build query
  const query = {};
  if (category) query.category = category;
  if (status) query.status = status;

  // Calculate pagination
  const skip = (page - 1) * limit;
  const sortOptions = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  // Execute query with population
  const [reports, totalCount] = await Promise.all([
    Report.find(query)
      .populate("reporter", "name email")
      .populate("trip", "title owner isDeleted")
      .populate("reviewedBy", "name email")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Report.countDocuments(query),
  ]);

  return {
    reports,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalReports: totalCount,
      reportsPerPage: limit,
    },
  };
};

/**
 * Get a single report by ID
 * @param {string} reportId - Report ID
 * @returns {Promise<object>} Report details
 */
export const getReportById = async (reportId) => {
  const report = await Report.findById(reportId)
    .populate("reporter", "name email")
    .populate("trip", "title description owner members startDate endDate")
    .populate("reviewedBy", "name email");

  if (!report) {
    throw new Error("Report not found");
  }

  return report;
};

/**
 * Update report status (admin action)
 * @param {string} reportId - Report ID
 * @param {string} adminId - Admin user ID
 * @param {object} updateData - Status and message
 * @param {string} ipAddress - IP address of admin (optional)
 * @returns {Promise<object>} Updated report
 */
export const updateReportStatus = async (
  reportId,
  adminId,
  updateData,
  ipAddress = null
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const report = await Report.findById(reportId)
      .populate("trip", "title owner")
      .populate("reporter", "name email")
      .session(session);

    if (!report) {
      throw new Error("Report not found");
    }

    const { message } = updateData;

    // Update report - always mark as resolved when dismissed
    report.status = "resolved";
    report.reviewedBy = adminId;
    report.reviewedAt = new Date();
    report.resolution = message;

    await report.save({ session });

    // Action type is always dismissed (which resolves the report)
    const actionType = "report_dismissed";

    // Create admin action log
    await AdminActionLog.create(
      [
        {
          admin: adminId,
          actionType: actionType,
          targetType: "report",
          targetId: reportId,
          message: message,
          metadata: {
            reportCategory: report.category,
            tripId: report.trip?._id,
            reporterId: report.reporter?._id,
          },
          ipAddress,
        },
      ],
      { session }
    );

    // Create notifications
    const notificationPromises = [];

    // Notification configuration for dismissed report (marked as resolved)
    const notifConfig = {
      title: "Report Dismissed",
      typeReporter: "report_dismissed",
      typeTripOwner: "report_dismissed",
    };

    // Notify reporter (if not anonymous)
    if (report.reporter?._id) {
      notificationPromises.push(
        createNotification({
          user: report.reporter._id,
          type: notifConfig.typeReporter,
          title: notifConfig.title,
          message: `Your report about "${report.trip?.title || "a trip"}" has been dismissed and marked as resolved. Admin message: ${message}`,
          relatedResource: reportId,
        })
      );
    }

    // Notify trip owner (if trip exists and owner is different from reporter)
    if (
      report.trip?.owner &&
      (!report.reporter?._id ||
        report.trip.owner.toString() !== report.reporter._id.toString())
    ) {
      notificationPromises.push(
        createNotification({
          user: report.trip.owner,
          type: notifConfig.typeTripOwner,
          title: `Report About Your Trip: ${notifConfig.title}`,
          message: `A report about your trip "${report.trip?.title || "Untitled"}" has been dismissed and marked as resolved. Admin message: ${message}`,
          relatedResource: reportId,
        })
      );
    }

    await Promise.all(notificationPromises);

    await session.commitTransaction();

    // Populate and return updated report
    await report.populate([
      { path: "reporter", select: "name email" },
      { path: "trip", select: "title owner" },
      { path: "reviewedBy", select: "name email" },
    ]);

    return report;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get report statistics
 * @returns {Promise<object>} Report statistics
 */
export const getReportStatistics = async () => {
  const stats = await Report.aggregate([
    {
      $facet: {
        byStatus: [
          { $group: { _id: "$status", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        byCategory: [
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        total: [{ $count: "count" }],
        pending: [{ $match: { status: "pending" } }, { $count: "count" }],
      },
    },
  ]);

  const result = stats[0];
  return {
    total: result.total[0]?.count || 0,
    pending: result.pending[0]?.count || 0,
    byStatus: result.byStatus,
    byCategory: result.byCategory,
  };
};

/**
 * Delete all reports for a specific trip
 * @param {string} tripId - Trip ID
 * @returns {Promise<number>} Number of reports deleted
 */
export const deleteReportsByTripId = async (tripId) => {
  const result = await Report.deleteMany({ trip: tripId });
  return result.deletedCount;
};
