import { useState, useEffect } from "react";
import Input from "./Input";
import Button from "./Button";

/**
 * ActivityForm component - form for creating/editing activities
 */
const ActivityForm = ({
  activity = null,
  tripStartDate,
  tripEndDate,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: {
      name: "",
      address: "",
    },
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (activity) {
      // Editing existing activity
      setFormData({
        title: activity.title || "",
        description: activity.description || "",
        date: activity.date
          ? new Date(activity.date).toISOString().split("T")[0]
          : "",
        time: activity.time || "",
        location: {
          name: activity.location?.name || "",
          address: activity.location?.address || "",
        },
      });
    }
  }, [activity]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("location.")) {
      const locationField = name.split(".")[1];
      setFormData({
        ...formData,
        location: {
          ...formData.location,
          [locationField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 2) {
      newErrors.title = "Title must be at least 2 characters";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
    } else {
      const activityDate = new Date(formData.date);
      const startDate = new Date(tripStartDate);
      const endDate = new Date(tripEndDate);

      if (activityDate < startDate || activityDate > endDate) {
        newErrors.date = "Activity date must be within trip date range";
      }
    }

    if (!formData.time) {
      newErrors.time = "Time is required";
    }

    if (!formData.location.name.trim()) {
      newErrors.location = "Location name is required";
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Prepare data for submission - backend will handle geocoding
    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: formData.date,
      time: formData.time,
      location: {
        name: formData.location.name.trim(),
        address: formData.location.address.trim(),
      },
    };

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <Input
        label='Title'
        name='title'
        value={formData.title}
        onChange={handleChange}
        placeholder='e.g., Visit Eiffel Tower'
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
          placeholder='Add details about this activity...'
          rows={3}
          className='block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
        />
        {errors.description && (
          <p className='mt-1 text-sm text-red-600'>{errors.description}</p>
        )}
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <Input
          label='Date'
          type='date'
          name='date'
          value={formData.date}
          onChange={handleChange}
          min={tripStartDate}
          max={tripEndDate}
          error={errors.date}
          required
        />

        <Input
          label='Time'
          type='time'
          name='time'
          value={formData.time}
          onChange={handleChange}
          error={errors.time}
          required
        />
      </div>

      <Input
        label='Location Name'
        name='location.name'
        value={formData.location.name}
        onChange={handleChange}
        placeholder='e.g., Eiffel Tower'
        error={errors.location}
        required
      />

      <Input
        label='Address (Optional)'
        name='location.address'
        value={formData.location.address}
        onChange={handleChange}
        placeholder='e.g., Champ de Mars, 5 Avenue Anatole France'
      />

      <div className='flex justify-end space-x-3 pt-4'>
        <Button
          type='button'
          variant='secondary'
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
          {activity ? "Update Activity" : "Create Activity"}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
