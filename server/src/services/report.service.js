import Report from "#models/report.model.js";
import Trip from "#models/trip.model.js";
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
 * @param {object} updateData - Status and resolution
 * @returns {Promise<object>} Updated report
 */
export const updateReportStatus = async (reportId, adminId, updateData) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new Error("Report not found");
  }

  report.status = updateData.status;
  report.reviewedBy = adminId;
  report.reviewedAt = new Date();

  if (updateData.resolution) {
    report.resolution = updateData.resolution;
  }

  await report.save();
  await report.populate([
    { path: "reporter", select: "name email" },
    { path: "trip", select: "title owner" },
    { path: "reviewedBy", select: "name email" },
  ]);

  return report;
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
