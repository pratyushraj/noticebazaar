/**
 * Service Layer Types
 * 
 * Base types and interfaces for the service layer architecture.
 * These provide a consistent foundation for all domain services.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// ============================================
// Core Service Types
// ============================================

/**
 * Result wrapper for service operations
 * Provides consistent error handling across all services
 */
export type ServiceResult<T> =
  | { success: true; data: T }
  | { success: false; error: ServiceError };

/**
 * Service error with categorized error types
 */
export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
  originalError?: unknown;
}

/**
 * Standardized error codes for service operations
 */
export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Pagination parameters for list queries
 */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

/**
 * Sort parameters for list queries
 */
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Base query options combining common parameters
 */
export interface QueryOptions extends PaginationParams, SortParams {
  enabled?: boolean;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// Service Interface
// ============================================

/**
 * Base interface for all domain services
 * Services should implement this interface for consistency
 */
export interface IService {
  /**
   * The Supabase client instance (can be mocked for testing)
   */
  readonly supabase: SupabaseClient<Database>;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Create a successful service result
 */
export function ok<T>(data: T): ServiceResult<T> {
  return { success: true, data };
}

/**
 * Create a failed service result
 */
export function fail<T>(
  code: ServiceErrorCode,
  message: string,
  details?: Record<string, unknown>,
  originalError?: unknown
): ServiceResult<T> {
  return {
    success: false,
    error: { code, message, details, originalError },
  };
}

/**
 * Map Supabase/PostgreSQL error codes to service error codes
 */
export function mapSupabaseError(error: any): ServiceError {
  const code = error?.code || '';
  const message = error?.message || 'An unknown error occurred';

  // Common PostgreSQL error codes
  switch (code) {
    case 'PGRST116': // No rows found
    case '42P01': // Table does not exist
      return { code: 'NOT_FOUND', message: 'Resource not found', originalError: error };
    case '42501': // Insufficient privilege
      return { code: 'FORBIDDEN', message: 'Access denied', originalError: error };
    case '23505': // Unique violation
      return { code: 'VALIDATION_ERROR', message: 'Resource already exists', originalError: error };
    case '23503': // Foreign key violation
      return { code: 'VALIDATION_ERROR', message: 'Referenced resource not found', originalError: error };
    case '23502': // Not null violation
      return { code: 'VALIDATION_ERROR', message: 'Required field is missing', originalError: error };
    default:
      // Check for common error patterns
      if (message.includes('permission denied') || message.includes('row-level security')) {
        return { code: 'FORBIDDEN', message: 'Access denied', originalError: error };
      }
      if (message.includes('network') || message.includes('fetch')) {
        return { code: 'NETWORK_ERROR', message: 'Network error occurred', originalError: error };
      }
      return { code: 'DATABASE_ERROR', message, originalError: error };
  }
}

/**
 * Handle Supabase query result and convert to ServiceResult
 */
export function handleResult<T>(
  data: T | null,
  error: any
): ServiceResult<T> {
  if (error) {
    return { success: false, error: mapSupabaseError(error) };
  }
  if (data === null) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    };
  }
  return { success: true, data };
}

/**
 * Handle Supabase list result and convert to ServiceResult
 */
export function handleListResult<T>(
  data: T[] | null,
  error: any
): ServiceResult<T[]> {
  if (error) {
    return { success: false, error: mapSupabaseError(error) };
  }
  return { success: true, data: data ?? [] };
}
