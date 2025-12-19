import { useState, useEffect } from "react";
import { adminApi } from "../../../services/api.service";
import Card from "../../ui/Card";
import Badge from "../../ui/Badge";
import Loader from "../../ui/Loader";
import VerificationActions from "./VerificationActions";
import { FileText, Calendar } from "lucide-react";
import toast from "react-hot-toast";

/**
 * VerificationQueue component
 * Displays pending verification requests for both domestic (NID) and international (Passport)
 */
const VerificationQueue = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingVerifications();
  }, []);

  const fetchPendingVerifications = async () => {
    setLoading(true);
    try {
      const response = await adminApi.getPendingVerifications();
      setPendingUsers(response);
    } catch (error) {
      console.error("Failed to fetch pending verifications:", error);
      toast.error("Failed to load pending verifications");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, verificationType) => {
    try {
      await adminApi.approveVerification(userId, verificationType);
      toast.success(
        `${
          verificationType === "domestic" ? "NID" : "Passport"
        } verification approved successfully`
      );
      // Refresh the list
      fetchPendingVerifications();
    } catch (error) {
      console.error("Failed to approve verification:", error);
      toast.error("Failed to approve verification");
    }
  };

  const handleReject = async (userId, verificationType) => {
    try {
      await adminApi.rejectVerification(userId, verificationType);
      toast.success(
        `${
          verificationType === "domestic" ? "NID" : "Passport"
        } verification rejected`
      );
      // Refresh the list
      fetchPendingVerifications();
    } catch (error) {
      console.error("Failed to reject verification:", error);
      toast.error("Failed to reject verification");
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

  // Extract all pending verifications from users
  const getPendingVerifications = () => {
    const verifications = [];

    pendingUsers.forEach((user) => {
      // Check for pending domestic verification
      if (
        user.domesticVerification?.status === "pending" &&
        user.domesticVerification?.document
      ) {
        verifications.push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          verificationType: "domestic",
          documentType: "NID",
          document: user.domesticVerification.document,
        });
      }

      // Check for pending international verification
      if (
        user.internationalVerification?.status === "pending" &&
        user.internationalVerification?.document
      ) {
        verifications.push({
          userId: user._id,
          userName: user.name,
          userEmail: user.email,
          verificationType: "international",
          documentType: "Passport",
          document: user.internationalVerification.document,
        });
      }
    });

    return verifications;
  };

  if (loading) {
    return (
      <div className='flex justify-center py-12'>
        <Loader />
      </div>
    );
  }

  const pendingVerifications = getPendingVerifications();

  if (pendingVerifications.length === 0) {
    return (
      <Card>
        <div className='text-center py-12'>
          <FileText className='mx-auto text-gray-400 mb-4' size={48} />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            No Pending Verifications
          </h3>
          <p className='text-gray-600'>
            All verification requests have been processed.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-xl font-semibold text-gray-900'>
          Verification Queue
        </h2>
        <Badge variant='warning'>{pendingVerifications.length} Pending</Badge>
      </div>

      {pendingVerifications.map((verification, index) => (
        <Card
          key={`${verification.userId}-${verification.verificationType}-${index}`}
          padding='lg'
        >
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            {/* User Info */}
            <div className='flex-1'>
              <div className='flex items-start justify-between mb-2'>
                <div>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {verification.userName}
                  </h3>
                  <p className='text-sm text-gray-600'>
                    {verification.userEmail}
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Badge variant='info'>{verification.documentType}</Badge>
                  <Badge variant='pending'>Pending</Badge>
                </div>
              </div>

              {/* Document Info */}
              {verification.document && (
                <div className='mt-4 space-y-2'>
                  <div className='flex items-center text-sm text-gray-600'>
                    <FileText size={16} className='mr-2' />
                    <span>Document: {verification.document.filename}</span>
                  </div>
                  <div className='flex items-center text-sm text-gray-600'>
                    <Calendar size={16} className='mr-2' />
                    <span>
                      Uploaded: {formatDate(verification.document.uploadedAt)}
                    </span>
                  </div>
                  <div className='text-sm text-gray-600'>
                    <span className='font-medium'>Trip Type:</span>{" "}
                    {verification.verificationType === "domestic"
                      ? "Domestic"
                      : "International"}
                  </div>
                </div>
              )}

              {/* Document Preview */}
              {verification.document && verification.document.url && (
                <div className='mt-4'>
                  <div className='space-y-2'>
                    <div className='border border-gray-200 rounded-lg overflow-hidden'>
                      <img
                        src={verification.document.url}
                        alt={`${verification.documentType} for ${verification.userName}`}
                        className='w-full max-w-md h-auto object-contain bg-gray-50'
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "block";
                        }}
                      />
                      <div
                        style={{ display: "none" }}
                        className='p-4 text-center text-gray-500 text-sm'
                      >
                        Failed to load image
                      </div>
                    </div>
                    <a
                      href={verification.document.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:text-blue-700 text-sm font-medium inline-block'
                    >
                      Open in new tab →
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='shrink-0'>
              <VerificationActions
                userId={verification.userId}
                userName={verification.userName}
                verificationType={verification.verificationType}
                documentType={verification.documentType}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default VerificationQueue;
