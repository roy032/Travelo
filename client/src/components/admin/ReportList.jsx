import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reportApi } from "../../services/api.service";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Loader from "../ui/Loader";
import ReportDetails from "./ReportDetails";
import {
  Flag,
  Filter,
  TrendingUp,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * ReportList - Admin component to view and manage trip reports
 */
const ReportList = () => {
  const [reports, setReports] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "",
    status: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const categoryColors = {
    spam: "yellow",
    inappropriate: "red",
    fake: "orange",
    unsafe: "red",
    copyright: "purple",
    other: "gray",
  };

  const statusColors = {
    pending: "yellow",
    reviewed: "blue",
    resolved: "green",
    dismissed: "gray",
  };

  useEffect(() => {
    fetchReports();
    fetchStatistics();
  }, [filters]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await reportApi.getAllReports(filters);
      setReports(response.reports || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await reportApi.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleViewDetails = async (reportId) => {
    try {
      const report = await reportApi.getReportById(reportId);
      if (report) {
        setSelectedReport(report);
        setIsDetailsModalOpen(true);
      } else {
        toast.error("Report not found");
      }
    } catch (error) {
      console.error("Failed to load report details:", error);
      toast.error(error?.message || "Failed to load report details");
    }
  };

  const handleStatusUpdate = async (reportId, status, message) => {
    try {
      await reportApi.updateReportStatus(reportId, { status, message });
      toast.success("Report status updated successfully");
      fetchReports();
      fetchStatistics();
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error("Failed to update report status:", error);
      toast.error(error?.message || "Failed to update report status");
      throw error; // Re-throw to allow ReportDetails to handle it
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && reports.length === 0) {
    return (
      <div className='flex justify-center items-center min-h-[400px]'>
        <Loader />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Trip Reports</h1>
          <p className='text-gray-600 mt-1'>Review and manage reported trips</p>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-3 bg-blue-100 rounded-lg'>
                <Flag className='w-6 h-6 text-blue-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Total Reports</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {statistics.total}
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-3 bg-yellow-100 rounded-lg'>
                <AlertCircle className='w-6 h-6 text-yellow-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Pending Review</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {statistics.pending}
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-3 bg-red-100 rounded-lg'>
                <TrendingUp className='w-6 h-6 text-red-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Top Category</p>
                <p className='text-lg font-bold text-gray-900 capitalize'>
                  {statistics.byCategory[0]?._id || "N/A"}
                </p>
              </div>
            </div>
          </Card>

          <Card className='p-4'>
            <div className='flex items-center gap-3'>
              <div className='p-3 bg-green-100 rounded-lg'>
                <Eye className='w-6 h-6 text-green-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Resolved</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {statistics.byStatus.find((s) => s._id === "resolved")
                    ?.count || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className='p-4'>
        <div className='flex items-center gap-4 flex-wrap'>
          <div className='flex items-center gap-2'>
            <Filter className='w-5 h-5 text-gray-500' />
            <span className='font-medium text-gray-700'>Filters:</span>
          </div>

          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>All Categories</option>
            <option value='spam'>Spam</option>
            <option value='inappropriate'>Inappropriate</option>
            <option value='fake'>Fake</option>
            <option value='unsafe'>Unsafe</option>
            <option value='copyright'>Copyright</option>
            <option value='other'>Other</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className='px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500'
          >
            <option value=''>All Statuses</option>
            <option value='pending'>Pending</option>
            <option value='reviewed'>Reviewed</option>
            <option value='resolved'>Resolved</option>
            <option value='dismissed'>Dismissed</option>
          </select>

          {(filters.category || filters.status) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={() =>
                setFilters({ category: "", status: "", page: 1, limit: 20 })
              }
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>

      {/* Reports Table */}
      <Card>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b border-gray-200'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Trip
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Reporter
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Category
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Reported At
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {reports.length === 0 ? (
                <tr>
                  <td
                    colSpan='6'
                    className='px-6 py-12 text-center text-gray-500'
                  >
                    No reports found
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='font-medium text-gray-900'>
                          {report.trip?.title || "Deleted Trip"}
                        </p>
                        {report.trip?.isDeleted && (
                          <Badge color='gray' size='sm'>
                            Deleted
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div>
                        <p className='text-gray-900'>{report.reporter?.name}</p>
                        <p className='text-sm text-gray-500'>
                          {report.reporter?.email}
                        </p>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge
                        color={categoryColors[report.category]}
                        className='capitalize'
                      >
                        {report.category}
                      </Badge>
                    </td>
                    <td className='px-6 py-4'>
                      <Badge
                        color={statusColors[report.status]}
                        className='capitalize'
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td className='px-6 py-4 text-sm text-gray-500'>
                      {formatDate(report.createdAt)}
                    </td>
                    <td className='px-6 py-4'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleViewDetails(report._id)}
                      >
                        <Eye className='w-4 h-4 mr-1' />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
            <p className='text-sm text-gray-700'>
              Showing page {pagination.currentPage} of {pagination.totalPages} (
              {pagination.totalReports} total reports)
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
              >
                <ChevronLeft className='w-4 h-4' />
                Previous
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page === pagination.totalPages}
              >
                Next
                <ChevronRight className='w-4 h-4' />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Report Details Modal */}
      {selectedReport && isDetailsModalOpen && (
        <ReportDetails
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedReport(null);
          }}
          report={selectedReport}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={fetchReports}
        />
      )}
    </div>
  );
};

export default ReportList;
