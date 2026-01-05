/**
 * Get latitude and longitude from place name using OpenStreetMap Nominatim API
 * @param {string} place - Location query string
 * @param {number} retries - Number of retry attempts (default: 2)
 * @returns {Promise<{lat: number, lng: number, country: string|null}|null>}
 */
export async function getLatLng(place, retries = 2) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    place
  )}&limit=1`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "TraveloApp", // required by Nominatim
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!res.ok) {
        if (attempt < retries) {
          console.warn(`Geocoding attempt ${attempt + 1} failed, retrying...`);
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (attempt + 1))
          ); // Exponential backoff
          continue;
        }
        throw new Error("Geocoding request failed");
      }

      const data = await res.json();

      if (data.length === 0) {
        return null; // Return null if place not found
      }

      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        country: data[0].address?.country || null,
      };
    } catch (error) {
      if (attempt < retries && error.name !== "AbortError") {
        console.warn(`Geocoding attempt ${attempt + 1} failed:`, error.message);
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
        continue;
      }
      console.error("Geocoding error:", error);
      return null;
    }
  }
  return null;
}

/**
 * Extract country from location string
 * Looks for common patterns like "City, Country" or just returns last part
 * @param {string} locationString - Location string to extract country from
 * @returns {string|null}
 */
export function extractCountry(locationString) {
  if (!locationString) return null;

  // Split by comma and take last part as potential country
  const parts = locationString.split(",").map((p) => p.trim());

  // If there are multiple parts, the last one is likely the country
  if (parts.length > 1) {
    return parts[parts.length - 1];
  }

  return null;
}

/**
 * Fetch coordinates for a location with fallback to country
 * @param {string} locationName - Location name
 * @param {string} locationAddress - Location address (optional)
 * @returns {Promise<{coordinates: {lat: number, lng: number}|null, country: string|null}>}
 */
export async function fetchCoordinates(locationName, locationAddress = "") {
  const locationQuery = locationAddress
    ? `${locationName}, ${locationAddress}`
    : locationName;

  let coordinates = null;
  let country = null;

  try {
    // First attempt: Try to get coordinates from the full location
    console.log(`Attempting to geocode: ${locationQuery}`);
    const coords = await getLatLng(locationQuery);

    if (coords) {
      coordinates = {
        lat: coords.lat,
        lng: coords.lng,
      };
      country = coords.country;
      console.log(`Successfully geocoded location: ${locationQuery}`);
    } else {
      // Second attempt: Try to extract and geocode just the country
      console.log(
        `Failed to geocode full location, attempting country fallback`
      );
      const extractedCountry = extractCountry(locationAddress || locationName);

      if (extractedCountry) {
        console.log(`Attempting to geocode country: ${extractedCountry}`);
        const countryCoords = await getLatLng(extractedCountry);

        if (countryCoords) {
          coordinates = {
            lat: countryCoords.lat,
            lng: countryCoords.lng,
          };
          country = countryCoords.country || extractedCountry;
          console.log(`Successfully geocoded country: ${extractedCountry}`);
        } else {
          console.warn(`Could not geocode country: ${extractedCountry}`);
        }
      } else {
        console.warn(`Could not extract country from location`);
      }
    }
  } catch (error) {
    console.error("Error during geocoding:", error);

    // Final attempt: Try country fallback even if there was an error
    try {
      const extractedCountry = extractCountry(locationAddress || locationName);

      if (extractedCountry) {
        console.log(
          `Error occurred, attempting country fallback: ${extractedCountry}`
        );
        const countryCoords = await getLatLng(extractedCountry);

        if (countryCoords) {
          coordinates = {
            lat: countryCoords.lat,
            lng: countryCoords.lng,
          };
          country = countryCoords.country || extractedCountry;
          console.log(`Country fallback successful: ${extractedCountry}`);
        }
      }
    } catch (fallbackError) {
      console.error("Country fallback also failed:", fallbackError);
      // Return null coordinates if all geocoding attempts fail
    }
  }

  return { coordinates, country };
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Fetch coordinates with debouncing for real-time input
 * @param {string} locationName - Location name
 * @param {string} locationAddress - Location address (optional)
 * @param {Function} onSuccess - Callback when coordinates are found
 * @param {Function} onError - Callback when geocoding fails
 * @returns {Promise<void>}
 */
export async function fetchCoordinatesDebounced(
  locationName,
  locationAddress,
  onSuccess,
  onError
) {
  if (!locationName || locationName.trim().length < 3) {
    // Don't geocode for very short inputs
    return;
  }

  try {
    const { coordinates, country } = await fetchCoordinates(
      locationName,
      locationAddress
    );

    if (coordinates && coordinates.lat && coordinates.lng) {
      onSuccess({ coordinates, country });
    } else {
      onError(null);
    }
  } catch (error) {
    console.error("Debounced geocoding error:", error);
    onError(error);
  }
}
