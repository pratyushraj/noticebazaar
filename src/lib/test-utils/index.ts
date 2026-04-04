import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Test utilities and helpers

/**
 * Creates a test query client with disabled retries and error boundaries
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress errors in tests
    },
  });

/**
 * Test wrapper that provides necessary context providers
 */
export const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(BrowserRouter, null, children)
  );
};

/**
 * Custom render function that includes all necessary providers
 */
export const customRender = (ui: React.ReactElement, options = {}) =>
  render(ui, { wrapper: TestWrapper, ...options });

/**
 * Mock implementations for common dependencies
 */

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        maybeSingle: vi.fn(),
        order: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
      order: vi.fn(() => ({
        limit: vi.fn(),
        eq: vi.fn(),
      })),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  })),
};

// Mock analytics
export const mockTrackEvent = vi.fn();

// Mock toast notifications
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
};

// Test data factories
export const createMockCreator = (overrides = {}) => ({
  id: 'creator-123',
  email: 'creator@test.com',
  first_name: 'Test',
  last_name: 'Creator',
  instagram_handle: 'testcreator',
  bio: 'Test creator bio',
  location: 'Delhi, India',
  website: 'https://testcreator.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockBrandDeal = (overrides = {}) => ({
  id: 'deal-123',
  creator_id: 'creator-123',
  brand_name: 'Test Brand',
  deal_amount: 5000,
  status: 'active',
  deliverables: '["1 Reel", "2 Stories"]',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockCollabRequest = (overrides = {}) => ({
  id: 'request-123',
  brand_name: 'Test Brand',
  brand_email: 'brand@test.com',
  collab_type: 'paid',
  budget_range: '5000-10000',
  exact_budget: 7500,
  campaign_description: 'Test campaign description',
  deliverables: ['1 Reel', '2 Stories'],
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

// Custom test matchers
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeVisibleInViewport(): T;
  }
}

expect.extend({
  toBeVisibleInViewport(received) {
    const element = received as Element;
    if (!element) {
      return {
        message: () => 'Element is null or undefined',
        pass: false,
      };
    }

    const rect = element.getBoundingClientRect();
    const isVisible = rect.top >= 0 &&
                     rect.left >= 0 &&
                     rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                     rect.right <= (window.innerWidth || document.documentElement.clientWidth);

    return {
      message: () => `Expected element to ${isVisible ? 'not ' : ''}be visible in viewport`,
      pass: isVisible,
    };
  },
});

// Test utilities for common patterns
export const waitForLoadingToFinish = () =>
  waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

export const setupUserEvent = () => userEvent.setup();

// Accessibility testing helpers
export const testAccessibility = (container: HTMLElement) => {
  // Test for ARIA labels
  const buttonsWithoutLabels = container.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
  expect(buttonsWithoutLabels.length).toBe(0);

  // Test for alt text on images
  const imagesWithoutAlt = container.querySelectorAll('img:not([alt])');
  expect(imagesWithoutAlt.length).toBe(0);

  // Test for proper heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    expect(level).toBeGreaterThanOrEqual(lastLevel - 1); // Allow skipping one level max
    lastLevel = level;
  });
};

// Form testing helpers
export const fillFormField = async (label: string | RegExp, value: string) => {
  const field = screen.getByLabelText(label);
  await userEvent.clear(field);
  await userEvent.type(field, value);
  return field;
};

export const submitForm = async (form?: HTMLElement) => {
  const submitButton = within(form || screen.getByRole('main')).getByRole('button', { name: /submit|save|create/i });
  await userEvent.click(submitButton);
  return submitButton;
};

// Mock setup helpers
export const setupMockAuth = (user = createMockCreator()) => {
  vi.mock('@/integrations/supabase/client', () => ({
    supabase: mockSupabaseClient,
  }));

  vi.mock('@/contexts/SessionContext', () => ({
    useSession: () => ({
      profile: user,
      session: { user },
      loading: false,
    }),
  }));
};

export const setupMockQueries = () => {
  vi.mock('@/lib/hooks/useBrandDeals', () => ({
    useBrandDeals: () => ({
      data: [createMockBrandDeal()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    }),
  }));
};

// Performance testing helpers
export const measureRenderTime = async (component: React.ReactElement) => {
  const startTime = performance.now();

  customRender(component);

  await waitFor(() => {
    expect(document.querySelector('[data-testid], [role]')).toBeInTheDocument();
  });

  const endTime = performance.now();
  return endTime - startTime;
};

// Re-export everything for convenience
export * from '@testing-library/react';
export * from 'vitest';
export { userEvent };