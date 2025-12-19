import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

/**
 * PhotoUpload component - handles photo upload with drag-and-drop
 * @param {Function} onUpload - Handler for uploading photos
 * @param {boolean} loading - Whether upload is in progress
 */
const PhotoUpload = ({ onUpload, loading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      alert("Please select a JPEG or PNG image");
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a photo to upload");
      return;
    }

    try {
      await onUpload(selectedFile, caption);
      // Reset form on success
      handleRemoveFile();
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6'>
      <h3 className='text-lg font-semibold text-gray-900 mb-4'>Upload Photo</h3>

      <form onSubmit={handleSubmit}>
        {!selectedFile ? (
          <>
            {/* Drag and Drop Area */}
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors
                ${
                  isDragging
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400 bg-gray-50"
                }
              `}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
              <p className='text-sm text-gray-600 mb-2'>
                <span className='font-semibold text-blue-600'>
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className='text-xs text-gray-500'>JPEG or PNG (max 10MB)</p>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/jpg,image/png'
              onChange={handleFileInputChange}
              className='hidden'
            />
          </>
        ) : (
          <>
            {/* Preview and Caption */}
            <div className='space-y-4'>
              {/* Image Preview */}
              <div className='relative'>
                <img
                  src={previewUrl}
                  alt='Preview'
                  className='w-full h-64 object-cover rounded-lg'
                />
                <button
                  type='button'
                  onClick={handleRemoveFile}
                  className='absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors'
                  aria-label='Remove photo'
                >
                  <X className='h-5 w-5 text-gray-600' />
                </button>
              </div>

              {/* File Info */}
              <div className='flex items-center space-x-2 text-sm text-gray-600'>
                <ImageIcon className='h-4 w-4' />
                <span className='truncate'>{selectedFile.name}</span>
                <span className='text-gray-400'>
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>

              {/* Caption Input */}
              <div>
                <label
                  htmlFor='caption'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Caption (optional)
                </label>
                <Input
                  id='caption'
                  type='text'
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder='Add a caption for this photo...'
                  maxLength={500}
                />
              </div>

              {/* Action Buttons */}
              <div className='flex space-x-3'>
                <Button
                  type='submit'
                  variant='primary'
                  disabled={loading}
                  className='flex-1'
                >
                  {loading ? "Uploading..." : "Upload Photo"}
                </Button>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleRemoveFile}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

export default PhotoUpload;
