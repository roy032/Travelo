import ChecklistItem from '#models/checklist.model.js';
import Trip from '#models/trip.model.js';

/**
 * Create a new checklist item
 * @param {Object} itemData - Checklist item creation data
 * @param {string} itemData.trip - Trip ID
 * @param {string} itemData.text - Item text
 * @param {string} itemData.creator - User ID of the creator
 * @returns {Promise<Object>} Created checklist item object
 * @throws {Error} If validation fails
 */
export const createChecklistItem = async (itemData) => {
  try {
    const { trip, text, creator } = itemData;

    // Create new checklist item with unchecked status (default)
    const checklistItem = new ChecklistItem({
      trip,
      text,
      creator,
      isChecked: false,
    });

    await checklistItem.save();

    // Populate creator information
    await checklistItem.populate('creator', 'name email');

    return {
      id: checklistItem._id,
      trip: checklistItem.trip,
      text: checklistItem.text,
      isChecked: checklistItem.isChecked,
      checkedBy: checklistItem.checkedBy,
      checkedAt: checklistItem.checkedAt,
      creator: checklistItem.creator,
      createdAt: checklistItem.createdAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Toggle checklist item checked status
 * @param {string} itemId - Checklist item ID
 * @param {string} userId - User ID toggling the item
 * @returns {Promise<Object>} Updated checklist item object
 * @throws {Error} If item not found
 */
export const toggleChecklistItem = async (itemId, userId) => {
  try {
    // Find the checklist item
    const checklistItem = await ChecklistItem.findById(itemId);

    if (!checklistItem) {
      throw new Error('Checklist item not found');
    }

    // Toggle the checked status
    checklistItem.isChecked = !checklistItem.isChecked;

    // If checking the item, record who checked it and when
    if (checklistItem.isChecked) {
      checklistItem.checkedBy = userId;
      checklistItem.checkedAt = new Date();
    } else {
      // If unchecking, clear the checkedBy and checkedAt fields
      checklistItem.checkedBy = undefined;
      checklistItem.checkedAt = undefined;
    }

    await checklistItem.save();

    // Populate creator and checkedBy information
    await checklistItem.populate('creator', 'name email');
    if (checklistItem.checkedBy) {
      await checklistItem.populate('checkedBy', 'name email');
    }

    return {
      id: checklistItem._id,
      trip: checklistItem.trip,
      text: checklistItem.text,
      isChecked: checklistItem.isChecked,
      checkedBy: checklistItem.checkedBy,
      checkedAt: checklistItem.checkedAt,
      creator: checklistItem.creator,
      createdAt: checklistItem.createdAt,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Delete a checklist item
 * @param {string} itemId - Checklist item ID
 * @returns {Promise<Object>} Deletion confirmation
 * @throws {Error} If item not found
 */
export const deleteChecklistItem = async (itemId) => {
  try {
    // Find the checklist item
    const checklistItem = await ChecklistItem.findById(itemId);

    if (!checklistItem) {
      throw new Error('Checklist item not found');
    }

    // Delete the item
    await ChecklistItem.findByIdAndDelete(itemId);

    return {
      message: 'Checklist item deleted successfully',
      itemId,
    };
  } catch (e) {
    throw e;
  }
};

/**
 * Get all checklist items for a trip
 * @param {string} tripId - Trip ID
 * @param {string} userId - User ID requesting the checklist
 * @returns {Promise<Array>} Array of checklist item objects
 * @throws {Error} If trip not found or user is not a member
 */
export const getChecklistByTrip = async (tripId, userId) => {
  try {
    // Verify trip exists and user is a member
    const trip = await Trip.findById(tripId);

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Verify user is a member
    const isMember = trip.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isMember) {
      throw new Error('Access denied: You are not a member of this trip');
    }

    // Get all checklist items for the trip
    const checklistItems = await ChecklistItem.find({ trip: tripId })
      .populate('creator', 'name email')
      .populate('checkedBy', 'name email')
      .sort({ createdAt: 1 }); // Sort by creation date ascending

    return checklistItems.map((item) => ({
      id: item._id,
      trip: item.trip,
      text: item.text,
      isChecked: item.isChecked,
      checkedBy: item.checkedBy,
      checkedAt: item.checkedAt,
      creator: item.creator,
      createdAt: item.createdAt,
    }));
  } catch (e) {
    throw e;
  }
};
