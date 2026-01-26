/**
 * Shared utilities for collaboration link generation and management
 */

import type { Profile } from '@/types/supabase';

/**
 * Get the username to use for the collab link
 * Priority: instagram_handle > username
 */
export const getCollabLinkUsername = (profile: Profile | null | undefined): string | null => {
  if (!profile) return null;
  
  const instagramHandle = profile.instagram_handle?.trim();
  const username = profile.username?.trim();
  
  return instagramHandle || username || null;
};

/**
 * Generate the full collab link URL
 */
export const getCollabLink = (profile: Profile | null | undefined): string | null => {
  const username = getCollabLinkUsername(profile);
  if (!username) return null;
  
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/collab/${username}`;
};

/**
 * Get the display text for the collab link (without protocol/domain)
 */
export const getCollabLinkDisplay = (profile: Profile | null | undefined): string | null => {
  const username = getCollabLinkUsername(profile);
  if (!username) return null;
  
  return `creatorarmour.com/collab/${username}`;
};

/**
 * Check if user has a valid collab link
 */
export const hasCollabLink = (profile: Profile | null | undefined): boolean => {
  return getCollabLinkUsername(profile) !== null;
};

