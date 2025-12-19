import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { reportApi } from "../../services/api.service";
import toast from "react-hot-toast";
import { AlertTriangle, X } from "lucide-react";

/**
 * ReportModal - Modal for submitting trip reports
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Close handler
 * @param {string} tripId - ID of trip to report
 * @param {string} tripTitle - Title of trip being reported
 */
const ReportModal = ({ isOpen, onClose, tripId, tripTitle }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
  });

  const reportCategories = [
    {
      value: "spam",
      label: "Spam or Misleading",
      description: "Fake or deceptive content",
    },
    {
      value: "inappropriate",
      label: "Inappropriate Content",
      description: "Offensive or harmful material",
    },
    {
      value: "fake",
      label: "Fake Information",
      description: "False or fabricated details",
    },
    {
      value: "unsafe",
      label: "Safety Concerns",
      description: "Dangerous or risky activities",
    },
    {
      value: "copyright",
      label: "Copyright Violation",
      description: "Unauthorized use of content",
    },
    { value: "other", label: "Other", description: "Other concerns" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      toast.error("Please select a report category");
      return;
    }

    if (formData.description.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      await reportApi.reportTrip(tripId, formData);
      toast.success(
        "Report submitted successfully. Thank you for helping keep our community safe."
      );
      onClose();
      setFormData({ category: "", description: "" });
    } catch (error) {
      // Error already handled by API service
      console.error("Report submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ category: "", description: "" });
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title='Report Trip'>
      <div className='space-y-4'>
        {/* Warning message */}
        <div className='flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
          <AlertTriangle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
          <div className='text-sm text-yellow-800'>
            <p className='font-medium mb-1'>Report: {tripTitle}</p>
            <p className='text-yellow-700'>
              False reports may result in account restrictions. Please provide
              accurate information.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Category Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Report Category <span className='text-red-500'>*</span>
            </label>
            <div className='space-y-2'>
              {reportCategories.map((category) => (
                <label
                  key={category.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.category === category.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type='radio'
                    name='category'
                    value={category.value}
                    checked={formData.category === category.value}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className='mt-1'
                    disabled={isSubmitting}
                  />
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900'>
                      {category.label}
                    </div>
                    <div className='text-sm text-gray-500'>
                      {category.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Description <span className='text-red-500'>*</span>
            </label>
            <textarea
              id='description'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Please provide details about why you're reporting this trip..."
              rows={4}
              maxLength={1000}
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none'
              disabled={isSubmitting}
              required
            />
            <p className='mt-1 text-sm text-gray-500 text-right'>
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className='flex gap-3 justify-end pt-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='danger'
              disabled={
                isSubmitting ||
                !formData.category ||
                formData.description.trim().length < 10
              }
              loading={isSubmitting}
            >
              Submit Report
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ReportModal;
