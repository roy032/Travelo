import { useState, useEffect } from "react";
import { tripApi } from "../../../services/api.service";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";

/**
 * TripCreateForm component - form for creating a new trip
 */
const TripCreateForm = ({ onSuccess, onCancel }) => {
  const { user } = useAuth();

  // Set default trip category based on user's verification status
  const getDefaultTripCategory = () => {
    const hasDomestic = user?.domesticVerification?.status === "verified";
    const hasInternational =
      user?.internationalVerification?.status === "verified";

    // If only one is verified, default to that one
    if (hasDomestic && !hasInternational) return "domestic";
    if (hasInternational && !hasDomestic) return "international";

    // If both or neither, default to domestic
    return "domestic";
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    destinationType: "",
    tripCategory: getDefaultTripCategory(),
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showVerificationWarning, setShowVerificationWarning] = useState(false);

  // Check initial verification status on mount
  useEffect(() => {
    const { tripCategory } = formData;
    if (
      tripCategory === "domestic" &&
      user?.domesticVerification?.status !== "verified"
    ) {
      setShowVerificationWarning(true);
    } else if (
      tripCategory === "international" &&
      user?.internationalVerification?.status !== "verified"
    ) {
      setShowVerificationWarning(true);
    }
  }, []); // Run only once on mount

  const destinationTypes = [
    { value: "", label: "Select destination type" },
    { value: "beach", label: "Beach" },
    { value: "mountain", label: "Mountain" },
    { value: "city", label: "City" },
    { value: "countryside", label: "Countryside" },
    { value: "other", label: "Other" },
  ];

  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must not exceed 200 characters";
    }

    // Trip category validation
    if (!formData.tripCategory) {
      newErrors.tripCategory = "Trip category is required";
    }

    // Start date validation
    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    // End date validation
    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    } else if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = "End date must be on or after start date";
      }
    }

    // Description validation (optional but with max length)
    if (formData.description && formData.description.length > 2000) {
      newErrors.description = "Description must not exceed 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Check if changing trip category to unverified type
    if (name === "tripCategory") {
      if (
        value === "domestic" &&
        user?.domesticVerification?.status !== "verified"
      ) {
        setShowVerificationWarning(true);
      } else if (
        value === "international" &&
        user?.internationalVerification?.status !== "verified"
      ) {
        setShowVerificationWarning(true);
      } else {
        setShowVerificationWarning(false);
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check verification status based on trip category
    const { tripCategory } = formData;
    if (tripCategory === "domestic") {
      if (user?.domesticVerification?.status !== "verified") {
        toast.error(
          "You must upload and verify your NID to create domestic trips."
        );
        return;
      }
    } else if (tripCategory === "international") {
      if (user?.internationalVerification?.status !== "verified") {
        toast.error(
          "You must upload and verify your passport to create international trips."
        );
        return;
      }
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const tripData = {
        ...formData,
        // Only include destinationType if it's selected
        ...(formData.destinationType && {
          destinationType: formData.destinationType,
        }),
      };

      const newTrip = await tripApi.createTrip(tripData);
      toast.success("Trip created successfully!");
      onSuccess(newTrip);
    } catch (error) {
      console.error("Error creating trip:", error);
      // Error is already handled by API service with toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <Input
        label='Trip Title'
        type='text'
        name='title'
        value={formData.title}
        onChange={handleChange}
        placeholder='e.g., Summer Vacation in Bali'
        error={errors.title}
        required
      />

      {/* Trip Category Selection */}
      <div>
        <label className='block text-sm font-medium text-gray-700 mb-2'>
          Trip Category <span className='text-red-500'>*</span>
        </label>
        <div className='flex gap-4'>
          <label className='flex items-center cursor-pointer'>
            <input
              type='radio'
              name='tripCategory'
              value='domestic'
              checked={formData.tripCategory === "domestic"}
              onChange={handleChange}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
            />
            <span className='ml-2 text-sm text-gray-700'>
              Domestic
              {user?.domesticVerification?.status === "verified" && (
                <span className='ml-1 text-green-600'>✓</span>
              )}
              {user?.domesticVerification?.status === "pending" && (
                <span className='ml-1 text-yellow-600'>(Pending)</span>
              )}
              {(!user?.domesticVerification?.status ||
                user?.domesticVerification?.status === "unverified") && (
                <span className='ml-1 text-red-600'>(NID Required)</span>
              )}
            </span>
          </label>
          <label className='flex items-center cursor-pointer'>
            <input
              type='radio'
              name='tripCategory'
              value='international'
              checked={formData.tripCategory === "international"}
              onChange={handleChange}
              className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
            />
            <span className='ml-2 text-sm text-gray-700'>
              International
              {user?.internationalVerification?.status === "verified" && (
                <span className='ml-1 text-green-600'>✓</span>
              )}
              {user?.internationalVerification?.status === "pending" && (
                <span className='ml-1 text-yellow-600'>(Pending)</span>
              )}
              {(!user?.internationalVerification?.status ||
                user?.internationalVerification?.status === "unverified") && (
                <span className='ml-1 text-red-600'>(Passport Required)</span>
              )}
            </span>
          </label>
        </div>
        {errors.tripCategory && (
          <p className='mt-1 text-sm text-red-600'>{errors.tripCategory}</p>
        )}

        {/* Verification Warning Message */}
        {showVerificationWarning && (
          <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <div className='flex items-start'>
              <svg
                className='w-5 h-5 text-yellow-600 mt-0.5 mr-2'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              <div className='flex-1'>
                <h4 className='text-sm font-medium text-yellow-800'>
                  {formData.tripCategory === "domestic"
                    ? "NID Verification Required"
                    : "Passport Verification Required"}
                </h4>
                <p className='mt-1 text-sm text-yellow-700'>
                  {formData.tripCategory === "domestic"
                    ? user?.domesticVerification?.status === "pending"
                      ? "Your NID verification is pending. Please wait for admin approval before creating domestic trips."
                      : "You need to upload and verify your NID to create domestic trips. Please go to your profile to upload your NID document."
                    : user?.internationalVerification?.status === "pending"
                    ? "Your passport verification is pending. Please wait for admin approval before creating international trips."
                    : "You need to upload and verify your passport to create international trips. Please go to your profile to upload your passport document."}
                </p>
                <button
                  type='button'
                  onClick={() => (window.location.href = "/profile")}
                  className='mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline'
                >
                  Go to Profile →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor='description'
          className='block text-sm font-medium text-gray-700 mb-1'
        >
          Description
        </label>
        <textarea
          id='description'
          name='description'
          value={formData.description}
          onChange={handleChange}
          placeholder='Tell us about your trip...'
          rows={4}
          className='block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />
        {errors.description && (
          <p className='mt-1 text-sm text-red-600'>{errors.description}</p>
        )}
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
        <Input
          label='Start Date'
          type='date'
          name='startDate'
          value={formData.startDate}
          onChange={handleChange}
          error={errors.startDate}
          required
        />

        <Input
          label='End Date'
          type='date'
          name='endDate'
          value={formData.endDate}
          onChange={handleChange}
          error={errors.endDate}
          required
        />
      </div>

      <div>
        <label
          htmlFor='destinationType'
          className='block text-sm font-medium text-gray-700 mb-1'
        >
          Destination Type
        </label>
        <select
          id='destinationType'
          name='destinationType'
          value={formData.destinationType}
          onChange={handleChange}
          className='block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        >
          {destinationTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        {errors.destinationType && (
          <p className='mt-1 text-sm text-red-600'>{errors.destinationType}</p>
        )}
      </div>

      <div className='flex justify-end gap-3 pt-4'>
        <Button
          type='button'
          variant='outline'
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          variant='primary'
          loading={loading}
          disabled={loading}
        >
          Create Trip
        </Button>
      </div>
    </form>
  );
};

export default TripCreateForm;
