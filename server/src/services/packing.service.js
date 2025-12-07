/**
 * Packing Rule Engine
 * Generates smart packing suggestions based on trip properties
 */

/**
 * Packing rules organized by destination type
 */
const DESTINATION_RULES = {
  beach: {
    category: 'Beach Essentials',
    items: [
      'Swimwear',
      'Beach towel',
      'Sunscreen (SPF 30+)',
      'Sunglasses',
      'Sun hat',
      'Flip-flops/sandals',
      'Beach bag',
      'Waterproof phone case',
      'After-sun lotion',
      'Light cover-up',
    ],
  },
  mountain: {
    category: 'Mountain Essentials',
    items: [
      'Hiking boots',
      'Warm jacket',
      'Thermal underwear',
      'Hiking backpack',
      'Water bottle',
      'First aid kit',
      'Flashlight/headlamp',
      'Trail map',
      'Sunscreen',
      'Insect repellent',
      'Warm hat and gloves',
    ],
  },
  city: {
    category: 'City Essentials',
    items: [
      'Comfortable walking shoes',
      'Day backpack',
      'City map/guidebook',
      'Portable charger',
      'Camera',
      'Reusable water bottle',
      'Light jacket',
      'Umbrella',
    ],
  },
  countryside: {
    category: 'Countryside Essentials',
    items: [
      'Comfortable walking shoes',
      'Light jacket',
      'Insect repellent',
      'Sunscreen',
      'Hat',
      'Binoculars',
      'Camera',
      'Reusable water bottle',
    ],
  },
  other: {
    category: 'General Essentials',
    items: [
      'Comfortable shoes',
      'Light jacket',
      'Sunscreen',
      'Reusable water bottle',
      'Camera',
      'Portable charger',
    ],
  },
};

/**
 * Season-based packing rules
 */
const SEASON_RULES = {
  winter: {
    category: 'Winter Clothing',
    items: [
      'Heavy winter coat',
      'Warm sweaters',
      'Thermal underwear',
      'Winter boots',
      'Warm hat',
      'Gloves',
      'Scarf',
      'Wool socks',
    ],
  },
  spring: {
    category: 'Spring Clothing',
    items: [
      'Light jacket',
      'Layers (t-shirts and long sleeves)',
      'Jeans/pants',
      'Light sweater',
      'Umbrella',
    ],
  },
  summer: {
    category: 'Summer Clothing',
    items: [
      'T-shirts',
      'Shorts',
      'Light dresses/skirts',
      'Sandals',
      'Sun hat',
      'Sunglasses',
    ],
  },
  fall: {
    category: 'Fall Clothing',
    items: [
      'Medium jacket',
      'Long-sleeve shirts',
      'Jeans/pants',
      'Sweater',
      'Closed-toe shoes',
      'Light scarf',
    ],
  },
};

/**
 * Duration-based packing rules
 */
const DURATION_RULES = {
  short: {
    category: 'Short Trip Essentials',
    items: [
      'Toiletries (travel size)',
      'Underwear (3-4 sets)',
      'Socks (3-4 pairs)',
      'Medications',
      'Phone charger',
    ],
  },
  long: {
    category: 'Extended Trip Essentials',
    items: [
      'Toiletries (full size)',
      'Underwear (7+ sets)',
      'Socks (7+ pairs)',
      'Laundry detergent',
      'Extra shoes',
      'Medications',
      'Phone charger',
      'Laptop/tablet',
      'Books/entertainment',
      'Extra clothing layers',
    ],
  },
};

/**
 * Universal packing items that apply to all trips
 */
const UNIVERSAL_ITEMS = {
  category: 'Travel Essentials',
  items: [
    'Passport/ID',
    'Travel documents',
    'Credit cards/cash',
    'Phone',
    'Chargers',
    'Medications',
    'Toiletries',
    'Underwear',
    'Socks',
  ],
};

/**
 * Determine the season based on a date
 * @param {Date} date - Date to check
 * @returns {string} Season name (winter, spring, summer, fall)
 */
const getSeason = (date) => {
  const month = date.getMonth(); // 0-11

  if (month >= 11 || month <= 1) {
    return 'winter'; // December, January, February
  } else if (month >= 2 && month <= 4) {
    return 'spring'; // March, April, May
  } else if (month >= 5 && month <= 7) {
    return 'summer'; // June, July, August
  } else {
    return 'fall'; // September, October, November
  }
};

/**
 * Calculate trip duration in days
 * @param {Date} startDate - Trip start date
 * @param {Date} endDate - Trip end date
 * @returns {number} Duration in days
 */
const getTripDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Evaluate packing rules based on trip properties
 * @param {Object} tripData - Trip information
 * @param {string} tripData.destinationType - Type of destination
 * @param {Date} tripData.startDate - Trip start date
 * @param {Date} tripData.endDate - Trip end date
 * @returns {Object} Evaluated rules with categories and items
 */
export const evaluatePackingRules = (tripData) => {
  const { destinationType, startDate, endDate } = tripData;

  const rules = [];

  // Add universal items
  rules.push(UNIVERSAL_ITEMS);

  // Add destination-specific rules
  if (destinationType && DESTINATION_RULES[destinationType]) {
    rules.push(DESTINATION_RULES[destinationType]);
  }

  // Add season-based rules
  const season = getSeason(new Date(startDate));
  if (SEASON_RULES[season]) {
    rules.push(SEASON_RULES[season]);
  }

  // Add duration-based rules
  const duration = getTripDuration(startDate, endDate);
  if (duration > 7) {
    rules.push(DURATION_RULES.long);
  } else {
    rules.push(DURATION_RULES.short);
  }

  return rules;
};

/**
 * Generate packing suggestions for a trip
 * Combines rules based on trip properties and returns a categorized packing list
 * @param {Object} tripData - Trip information
 * @param {string} tripData.destinationType - Type of destination
 * @param {Date} tripData.startDate - Trip start date
 * @param {Date} tripData.endDate - Trip end date
 * @returns {Array<Object>} Categorized packing list with categories and items
 */
export const generatePackingSuggestions = (tripData) => {
  try {
    // Evaluate rules based on trip properties
    const rules = evaluatePackingRules(tripData);

    // Transform rules into categorized packing list
    const packingList = rules.map((rule) => ({
      category: rule.category,
      items: rule.items,
    }));

    return packingList;
  } catch (error) {
    throw new Error(`Failed to generate packing suggestions: ${error.message}`);
  }
};
