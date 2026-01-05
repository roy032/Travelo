import { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import { CheckCircle, XCircle } from "lucide-react";

/**
 * VerificationActions component
 * Provides approve/reject buttons with confirmation dialogs
 */
const VerificationActions = ({
  userId,
  userName,
  verificationType,
  documentType,
  onApprove,
  onReject,
}) => {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await onApprove(userId, verificationType);
      setShowApproveModal(false);
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(userId, verificationType);
      setShowRejectModal(false);
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className='flex gap-2'>
        <Button
          variant='success'
          size='sm'
          onClick={() => setShowApproveModal(true)}
          className='flex items-center'
        >
          <CheckCircle size={16} className='mr-1' />
          Approve
        </Button>
        <Button
          variant='danger'
          size='sm'
          onClick={() => setShowRejectModal(true)}
          className='flex items-center'
        >
          <XCircle size={16} className='mr-1' />
          Reject
        </Button>
      </div>

      {/* Approve Confirmation Modal */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title='Approve Verification'
        size='sm'
      >
        <div className='space-y-4'>
          <div className='flex items-center justify-center p-4 bg-green-50 rounded-lg'>
            <CheckCircle className='text-green-600' size={48} />
          </div>
          <div className='text-center'>
            <p className='text-gray-700'>
              Are you sure you want to approve the{" "}
              <span className='font-semibold'>{documentType}</span> verification
              for <span className='font-semibold'>{userName}</span>?
            </p>
            <p className='text-sm text-gray-600 mt-2'>
              This will grant them verified status for{" "}
              {documentType === "NID" ? "domestic" : "international"} trips.
            </p>
          </div>
          <div className='flex gap-3 justify-end'>
            <Button
              variant='secondary'
              onClick={() => setShowApproveModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant='success' onClick={handleApprove} loading={loading}>
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Confirmation Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title='Reject Verification'
        size='sm'
      >
        <div className='space-y-4'>
          <div className='flex items-center justify-center p-4 bg-red-50 rounded-lg'>
            <XCircle className='text-red-600' size={48} />
          </div>
          <div className='text-center'>
            <p className='text-gray-700'>
              Are you sure you want to reject the{" "}
              <span className='font-semibold'>{documentType}</span> verification
              for <span className='font-semibold'>{userName}</span>?
            </p>
            <p className='text-sm text-gray-600 mt-2'>
              They will be able to resubmit their {documentType} document.
            </p>
          </div>
          <div className='flex gap-3 justify-end'>
            <Button
              variant='secondary'
              onClick={() => setShowRejectModal(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button variant='danger' onClick={handleReject} loading={loading}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default VerificationActions;
