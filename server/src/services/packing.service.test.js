import { describe, it, expect } from 'vitest';
import { generatePackingSuggestions, evaluatePackingRules } from './packing.service.js';

describe('Packing Service', () => {
  describe('generatePackingSuggestions', () => {
    it('should generate packing suggestions for a beach trip', () => {
      const tripData = {
        destinationType: 'beach',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-20'),
      };

      const suggestions = generatePackingSuggestions(tripData);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      // Should include universal items
      const universalCategory = suggestions.find(s => s.category === 'Travel Essentials');
      expect(universalCategory).toBeDefined();

      // Should include beach-specific items
      const beachCategory = suggestions.find(s => s.category === 'Beach Essentials');
      expect(beachCategory).toBeDefined();
      expect(beachCategory.items).toContain('Swimwear');
      expect(beachCategory.items).toContain('Sunscreen (SPF 30+)');
    });

    it('should generate packing suggestions for a mountain trip', () => {
      const tripData = {
        destinationType: 'mountain',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-20'),
      };

      const suggestions = generatePackingSuggestions(tripData);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);

      // Should include mountain-specific items
      const mountainCategory = suggestions.find(s => s.category === 'Mountain Essentials');
      expect(mountainCategory).toBeDefined();
      expect(mountainCategory.items).toContain('Hiking boots');
      expect(mountainCategory.items).toContain('First aid kit');
    });

    it('should include winter items for winter trips', () => {
      const tripData = {
        destinationType: 'city',
        startDate: new Date('2024-12-15'),
        endDate: new Date('2024-12-20'),
      };

      const suggestions = generatePackingSuggestions(tripData);

      // Should include winter clothing
      const winterCategory = suggestions.find(s => s.category === 'Winter Clothing');
      expect(winterCategory).toBeDefined();
      expect(winterCategory.items).toContain('Heavy winter coat');
      expect(winterCategory.items).toContain('Warm hat');
    });

    it('should include summer items for summer trips', () => {
      const tripData = {
        destinationType: 'city',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-20'),
      };

      const suggestions = generatePackingSuggestions(tripData);

      // Should include summer clothing
      const summerCategory = suggestions.find(s => s.category === 'Summer Clothing');
      expect(summerCategory).toBeDefined();
      expect(summerCategory.items).toContain('T-shirts');
      expect(summerCategory.items).toContain('Shorts');
    });

    it('should include short trip essentials for trips under 7 days', () => {
      const tripData = {
        destinationType: 'city',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-18'),
      };

      const suggestions = generatePackingSuggestions(tripData);

      // Should include short trip items
      const shortTripCategory = suggestions.find(s => s.category === 'Short Trip Essentials');
      expect(shortTripCategory).toBeDefined();
      expect(shortTripCategory.items).toContain('Toiletries (travel size)');
    });

    it('should include long trip essentials for trips over 7 days', () => {
      const tripData = {
        destinationType: 'city',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-25'),
      };

      const suggestions = generatePackingSuggestions(tripData);

      // Should include long trip items
      const longTripCategory = suggestions.find(s => s.category === 'Extended Trip Essentials');
      expect(longTripCategory).toBeDefined();
      expect(longTripCategory.items).toContain('Laundry detergent');
      expect(longTripCategory.items).toContain('Extra shoes');
    });

    it('should handle trips with no destination type', () => {
      const tripData = {
        destinationType: null,
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-20'),
      };

      const suggestions = generatePackingSuggestions(tripData);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      // Should still include universal items
      const universalCategory = suggestions.find(s => s.category === 'Travel Essentials');
      expect(universalCategory).toBeDefined();
    });
  });

  describe('evaluatePackingRules', () => {
    it('should return an array of rules', () => {
      const tripData = {
        destinationType: 'beach',
        startDate: new Date('2024-07-15'),
        endDate: new Date('2024-07-20'),
      };

      const rules = evaluatePackingRules(tripData);

      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0]).toHaveProperty('category');
      expect(rules[0]).toHaveProperty('items');
    });
  });
});
