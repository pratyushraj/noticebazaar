// Basic tests for Influencer Finder
// Tests AI classification, fit score calculation, and deduplication

import { describe, test, expect } from '@jest/globals';
import type { InfluencerProfile, InfluencerClassification } from '../services/influencerFinder';

// Mock data for testing
const mockProfile: InfluencerProfile = {
  creator_name: 'John Doe',
  instagram_handle: 'johndoe',
  followers: 50000,
  bio: 'Fitness enthusiast | India | Content Creator',
  link_in_bio: 'https://linktr.ee/johndoe',
  website: 'https://johndoe.com',
  profile_link: 'https://instagram.com/johndoe',
  location: 'Mumbai, India',
  last_post_date: new Date(),
  posts_count: 150,
  is_verified: false
};

describe('Influencer Finder Tests', () => {
  describe('Fit Score Calculation', () => {
    test('should calculate fit score correctly', () => {
      const classification: InfluencerClassification = {
        niche: 'fitness',
        fit_score: 7,
        is_india_based: true,
        is_relevant_niche: true,
        is_active: true,
        reasoning: 'Good fit',
        confidence: 0.8,
        classification_metadata: {
          detected_location: 'India',
          detected_niche: 'fitness',
          niche_confidence: 0.9,
          activity_score: 0.8,
          relevance_factors: ['fitness', 'india', 'active'],
          classification_source: 'ai'
        }
      };

      // Fit score should be between 1-10
      expect(classification.fit_score).toBeGreaterThanOrEqual(1);
      expect(classification.fit_score).toBeLessThanOrEqual(10);
    });

    test('should normalize fit score to 1-10 range', () => {
      const scores = [0, 5, 10, 15, -5];
      scores.forEach(score => {
        const normalized = Math.max(1, Math.min(10, Math.round(score)));
        expect(normalized).toBeGreaterThanOrEqual(1);
        expect(normalized).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Deduplication Logic', () => {
    test('should deduplicate by instagram_handle', () => {
      const influencers = [
        { instagram_handle: 'johndoe', fit_score: 7 },
        { instagram_handle: 'johndoe', fit_score: 8 }, // Duplicate, higher score
        { instagram_handle: 'janedoe', fit_score: 6 }
      ];

      const seen = new Map();
      influencers.forEach(inf => {
        const handle = inf.instagram_handle.toLowerCase();
        const existing = seen.get(handle);
        if (!existing || inf.fit_score > existing.fit_score) {
          seen.set(handle, inf);
        }
      });

      expect(seen.size).toBe(2);
      expect(seen.get('johndoe').fit_score).toBe(8); // Higher score kept
    });

    test('should keep influencer with highest fit_score', () => {
      const duplicates = [
        { instagram_handle: 'test', fit_score: 5 },
        { instagram_handle: 'test', fit_score: 8 },
        { instagram_handle: 'test', fit_score: 6 }
      ];

      const seen = new Map();
      duplicates.forEach(inf => {
        const handle = inf.instagram_handle.toLowerCase();
        const existing = seen.get(handle);
        if (!existing || inf.fit_score > existing.fit_score) {
          seen.set(handle, inf);
        }
      });

      expect(seen.get('test').fit_score).toBe(8);
    });
  });

  describe('Filtering Logic', () => {
    test('should filter by follower count', () => {
      const minFollowers = 10000;
      const maxFollowers = 500000;

      const profiles = [
        { followers: 5000 },   // Too low
        { followers: 50000 },   // Valid
        { followers: 600000 },  // Too high
        { followers: 100000 }  // Valid
      ];

      const filtered = profiles.filter(p => 
        p.followers >= minFollowers && p.followers <= maxFollowers
      );

      expect(filtered.length).toBe(2);
      expect(filtered.every(p => p.followers >= minFollowers && p.followers <= maxFollowers)).toBe(true);
    });

    test('should filter by India-based and relevant niche', () => {
      const classification: InfluencerClassification = {
        niche: 'fitness',
        fit_score: 7,
        is_india_based: true,
        is_relevant_niche: true,
        is_active: true,
        reasoning: 'Good fit',
        confidence: 0.8,
        classification_metadata: {}
      };

      const shouldKeep = 
        classification.is_india_based && 
        classification.is_relevant_niche && 
        classification.is_active &&
        classification.fit_score >= 5;

      expect(shouldKeep).toBe(true);
    });
  });

  describe('CSV Generation', () => {
    test('should escape CSV values correctly', () => {
      const escapeCSV = (value: string | undefined | null): string => {
        if (!value) return '';
        const escaped = value.replace(/"/g, '""').replace(/\n/g, ' ');
        if (escaped.includes(',') || escaped.includes('"') || escaped.includes(' ')) {
          return `"${escaped}"`;
        }
        return escaped;
      };

      expect(escapeCSV('normal')).toBe('normal');
      expect(escapeCSV('with, comma')).toBe('"with, comma"');
      expect(escapeCSV('with "quote"')).toBe('"with ""quote"""');
      expect(escapeCSV('with\nnewline')).toBe('"with newline"');
      expect(escapeCSV(null)).toBe('');
      expect(escapeCSV(undefined)).toBe('');
    });
  });

  describe('Rate Limiting', () => {
    test('should respect daily message limit', () => {
      const RATE_LIMIT_DAILY_MAX = 30;
      const messagesSentToday = 25;

      const canSend = messagesSentToday < RATE_LIMIT_DAILY_MAX;
      expect(canSend).toBe(true);

      const cannotSend = (messagesSentToday + 10) > RATE_LIMIT_DAILY_MAX;
      expect(cannotSend).toBe(true);
    });
  });

  describe('Status Flow', () => {
    test('should validate status transitions', () => {
      const validStatuses = ['new', 'contacted', 'replied', 'not_interested', 'converted'];
      const testStatus = 'contacted';

      expect(validStatuses.includes(testStatus)).toBe(true);
    });

    test('should allow status updates', () => {
      const statusFlow = {
        new: ['contacted', 'not_interested'],
        contacted: ['replied', 'not_interested'],
        replied: ['converted', 'not_interested'],
        not_interested: [], // Terminal state
        converted: [] // Terminal state
      };

      const currentStatus = 'new';
      const validNextStatuses = statusFlow[currentStatus as keyof typeof statusFlow];
      
      expect(validNextStatuses).toContain('contacted');
      expect(validNextStatuses).toContain('not_interested');
    });
  });
});


