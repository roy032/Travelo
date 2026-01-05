import { describe, it, expect } from 'vitest';
import {
  extractCoordinates,
  filterActivitiesWithCoordinates,
  calculateMapBounds,
} from './map.js';

describe('Map Utility Functions', () => {
  describe('extractCoordinates', () => {
    it('should return empty array for non-array input', () => {
      expect(extractCoordinates(null)).toEqual([]);
      expect(extractCoordinates(undefined)).toEqual([]);
      expect(extractCoordinates('not an array')).toEqual([]);
    });

    it('should filter activities with valid coordinates', () => {
      const activities = [
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

      const result = extractCoordinates(activities);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });

    it('should exclude activities without coordinates', () => {
      const activities = [
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
          },
        },
      ];

      const result = extractCoordinates(activities);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('should exclude activities with invalid coordinate values', () => {
      const activities = [
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
            coordinates: { lat: 'invalid', lng: -74.006 },
          },
        },
        {
          id: '3',
          title: 'Activity 3',
          location: {
            name: 'Location 3',
            coordinates: { lat: 100, lng: -74.006 }, // lat out of range
          },
        },
        {
          id: '4',
          title: 'Activity 4',
          location: {
            name: 'Location 4',
            coordinates: { lat: 40.7128, lng: 200 }, // lng out of range
          },
        },
      ];

      const result = extractCoordinates(activities);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('filterActivitiesWithCoordinates', () => {
    it('should be an alias for extractCoordinates', () => {
      const activities = [
        {
          id: '1',
          title: 'Activity 1',
          location: {
            name: 'Location 1',
            coordinates: { lat: 40.7128, lng: -74.006 },
          },
        },
      ];

      const result = filterActivitiesWithCoordinates(activities);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('calculateMapBounds', () => {
    it('should return null for empty array', () => {
      expect(calculateMapBounds([])).toBeNull();
    });

    it('should return null for activities without coordinates', () => {
      const activities = [
        {
          id: '1',
          title: 'Activity 1',
          location: { name: 'Location 1' },
        },
      ];

      expect(calculateMapBounds(activities)).toBeNull();
    });

    it('should calculate bounds for single activity', () => {
      const activities = [
        {
          id: '1',
          title: 'Activity 1',
          location: {
            name: 'Location 1',
            coordinates: { lat: 40.7128, lng: -74.006 },
          },
        },
      ];

      const bounds = calculateMapBounds(activities);
      expect(bounds).not.toBeNull();
      expect(bounds.center.lat).toBe(40.7128);
      expect(bounds.center.lng).toBe(-74.006);
      expect(bounds.north).toBeGreaterThan(40.7128);
      expect(bounds.south).toBeLessThan(40.7128);
      expect(bounds.east).toBeGreaterThan(-74.006);
      expect(bounds.west).toBeLessThan(-74.006);
    });

    it('should calculate bounds for multiple activities', () => {
      const activities = [
        {
          id: '1',
          title: 'Activity 1',
          location: {
            name: 'New York',
            coordinates: { lat: 40.7128, lng: -74.006 },
          },
        },
        {
          id: '2',
          title: 'Activity 2',
          location: {
            name: 'London',
            coordinates: { lat: 51.5074, lng: -0.1278 },
          },
        },
      ];

      const bounds = calculateMapBounds(activities);
      expect(bounds).not.toBeNull();

      // Check that bounds contain all points
      expect(bounds.north).toBeGreaterThan(51.5074);
      expect(bounds.south).toBeLessThan(40.7128);
      expect(bounds.east).toBeGreaterThan(-0.1278);
      expect(bounds.west).toBeLessThan(-74.006);

      // Check center is between the two points
      expect(bounds.center.lat).toBeGreaterThan(40.7128);
      expect(bounds.center.lat).toBeLessThan(51.5074);
      expect(bounds.center.lng).toBeGreaterThan(-74.006);
      expect(bounds.center.lng).toBeLessThan(-0.1278);
    });

    it('should add padding to bounds', () => {
      const activities = [
        {
          id: '1',
          title: 'Activity 1',
          location: {
            name: 'Location 1',
            coordinates: { lat: 40, lng: -74 },
          },
        },
        {
          id: '2',
          title: 'Activity 2',
          location: {
            name: 'Location 2',
            coordinates: { lat: 50, lng: -64 },
          },
        },
      ];

      const bounds = calculateMapBounds(activities);

      // Bounds should extend beyond the actual coordinates due to padding
      expect(bounds.north).toBeGreaterThan(50);
      expect(bounds.south).toBeLessThan(40);
      expect(bounds.east).toBeGreaterThan(-64);
      expect(bounds.west).toBeLessThan(-74);
    });
  });
});
