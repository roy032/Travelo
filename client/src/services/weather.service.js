/**
 * Weather service for fetching weather predictions
 */

/**
 * Fetch weather forecast for a location
 * @param {number} latitude - Location latitude
 * @param {number} longitude - Location longitude
 * @returns {Promise<Object>} Weather data
 */
export const getWeatherForecast = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto&forecast_days=7`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather:", error);
    throw error;
  }
};

/**
 * Generate packing suggestions based on weather conditions
 * @param {Object} weatherData - Weather forecast data
 * @returns {Object} Packing suggestions organized by category
 */
export const generatePackingSuggestions = (weatherData) => {
  if (!weatherData || !weatherData.daily) {
    return null;
  }

  const {
    temperature_2m_max,
    temperature_2m_min,
    precipitation_probability_mean,
  } = weatherData.daily;

  // Calculate average temperatures
  const avgMaxTemp =
    temperature_2m_max.reduce((a, b) => a + b, 0) / temperature_2m_max.length;
  const avgMinTemp =
    temperature_2m_min.reduce((a, b) => a + b, 0) / temperature_2m_min.length;
  const maxTemp = Math.max(...temperature_2m_max);
  const minTemp = Math.min(...temperature_2m_min);
  const avgPrecipitation =
    precipitation_probability_mean.reduce((a, b) => a + b, 0) /
    precipitation_probability_mean.length;

  const suggestions = {
    clothing: [],
    accessories: [],
    essentials: [],
    weatherSummary: {
      avgMaxTemp: Math.round(avgMaxTemp),
      avgMinTemp: Math.round(avgMinTemp),
      maxTemp: Math.round(maxTemp),
      minTemp: Math.round(minTemp),
      rainChance: Math.round(avgPrecipitation),
    },
  };

  // Temperature-based clothing suggestions
  if (avgMaxTemp > 30) {
    suggestions.clothing.push(
      "Light, breathable cotton t-shirts",
      "Shorts or light pants",
      "Sun hat or cap",
      "Light summer dress/skirts",
      "Sandals or breathable shoes"
    );
    suggestions.essentials.push(
      "Sunscreen (SPF 50+)",
      "Sunglasses",
      "Water bottle"
    );
  } else if (avgMaxTemp > 20) {
    suggestions.clothing.push(
      "T-shirts and casual tops",
      "Light pants or jeans",
      "A light jacket for evenings",
      "Comfortable walking shoes",
      "Long-sleeve shirt for sun protection"
    );
    suggestions.essentials.push("Sunscreen (SPF 30+)", "Sunglasses");
  } else if (avgMaxTemp > 10) {
    suggestions.clothing.push(
      "Long-sleeve shirts or sweaters",
      "Jeans or warm pants",
      "Light jacket or windbreaker",
      "Closed-toe shoes or boots",
      "Layering pieces (cardigan/hoodie)"
    );
    suggestions.accessories.push("Light scarf", "Baseball cap");
  } else {
    suggestions.clothing.push(
      "Warm sweaters or fleece",
      "Heavy jacket or winter coat",
      "Thermal underwear",
      "Warm pants or jeans",
      "Winter boots",
      "Thick socks"
    );
    suggestions.accessories.push(
      "Winter gloves",
      "Warm scarf",
      "Beanie or winter hat"
    );
    suggestions.essentials.push("Lip balm", "Hand warmers");
  }

  // Temperature variation suggestions
  if (maxTemp - minTemp > 15) {
    suggestions.clothing.push("Layering options (jacket, cardigan)");
    suggestions.essentials.push("Light backpack for layers");
  }

  // Rain-based suggestions
  if (avgPrecipitation > 50) {
    suggestions.clothing.push(
      "Waterproof jacket or raincoat",
      "Water-resistant shoes or boots"
    );
    suggestions.accessories.push("Compact umbrella", "Waterproof bag cover");
    suggestions.essentials.push("Ziplock bags for electronics");
  } else if (avgPrecipitation > 20) {
    suggestions.accessories.push(
      "Light rain jacket or poncho",
      "Small umbrella"
    );
  }

  // Always include essentials
  if (!suggestions.essentials.includes("Water bottle")) {
    suggestions.essentials.push("Water bottle");
  }
  suggestions.essentials.push(
    "Personal medications",
    "First aid kit",
    "Phone charger"
  );

  return suggestions;
};

/**
 * Get weather description from weather code
 * @param {number} code - Weather code
 * @returns {string} Weather description
 */
export const getWeatherDescription = (code) => {
  const weatherCodes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Foggy",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  };

  return weatherCodes[code] || "Unknown";
};
