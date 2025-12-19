import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, Clock, XCircle } from "lucide-react";
import { profileApi } from "../../../services/api.service";
import { useAuth } from "../../../hooks/useAuth";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import toast from "react-hot-toast";

/**
 * DocumentUpload component for verification
 * Handles separate uploads for NID (domestic) and Passport (international)
 */
const DocumentUpload = () => {
  const { user, updateUser } = useAuth();

  // State for NID upload
  const [nidFile, setNidFile] = useState(null);
  const [nidPreview, setNidPreview] = useState(null);
  const [nidUploading, setNidUploading] = useState(false);
  const nidInputRef = useRef(null);

  // State for Passport upload
  const [passportFile, setPassportFile] = useState(null);
  const [passportPreview, setPassportPreview] = useState(null);
  const [passportUploading, setPassportUploading] = useState(false);
  const passportInputRef = useRef(null);

  // Get verification statuses from user object
  const domesticStatus = user?.domesticVerification?.status || "unverified";
  const internationalStatus =
    user?.internationalVerification?.status || "unverified";
  const hasDomesticDoc = !!user?.domesticVerification?.document?.filename;
  const hasInternationalDoc =
    !!user?.internationalVerification?.document?.filename;

  // File validation
  const validateFile = (file) => {
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or PDF file");
      return false;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return false;
    }

    return true;
  };

  const handleFileSelect = (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFile(file)) {
      e.target.value = "";
      return;
    }

    if (documentType === "nid") {
      setNidFile(file);
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNidPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setNidPreview(null);
      }
    } else {
      setPassportFile(file);
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPassportPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPassportPreview(null);
      }
    }
  };

  const handleUpload = async (documentType) => {
    const file = documentType === "nid" ? nidFile : passportFile;
    if (!file) {
      toast.error("Please select a file to upload");
      return;
    }

    const setUploading =
      documentType === "nid" ? setNidUploading : setPassportUploading;

    setUploading(true);
    try {
      const response = await profileApi.uploadDocument(file, documentType);

      // Update user context with new verification status
      if (documentType === "nid") {
        updateUser({
          domesticVerification: {
            status: "pending",
            document: response.domesticVerification?.document,
          },
        });
      } else {
        updateUser({
          internationalVerification: {
            status: "pending",
            document: response.internationalVerification?.document,
          },
        });
      }

      toast.success(
        `${
          documentType === "nid" ? "NID" : "Passport"
        } uploaded successfully! Waiting for admin approval.`
      );

      // Clear selection
      if (documentType === "nid") {
        setNidFile(null);
        setNidPreview(null);
        if (nidInputRef.current) {
          nidInputRef.current.value = "";
        }
      } else {
        setPassportFile(null);
        setPassportPreview(null);
        if (passportInputRef.current) {
          passportInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleClearSelection = (documentType) => {
    if (documentType === "nid") {
      setNidFile(null);
      setNidPreview(null);
      if (nidInputRef.current) {
        nidInputRef.current.value = "";
      }
    } else {
      setPassportFile(null);
      setPassportPreview(null);
      if (passportInputRef.current) {
        passportInputRef.current.value = "";
      }
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "verified":
        return {
          icon: <CheckCircle className='w-5 h-5 text-green-600' />,
          text: "Verified",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "pending":
        return {
          icon: <Clock className='w-5 h-5 text-yellow-600' />,
          text: "Pending Review",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "unverified":
      default:
        return {
          icon: <XCircle className='w-5 h-5 text-gray-600' />,
          text: "Not Verified",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const renderUploadSection = (
    documentType,
    status,
    hasDoc,
    file,
    preview,
    uploading,
    inputRef
  ) => {
    const statusDisplay = getStatusDisplay(status);
    const isNID = documentType === "nid";
    const docName = isNID ? "NID" : "Passport";
    const tripType = isNID ? "Domestic" : "International";

    return (
      <Card>
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>
                {docName} Verification
              </h3>
              <p className='text-sm text-gray-500'>For {tripType} Trips</p>
            </div>
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusDisplay.borderColor} ${statusDisplay.bgColor}`}
            >
              {statusDisplay.icon}
              <span className={`text-sm font-medium ${statusDisplay.color}`}>
                {statusDisplay.text}
              </span>
            </div>
          </div>

          <p className='text-sm text-gray-600'>
            Upload your {docName} to get verified for {tripType.toLowerCase()}{" "}
            trips. Accepted formats: JPEG, PNG, PDF (max 5MB)
          </p>

          {status === "verified" && (
            <div className='p-4 bg-green-50 border border-green-200 rounded-lg'>
              <p className='text-sm text-green-800'>
                Your {docName} is verified! You can create{" "}
                {tripType.toLowerCase()} trips.
              </p>
            </div>
          )}

          {status === "pending" && (
            <div className='p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <p className='text-sm text-yellow-800'>
                Your {docName} is under review. You'll be notified once it's
                approved.
              </p>
            </div>
          )}

          {status !== "verified" && (
            <div className='space-y-4'>
              {/* File Input */}
              <div>
                <input
                  ref={inputRef}
                  type='file'
                  accept='.jpg,.jpeg,.png,.pdf'
                  onChange={(e) => handleFileSelect(e, documentType)}
                  className='hidden'
                  id={`${documentType}-upload`}
                />
                <label
                  htmlFor={`${documentType}-upload`}
                  className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors'
                >
                  <Upload className='w-8 h-8 text-gray-400 mb-2' />
                  <span className='text-sm text-gray-600'>
                    Click to select {docName}
                  </span>
                  <span className='text-xs text-gray-500 mt-1'>
                    JPEG, PNG, or PDF (max 5MB)
                  </span>
                </label>
              </div>

              {/* File Preview */}
              {file && (
                <div className='p-4 bg-gray-50 border border-gray-200 rounded-lg'>
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start gap-3 flex-1'>
                      {preview ? (
                        <img
                          src={preview}
                          alt='Document preview'
                          className='w-16 h-16 object-cover rounded'
                        />
                      ) : (
                        <FileText className='w-16 h-16 text-gray-400' />
                      )}
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium text-gray-900 truncate'>
                          {file.name}
                        </p>
                        <p className='text-xs text-gray-500'>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleClearSelection(documentType)}
                      className='text-gray-400 hover:text-gray-600'
                      disabled={uploading}
                    >
                      <XCircle className='w-5 h-5' />
                    </button>
                  </div>

                  <div className='mt-4 flex gap-2'>
                    <Button
                      onClick={() => handleUpload(documentType)}
                      variant='primary'
                      loading={uploading}
                      disabled={uploading}
                      className='flex-1'
                    >
                      Upload {docName}
                    </Button>
                    <Button
                      onClick={() => handleClearSelection(documentType)}
                      variant='outline'
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {hasDoc && !file && (
                <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <p className='text-sm text-blue-800'>
                    You can upload a new {docName} to replace the existing one.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className='space-y-6'>
      {/* NID Upload Section */}
      {renderUploadSection(
        "nid",
        domesticStatus,
        hasDomesticDoc,
        nidFile,
        nidPreview,
        nidUploading,
        nidInputRef
      )}

      {/* Passport Upload Section */}
      {renderUploadSection(
        "passport",
        internationalStatus,
        hasInternationalDoc,
        passportFile,
        passportPreview,
        passportUploading,
        passportInputRef
      )}
    </div>
  );
};

export default DocumentUpload;
