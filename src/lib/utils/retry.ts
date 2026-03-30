/**
 * Retry utility with exponential backoff for API calls.
 */

export interface RetryOptions {
  /** Maximum number of retries (default: 2) */
  maxRetries?: number;
  /** Base delay in ms before first retry (default: 1000) */
  baseDelay?: number;
  /** Maximum delay in ms between retries (default: 8000) */
  maxDelay?: number;
  /** Optional predicate to decide whether to retry based on the error */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const defaultShouldRetry = (_error: unknown, _attempt: number): boolean => true;

/**
 * Wraps an async function with retry logic using exponential backoff.
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns The result of the function on success
 * @throws The last error encountered after all retries are exhausted
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    baseDelay = 1000,
    maxDelay = 8000,
    shouldRetry = defaultShouldRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= maxRetries || !shouldRetry(error, attempt + 1)) {
        throw error;
      }

      // Exponential backoff: baseDelay * 2^attempt, capped at maxDelay
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Wraps a fetch call with retry logic.
 * Only retries on network errors or 5xx status codes (not 4xx client errors).
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  return withRetry(async () => {
    const response = await fetch(url, init);
    // Retry on 5xx server errors
    if (response.status >= 500 && response.status < 600) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response;
  }, {
    ...options,
    shouldRetry: (error, attempt) => {
      // Don't retry 4xx errors
      if (error instanceof Response && error.status >= 400 && error.status < 500) {
        return false;
      }
      return options?.shouldRetry?.(error, attempt) ?? true;
    },
  });
}
