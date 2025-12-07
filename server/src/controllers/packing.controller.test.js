import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPackingSuggestions, addSuggestionsToChecklist } from './packing.controller.js';

// Mock the services
vi.mock('#services/packing.service.js', () => ({
  generatePackingSuggestions: vi.fn(),
}));

vi.mock('#services/trip.service.js', () => ({
  getTripById: vi.fn(),
}));

vi.mock('#services/checklist.service.js', () => ({
  createChecklistItem: vi.fn(),
}));

vi.mock('#models/notification.model.js', () => ({
  default: {
    insertMany: vi.fn(),
  },
}));

vi.mock('#models/trip.model.js', () => ({
  default: {
    findById: vi.fn(),
  },
}));

import { generatePackingSuggestions as mockGeneratePackingSuggestions } from '#services/packing.service.js';
import { getTripById as mockGetTripById } from '#services/trip.service.js';
import { createChecklistItem as mockCreateChecklistItem } from '#services/checklist.service.js';
import Notification from '#models/notification.model.js';
import Trip from '#models/trip.model.js';

describe('Packing Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: { id: 'user123' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('getPackingSuggestions', () => {
    it('should return packing suggestions for a valid trip', async () => {
      req.params.tripId = 'trip123';

      const mockTrip = {
        id: 'trip123',
        title: 'Beach Vacation',
        destinationType: 'beach',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-20'),
      };

      const mockSuggestions = [
        {
          category: 'Travel Essentials',
          items: ['Passport/ID', 'Phone'],
        },
        {
          category: 'Beach Essentials',
          items: ['Swimwear', 'Sunscreen (SPF 30+)'],
        },
      ];

      mockGetTripById.mockResolvedValue(mockTrip);
      mockGeneratePackingSuggestions.mockReturnValue(mockSuggestions);

      await getPackingSuggestions(req, res);

      expect(mockGetTripById).toHaveBeenCalledWith('trip123', 'user123');
      expect(mockGeneratePackingSuggestions).toHaveBeenCalledWith({
        destinationType: 'beach',
        startDate: mockTrip.startDate,
        endDate: mockTrip.endDate,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tripId: 'trip123',
          suggestions: mockSuggestions,
        },
      });
    });

    it('should return 404 if trip not found', async () => {
      req.params.tripId = 'nonexistent';

      mockGetTripById.mockRejectedValue(new Error('Trip not found'));

      await getPackingSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Trip not found',
        message: 'Trip not found',
      });
    });

    it('should return 403 if user is not a member', async () => {
      req.params.tripId = 'trip123';

      mockGetTripById.mockRejectedValue(new Error('Access denied: You are not a member of this trip'));

      await getPackingSuggestions(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access denied',
        message: 'Access denied: You are not a member of this trip',
      });
    });
  });

  describe('addSuggestionsToChecklist', () => {
    it('should add packing suggestions to checklist', async () => {
      req.params.tripId = 'trip123';
      req.body.items = ['Swimwear', 'Sunscreen (SPF 30+)', 'Beach towel'];

      const mockTrip = {
        id: 'trip123',
        title: 'Beach Vacation',
        destinationType: 'beach',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-20'),
      };

      const mockChecklistItem = {
        id: 'item123',
        trip: 'trip123',
        text: 'Swimwear',
        isChecked: false,
        creator: { id: 'user123', name: 'Test User' },
      };

      mockGetTripById.mockResolvedValue(mockTrip);
      mockCreateChecklistItem.mockResolvedValue(mockChecklistItem);
      Trip.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          members: [
            { _id: 'user123' },
            { _id: 'user456' },
          ],
        }),
      });
      Notification.insertMany.mockResolvedValue([]);

      await addSuggestionsToChecklist(req, res);

      expect(mockGetTripById).toHaveBeenCalledWith('trip123', 'user123');
      expect(mockCreateChecklistItem).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          message: '3 items added to checklist',
        }),
      });
    });

    it('should return 400 if items array is empty', async () => {
      req.params.tripId = 'trip123';
      req.body.items = [];

      await addSuggestionsToChecklist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Items array is required and must not be empty',
      });
    });

    it('should return 400 if items is not an array', async () => {
      req.params.tripId = 'trip123';
      req.body.items = 'not an array';

      await addSuggestionsToChecklist(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation failed',
        message: 'Items array is required and must not be empty',
      });
    });

    it('should return 404 if trip not found', async () => {
      req.params.tripId = 'nonexistent';
      req.body.items = ['Swimwear'];

      mockGetTripById.mockRejectedValue(new Error('Trip not found'));

      await addSuggestionsToChecklist(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Trip not found',
        message: 'Trip not found',
      });
    });

    it('should filter out empty strings from items', async () => {
      req.params.tripId = 'trip123';
      req.body.items = ['Swimwear', '', '  ', 'Sunscreen'];

      const mockTrip = {
        id: 'trip123',
        title: 'Beach Vacation',
      };

      mockGetTripById.mockResolvedValue(mockTrip);
      mockCreateChecklistItem.mockResolvedValue({ id: 'item123' });
      Trip.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue({
          members: [{ _id: 'user123' }],
        }),
      });

      await addSuggestionsToChecklist(req, res);

      // Should only create 2 items (empty strings filtered out)
      expect(mockCreateChecklistItem).toHaveBeenCalledTimes(2);
    });
  });
});
