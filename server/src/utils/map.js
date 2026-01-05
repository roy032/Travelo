/**
 * Map utility functions for handling activity location data
 */

/**
 * Extract coordinates from activities
 * Filters activities that have valid latitude and longitude coordinates
 * @param {Array} activities - Array of activity objects
 * @returns {Array} Array of activities with valid coordinates
 */
export const extractCoordinates = (activities) => {
  if (!Array.isArray(activities)) {
    return [];
  }

  return activities.filter((activity) => {
    return (
      activity.location &&
      activity.location.coordinates &&
      typeof activity.location.coordinates.lat === 'number' &&
      typeof activity.location.coordinates.lng === 'number' &&
      !isNaN(activity.location.coordinates.lat) &&
      !isNaN(activity.location.coordinates.lng) &&
      activity.location.coordinates.lat >= -90 &&
      activity.location.coordinates.lat <= 90 &&
      activity.location.coordinates.lng >= -180 &&
      activity.location.coordinates.lng <= 180
    );
  });
};

/**
 * Filter activities with valid coordinates
 * Alias for extractCoordinates for clarity
 * @param {Array} activities - Array of activity objects
 * @returns {Array} Array of activities with valid coordinates
 */
export const filterActivitiesWithCoordinates = (activities) => {
  return extractCoordinates(activities);
};

/**
 * Calculate map bounds from activities with coordinates
 * Returns the bounding box that contains all activity locations
 * @param {Array} activities - Array of activity objects with coordinates
 * @returns {Object|null} Bounds object with north, south, east, west or null if no valid coordinates
 */
export const calculateMapBounds = (activities) => {
  const activitiesWithCoords = extractCoordinates(activities);

  if (activitiesWithCoords.length === 0) {
    return null;
  }

  // Initialize with first coordinate
  const firstCoord = activitiesWithCoords[0].location.coordinates;
  let north = firstCoord.lat;
  let south = firstCoord.lat;
  let east = firstCoord.lng;
  let west = firstCoord.lng;

  // Find min/max coordinates
  activitiesWithCoords.forEach((activity) => {
    const { lat, lng } = activity.location.coordinates;

    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lng < west) west = lng;
  });

  // Add padding (approximately 10% on each side)
  const latPadding = (north - south) * 0.1 || 0.1; // Default padding if points are identical
  const lngPadding = (east - west) * 0.1 || 0.1;

  return {
    north: north + latPadding,
    south: south - latPadding,
    east: east + lngPadding,
    west: west - lngPadding,
    center: {
      lat: (north + south) / 2,
      lng: (east + west) / 2,
    },
  };
};
