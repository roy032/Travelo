import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import Button from "../../ui/Button";

/**
 * ReceiptUpload component - handles receipt file upload
 */
const ReceiptUpload = ({ existingReceipt, onFileChange }) => {
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a JPEG or PNG image");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError("File size must be less than 5MB");
      return;
    }

    setError("");
    setFileName(file.name);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    onFileChange(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName("");
    setError("");
    onFileChange(null);
  };

  return (
    <div>
      <label className='block text-sm font-medium text-gray-700 mb-2'>
        Receipt (Optional)
      </label>

      {!preview && !existingReceipt && (
        <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors'>
          <input
            type='file'
            id='receipt-upload'
            accept='image/jpeg,image/png'
            onChange={handleFileSelect}
            className='hidden'
          />
          <label
            htmlFor='receipt-upload'
            className='cursor-pointer flex flex-col items-center'
          >
            <Upload size={32} className='text-gray-400 mb-2' />
            <span className='text-sm text-gray-600 mb-1'>
              Click to upload receipt
            </span>
            <span className='text-xs text-gray-500'>JPEG or PNG, max 5MB</span>
          </label>
        </div>
      )}

      {(preview || existingReceipt) && (
        <div className='border border-gray-300 rounded-lg p-4'>
          <div className='flex items-start justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <FileText size={20} className='text-gray-600' />
              <span className='text-sm text-gray-900'>
                {fileName || existingReceipt?.filename || "Receipt"}
              </span>
            </div>
            <button
              type='button'
              onClick={handleRemove}
              className='text-gray-400 hover:text-red-600 transition-colors'
            >
              <X size={20} />
            </button>
          </div>

          {preview && (
            <img
              src={preview}
              alt='Receipt preview'
              className='w-full h-48 object-contain bg-gray-50 rounded'
            />
          )}

          {existingReceipt && !preview && (
            <div className='bg-gray-50 rounded p-4 text-center'>
              <FileText size={48} className='text-gray-400 mx-auto mb-2' />
              <p className='text-sm text-gray-600'>Existing receipt attached</p>
            </div>
          )}
        </div>
      )}

      {error && <p className='mt-2 text-sm text-red-600'>{error}</p>}

      <p className='mt-2 text-xs text-gray-500'>
        Upload a photo of your receipt for record keeping
      </p>
    </div>
  );
};

export default ReceiptUpload;
