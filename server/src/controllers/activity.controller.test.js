import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMapDataController } from './activity.controller.js';
import * as activityService from '#services/activity.service.js';
import * as mapUtils from '#utils/map.js';

// Mock the service and utils
vi.mock('#services/activity.service.js');
vi.mock('#utils/map.js');

describe('Activity Controller - Map Data', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { tripId: 'trip123' },
      user: { id: 'user123' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  describe('getMapDataController', () => {
    it('should return activities with coordinates and bounds', async () => {
      const mockActivities = [
        {
          id: '1',
          title: 'Activity 1',
          location: {
            name: 'Location 1',
            coordinates: { lat: 40.7128, lng: -74.006 },
          },
        },
        {
          id: '2',
          title: 'Activity 2',
          location: {
            name: 'Location 2',
            coordinates: { lat: 51.5074, lng: -0.1278 },
          },
        },
      ];

      const mockBounds = {
        north: 52,
        south: 40,
        east: 0,
        west: -75,
        center: { lat: 46, lng: -37 },
      };

      vi.mocked(activityService.getActivitiesByTrip).mockResolvedValue(mockActivities);
      vi.mocked(mapUtils.filterActivitiesWithCoordinates).mockReturnValue(mockActivities);
      vi.mocked(mapUtils.calculateMapBounds).mockReturnValue(mockBounds);

      await getMapDataController(req, res, next);

      expect(activityService.getActivitiesByTrip).toHaveBeenCalledWith('trip123', 'user123');
      expect(mapUtils.filterActivitiesWithCoordinates).toHaveBeenCalledWith(mockActivities);
      expect(mapUtils.calculateMapBounds).toHaveBeenCalledWith(mockActivities);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        activities: mockActivities,
        count: 2,
        bounds: mockBounds,
      });
    });

    it('should return empty activities and null bounds when no coordinates', async () => {
      const mockActivities = [
        {
          id: '1',
          title: 'Activity 1',
          location: { name: 'Location 1' },
        },
      ];

      vi.mocked(activityService.getActivitiesByTrip).mockResolvedValue(mockActivities);
      vi.mocked(mapUtils.filterActivitiesWithCoordinates).mockReturnValue([]);
      vi.mocked(mapUtils.calculateMapBounds).mockReturnValue(null);

      await getMapDataController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        activities: [],
        count: 0,
        bounds: null,
      });
    });

    it('should return 404 when trip not found', async () => {
      vi.mocked(activityService.getActivitiesByTrip).mockRejectedValue(
        new Error('Trip not found')
      );

      await getMapDataController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Resource not found',
        message: 'Trip not found',
      });
    });

    it('should return 403 when user is not a member', async () => {
      vi.mocked(activityService.getActivitiesByTrip).mockRejectedValue(
        new Error('Access denied: You are not a member of this trip')
      );

      await getMapDataController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'You are not a member of this trip',
      });
    });

    it('should call next with error for unexpected errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      vi.mocked(activityService.getActivitiesByTrip).mockRejectedValue(unexpectedError);

      await getMapDataController(req, res, next);

      expect(next).toHaveBeenCalledWith(unexpectedError);
    });
  });
});
