import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { adminApi } from "../../services/api.service";
import toast from "react-hot-toast";
import {
  Trash2,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  XCircle,
} from "lucide-react";

/**
 * ReportDetails - Modal showing detailed report information with admin actions
 * @param {boolean} isOpen - Modal open state
 * @param {function} onClose - Close handler
 * @param {object} report - Report object
 * @param {function} onStatusUpdate - Status update callback
 * @param {function} onRefresh - Refresh list callback
 */
const ReportDetails = ({
  isOpen,
  onClose,
  report,
  onStatusUpdate,
  onRefresh,
}) => {
  const [message, setMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

  const handleDeleteTrip = async () => {
    if (!report.trip?._id) {
      toast.error("Trip information not available");
      return;
    }

    if (!message || message.trim().length < 10) {
      toast.error("Please provide a deletion message (minimum 10 characters)");
      return;
    }

    setIsDeleting(true);
    try {
      await adminApi.deleteTrip(report.trip._id, message.trim(), report._id);
      toast.success("Trip deleted successfully");
      setShowDeleteConfirm(false);
      setMessage("");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Failed to delete trip:", error);
      toast.error(error?.message || "Failed to delete trip");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDismissReport = async () => {
    if (!message || message.trim().length < 10) {
      toast.error("Please provide a dismissal message (minimum 10 characters)");
      return;
    }

    setIsUpdatingStatus(true);
    try {
      await onStatusUpdate(report._id, "resolved", message.trim());
      toast.success("Report dismissed and marked as resolved");
      setMessage("");
      onClose();
    } catch (error) {
      console.error("Failed to dismiss report:", error);
      toast.error(error?.message || "Failed to dismiss report");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Report Details' size='lg'>
      <div className='space-y-6'>
        {/* Report Status and Category */}
        <div className='flex items-center justify-between pb-4 border-b'>
          <div className='flex items-center gap-3'>
            <Badge
              color={statusColors[report.status]}
              size='lg'
              className='capitalize'
            >
              {report.status}
            </Badge>
            <Badge
              color={categoryColors[report.category]}
              className='capitalize'
            >
              {report.category}
            </Badge>
          </div>
          <p className='text-sm text-gray-500'>
            <Calendar className='w-4 h-4 inline mr-1' />
            {formatDate(report.createdAt)}
          </p>
        </div>

        {/* Trip Information */}
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
            <FileText className='w-5 h-5' />
            Reported Trip
          </h3>
          <div className='space-y-2'>
            <p className='text-gray-900'>
              <span className='font-medium'>Title:</span>{" "}
              {report.trip?.title || "Deleted Trip"}
            </p>
            {report.trip?.description && (
              <p className='text-gray-700'>
                <span className='font-medium'>Description:</span>{" "}
                {report.trip.description}
              </p>
            )}
            {report.trip?.isDeleted && (
              <div className='flex items-center gap-2 mt-2'>
                <AlertTriangle className='w-4 h-4 text-red-500' />
                <span className='text-red-600 font-medium'>
                  This trip has been deleted
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Reporter Information */}
        <div className='bg-blue-50 p-4 rounded-lg'>
          <h3 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
            <User className='w-5 h-5' />
            Reporter
          </h3>
          <div className='space-y-1'>
            <p className='text-gray-900'>{report.reporter?.name}</p>
            <p className='text-gray-600 text-sm'>{report.reporter?.email}</p>
          </div>
        </div>

        {/* Report Description */}
        <div>
          <h3 className='font-semibold text-gray-900 mb-2'>
            Report Description
          </h3>
          <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-gray-700 whitespace-pre-wrap'>
              {report.description}
            </p>
          </div>
        </div>

        {/* Review Information */}
        {report.reviewedBy && (
          <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
            <h3 className='font-semibold text-gray-900 mb-2'>
              Review Information
            </h3>
            <div className='space-y-2 text-sm'>
              <p className='text-gray-700'>
                <span className='font-medium'>Reviewed by:</span>{" "}
                {report.reviewedBy?.name}
              </p>
              <p className='text-gray-700'>
                <span className='font-medium'>Reviewed at:</span>{" "}
                {formatDate(report.reviewedAt)}
              </p>
              {report.resolution && (
                <p className='text-gray-700'>
                  <span className='font-medium'>Resolution:</span>{" "}
                  {report.resolution}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Admin Actions */}
        {report.status === "pending" && (
          <div className='space-y-4 pt-4 border-t'>
            <h3 className='font-semibold text-gray-900'>Admin Actions</h3>

            {/* Action Message - Required */}
            <div>
              <label
                htmlFor='message'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Action Message <span className='text-red-500'>*</span>
              </label>
              <textarea
                id='message'
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='Explain your decision to the reporter and trip owner (minimum 10 characters, required)...'
                rows={4}
                maxLength={1000}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none ${
                  message.trim().length > 0 && message.trim().length < 10
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300"
                }`}
                required
              />
              <div className='mt-1 flex justify-between items-center text-sm'>
                <span
                  className={
                    message.trim().length < 10
                      ? "text-red-500"
                      : "text-gray-500"
                  }
                >
                  {message.trim().length < 10 && message.trim().length > 0
                    ? `${10 - message.trim().length} more characters required`
                    : "Minimum 10 characters required"}
                </span>
                <span className='text-gray-500'>
                  {message.length}/1000 characters
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-wrap gap-3'>
              <Button
                variant='outline'
                onClick={handleDismissReport}
                className='gap-2'
                disabled={
                  isUpdatingStatus || isDeleting || message.trim().length < 10
                }
                loading={isUpdatingStatus}
              >
                <XCircle className='w-4 h-4' />
                Dismiss Report
              </Button>

              {!report.trip?.isDeleted && (
                <Button
                  variant='danger'
                  onClick={() => setShowDeleteConfirm(true)}
                  className='gap-2 ml-auto'
                  disabled={
                    isUpdatingStatus || isDeleting || message.trim().length < 10
                  }
                >
                  <Trash2 className='w-4 h-4' />
                  Delete Trip
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className='p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-start gap-3 mb-4'>
              <AlertTriangle className='w-5 h-5 text-red-600 shrink-0 mt-0.5' />
              <div>
                <h4 className='font-semibold text-red-900 mb-1'>
                  Confirm Trip Deletion
                </h4>
                <p className='text-sm text-red-700 mb-2'>
                  This will permanently delete the trip "{report.trip?.title}".
                  This action cannot be undone.
                </p>
                <p className='text-sm text-red-700'>
                  The following message will be sent to the trip owner, members,
                  and reporter:
                </p>
                <div className='mt-2 p-2 bg-white rounded border border-red-300'>
                  <p className='text-sm text-gray-700 italic'>"{message}"</p>
                </div>
              </div>
            </div>
            <div className='flex gap-3 justify-end'>
              <Button
                variant='outline'
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant='danger'
                onClick={handleDeleteTrip}
                disabled={isDeleting}
                loading={isDeleting}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        )}

        {/* Close Button */}
        {!showDeleteConfirm && (
          <div className='flex justify-end pt-2'>
            <Button variant='outline' onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ReportDetails;
