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
  CheckCircle,
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
  const [resolution, setResolution] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

    setIsDeleting(true);
    try {
      await adminApi.deleteTrip(report.trip._id);
      toast.success("Trip deleted successfully");
      setShowDeleteConfirm(false);
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Failed to delete trip:", error);
      toast.error("Failed to delete trip");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusUpdate = (status) => {
    onStatusUpdate(report._id, status, resolution);
    setResolution("");
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

            {/* Resolution Notes */}
            <div>
              <label
                htmlFor='resolution'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Resolution Notes (Optional)
              </label>
              <textarea
                id='resolution'
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder='Add notes about your decision...'
                rows={3}
                maxLength={500}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none'
              />
              <p className='mt-1 text-sm text-gray-500 text-right'>
                {resolution.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex flex-wrap gap-3'>
              <Button
                variant='success'
                onClick={() => handleStatusUpdate("resolved")}
                className='gap-2'
              >
                <CheckCircle className='w-4 h-4' />
                Mark as Resolved
              </Button>

              <Button
                variant='outline'
                onClick={() => handleStatusUpdate("reviewed")}
                className='gap-2'
              >
                <FileText className='w-4 h-4' />
                Mark as Reviewed
              </Button>

              <Button
                variant='ghost'
                onClick={() => handleStatusUpdate("dismissed")}
                className='gap-2'
              >
                <XCircle className='w-4 h-4' />
                Dismiss Report
              </Button>

              {!report.trip?.isDeleted && (
                <Button
                  variant='danger'
                  onClick={() => setShowDeleteConfirm(true)}
                  className='gap-2 ml-auto'
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
              <AlertTriangle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
              <div>
                <h4 className='font-semibold text-red-900 mb-1'>
                  Confirm Trip Deletion
                </h4>
                <p className='text-sm text-red-700'>
                  This will permanently delete the trip "{report.trip?.title}".
                  The trip owner and members will be notified. This action
                  cannot be undone.
                </p>
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
