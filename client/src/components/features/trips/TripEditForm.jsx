import { useState } from "react";
import { tripApi } from "../../../services/api.service";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import toast from "react-hot-toast";

/**
 * TripEditForm component - form for editing an existing trip
 */
const TripEditForm = ({ trip, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: trip.title || "",
    description: trip.description || "",
    startDate: trip.startDate
      ? new Date(trip.startDate).toISOString().split("T")[0]
      : "",
    endDate: trip.endDate
      ? new Date(trip.endDate).toISOString().split("T")[0]
      : "",
    destinationType: trip.destinationType || "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

      const updatedTrip = await tripApi.updateTrip(
        trip.id || trip._id,
        tripData
      );
      toast.success("Trip updated successfully!");
      onSuccess(updatedTrip);
    } catch (error) {
      console.error("Error updating trip:", error);
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
          Save Changes
        </Button>
      </div>
    </form>
  );
};

export default TripEditForm;
