import { useState, useEffect, useRef, useCallback } from "react";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import {
  fetchCoordinates,
  debounce,
  fetchCoordinatesDebounced,
} from "../../../utils/geocoding";
import toast from "react-hot-toast";

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
  const [geocoding, setGeocoding] = useState(false);
  const [cachedCoordinates, setCachedCoordinates] = useState(null);
  const [geocodingStatus, setGeocodingStatus] = useState(""); // "loading", "success", "error", ""
  const debounceTimerRef = useRef(null);

  // Debounced geocoding for real-time feedback
  const debouncedGeocode = useCallback(
    debounce(async (locationName, locationAddress) => {
      if (!locationName || locationName.trim().length < 3) {
        setGeocodingStatus("");
        setCachedCoordinates(null);
        return;
      }

      setGeocodingStatus("loading");

      await fetchCoordinatesDebounced(
        locationName,
        locationAddress,
        ({ coordinates, country }) => {
          setCachedCoordinates({ coordinates, country });
          setGeocodingStatus("success");
          // Clear error if location was previously invalid
          if (errors.location) {
            setErrors({ ...errors, location: "" });
          }
        },
        () => {
          setCachedCoordinates(null);
          setGeocodingStatus("error");
        }
      );
    }, 800),
    [errors]
  );

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
      const updatedLocation = {
        ...formData.location,
        [locationField]: value,
      };

      setFormData({
        ...formData,
        location: updatedLocation,
      });

      // Trigger debounced geocoding when location name or address changes
      if (locationField === "name" || locationField === "address") {
        debouncedGeocode(
          locationField === "name" ? value : formData.location.name,
          locationField === "address" ? value : formData.location.address
        );
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setGeocoding(true);
      setErrors({});

      let coordinates = cachedCoordinates?.coordinates;
      let country = cachedCoordinates?.country;

      // If no cached coordinates or geocoding failed, try fetching again
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        console.log("No cached coordinates, fetching...");
        const result = await fetchCoordinates(
          formData.location.name,
          formData.location.address
        );
        coordinates = result.coordinates;
        country = result.country;
      }

      // Final validation - check if coordinates were successfully fetched
      if (!coordinates || !coordinates.lat || !coordinates.lng) {
        setErrors({
          location:
            "Could not find location coordinates. Please check the location name and address and try again.",
        });
        toast.error(
          "Unable to geocode location. Please verify the location details."
        );
        setGeocoding(false);
        return;
      }

      // Prepare data for submission with coordinates
      const submitData = {
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        location: {
          name: formData.location.name.trim(),
          coordinates: {
            lat: coordinates.lat,
            lng: coordinates.lng,
          },
        },
      };

      // Only add optional fields if they have values
      if (formData.description && formData.description.trim()) {
        submitData.description = formData.description.trim();
      }

      if (formData.location.address && formData.location.address.trim()) {
        submitData.location.address = formData.location.address.trim();
      }

      if (country) {
        submitData.location.country = country;
      }

      console.log("Submitting activity data:", submitData);

      setGeocoding(false);
      onSubmit(submitData);
    } catch (error) {
      console.error("Error during geocoding:", error);
      setErrors({
        location: "Failed to fetch location coordinates. Please try again.",
      });
      toast.error("Error fetching location coordinates. Please try again.");
      setGeocoding(false);
    }
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

      <div>
        <Input
          label='Location Name'
          name='location.name'
          value={formData.location.name}
          onChange={handleChange}
          placeholder='e.g., Eiffel Tower'
          error={errors.location}
          required
        />
        {geocodingStatus === "loading" && (
          <p className='mt-1 text-sm text-blue-600 flex items-center'>
            <svg
              className='animate-spin h-4 w-4 mr-2'
              xmlns='http://www.w3.org/2000/svg'
              fill='none'
              viewBox='0 0 24 24'
            >
              <circle
                className='opacity-25'
                cx='12'
                cy='12'
                r='10'
                stroke='currentColor'
                strokeWidth='4'
              ></circle>
              <path
                className='opacity-75'
                fill='currentColor'
                d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
              ></path>
            </svg>
            Searching for location...
          </p>
        )}
        {geocodingStatus === "success" && cachedCoordinates && (
          <p className='mt-1 text-sm text-green-600 flex items-center'>
            <svg
              className='h-4 w-4 mr-2'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            Location found ({cachedCoordinates.coordinates.lat.toFixed(4)},{" "}
            {cachedCoordinates.coordinates.lng.toFixed(4)})
            {cachedCoordinates.country && ` in ${cachedCoordinates.country}`}
          </p>
        )}
        {geocodingStatus === "error" &&
          formData.location.name.trim().length >= 3 && (
            <p className='mt-1 text-sm text-orange-600 flex items-center'>
              <svg
                className='h-4 w-4 mr-2'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
                  clipRule='evenodd'
                />
              </svg>
              Location not found. We'll try again when you submit.
            </p>
          )}
      </div>

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
          disabled={loading || geocoding}
        >
          Cancel
        </Button>
        <Button
          type='submit'
          variant='primary'
          loading={loading || geocoding}
          disabled={loading || geocoding}
        >
          {geocoding
            ? "Fetching location..."
            : activity
            ? "Update Activity"
            : "Create Activity"}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
