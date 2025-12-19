import {
  createReportSchema,
  updateReportStatusSchema,
  filterReportsSchema,
} from "#validations/report.validation.js";
import { formatValidationError } from "#utils/format.js";
import {
  createTripReport,
  getAllReports,
  getReportById,
  updateReportStatus,
  getReportStatistics,
} from "#services/report.service.js";

/**
 * Create a new report for a trip
 * POST /trips/:tripId/report
 * Works for both authenticated and unauthenticated users
 */
export const reportTrip = async (req, res, next) => {
  try {
    const { tripId } = req.params;
    const reporterId = req.user?.id || null; // null for anonymous reports

    // Validate request body
    const validationResult = createReportSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const reportData = validationResult.data;

    // Create report
    const report = await createTripReport(tripId, reporterId, reportData);

    res.status(201).json({
      message: "Trip reported successfully",
      report,
    });
  } catch (e) {
    if (e.message === "Trip not found") {
      return res.status(404).json({
        error: "Not found",
        message: "The specified trip does not exist",
      });
    }

    if (e.message === "Cannot report a deleted trip") {
      return res.status(400).json({
        error: "Invalid operation",
        message: "This trip has been removed and cannot be reported",
      });
    }

    if (e.message === "You have already reported this trip") {
      return res.status(409).json({
        error: "Duplicate report",
        message: "You have already submitted a report for this trip",
      });
    }

    next(e);
  }
};

/**
 * Get all reports (admin only)
 * GET /admin/reports
 */
export const fetchAllReports = async (req, res, next) => {
  try {
    // Validate query parameters
    const validationResult = filterReportsSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const filters = validationResult.data;
    const result = await getAllReports(filters);

    res.status(200).json({
      message: "Reports retrieved successfully",
      ...result,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Get a single report by ID (admin only)
 * GET /admin/reports/:reportId
 */
export const fetchReportById = async (req, res, next) => {
  try {
    const { reportId } = req.params;

    const report = await getReportById(reportId);

    res.status(200).json({
      message: "Report retrieved successfully",
      report,
    });
  } catch (e) {
    if (e.message === "Report not found") {
      return res.status(404).json({
        error: "Not found",
        message: "The specified report does not exist",
      });
    }

    next(e);
  }
};

/**
 * Update report status (admin only)
 * PATCH /admin/reports/:reportId
 */
export const updateReportStatusHandler = async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const adminId = req.user.id;

    // Validate request body
    const validationResult = updateReportStatusSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const updateData = validationResult.data;
    const report = await updateReportStatus(reportId, adminId, updateData);

    res.status(200).json({
      message: "Report status updated successfully",
      report,
    });
  } catch (e) {
    if (e.message === "Report not found") {
      return res.status(404).json({
        error: "Not found",
        message: "The specified report does not exist",
      });
    }

    next(e);
  }
};

/**
 * Get report statistics (admin only)
 * GET /admin/reports/statistics
 */
export const fetchReportStatistics = async (req, res, next) => {
  try {
    const statistics = await getReportStatistics();

    res.status(200).json({
      message: "Report statistics retrieved successfully",
      statistics,
    });
  } catch (e) {
    next(e);
  }
};
