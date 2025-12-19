import { generatePackingSuggestions } from '#services/packing.service.js';
import { getTripById } from '#services/trip.service.js';
import { createChecklistItem } from '#services/checklist.service.js';
import Notification from '#models/notification.model.js';
import Trip from '#models/trip.model.js';

/**
 * Get packing suggestions for a trip
 * @route GET /api/trips/:tripId/packing-suggestions
 */
export const getPackingSuggestions = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;

    // Get trip details and verify user is a member
    const trip = await getTripById(tripId, userId);

    // Generate packing suggestions based on trip properties
    const suggestions = generatePackingSuggestions({
      destinationType: trip.destinationType,
      startDate: trip.startDate,
      endDate: trip.endDate,
    });

    res.status(200).json({
      success: true,
      data: {
        tripId: trip.id,
        suggestions,
      },
    });
  } catch (error) {
    console.error('Error getting packing suggestions:', error);

    if (error.message === 'Trip not found') {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get packing suggestions',
    });
  }
};

/**
 * Add packing suggestions to trip checklist
 * @route POST /api/trips/:tripId/packing-suggestions/add-to-checklist
 */
export const addSuggestionsToChecklist = async (req, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user.id;
    const { items } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Items array is required and must not be empty',
      });
    }

    // Get trip details and verify user is a member
    const trip = await getTripById(tripId, userId);

    // Verify user is a trip member (getTripById already does this)
    // Create checklist items for each selected suggestion
    const createdItems = [];

    for (const itemText of items) {
      if (typeof itemText === 'string' && itemText.trim().length > 0) {
        const checklistItem = await createChecklistItem({
          trip: tripId,
          text: itemText.trim(),
          creator: userId,
        });
        createdItems.push(checklistItem);
      }
    }

    // Get all trip members for notifications
    const tripData = await Trip.findById(tripId).populate('members', '_id');
    const memberIds = tripData.members.map((member) => member._id.toString());

    // Create notifications for all trip members
    const notifications = memberIds
      .filter((memberId) => memberId !== userId.toString())
      .map((memberId) => ({
        user: memberId,
        type: 'activity_added',
        title: 'Packing Items Added',
        message: `${createdItems.length} packing items have been added to the checklist for "${trip.title}"`,
        relatedTrip: tripId,
      }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      data: {
        message: `${createdItems.length} items added to checklist`,
        items: createdItems,
      },
    });
  } catch (error) {
    console.error('Error adding suggestions to checklist:', error);

    if (error.message === 'Trip not found') {
      return res.status(404).json({
        success: false,
        error: 'Trip not found',
        message: error.message,
      });
    }

    if (error.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to add suggestions to checklist',
    });
  }
};
