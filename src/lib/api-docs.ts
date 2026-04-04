/**
 * Creator Armour API Documentation
 *
 * This file contains comprehensive API documentation for the Creator Armour platform.
 * All endpoints are organized by category and include request/response examples.
 */

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  authentication: boolean;
  requestBody?: any;
  responseBody?: any;
  queryParams?: Record<string, string>;
  pathParams?: Record<string, string>;
  examples?: {
    request?: any;
    response?: any;
  };
  errors?: Array<{
    code: string;
    message: string;
    status: number;
  }>;
}

export interface APISection {
  title: string;
  description: string;
  endpoints: APIEndpoint[];
}

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

export const authAPIs: APISection = {
  title: 'Authentication',
  description: 'User authentication and session management',
  endpoints: [
    {
      method: 'POST',
      path: '/auth/login',
      description: 'Authenticate user with email and password',
      authentication: false,
      requestBody: {
        email: 'user@example.com',
        password: 'password123'
      },
      responseBody: {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          role: 'creator',
          profile: {
            first_name: 'John',
            last_name: 'Doe',
            instagram_handle: 'johndoe'
          }
        },
        session: {
          access_token: 'jwt-token',
          refresh_token: 'refresh-token',
          expires_at: 1638360000
        }
      },
      errors: [
        { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect', status: 401 },
        { code: 'ACCOUNT_DISABLED', message: 'Account has been disabled', status: 403 }
      ]
    },
    {
      method: 'POST',
      path: '/auth/signup',
      description: 'Create new user account',
      authentication: false,
      requestBody: {
        email: 'user@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        role: 'creator',
        instagram_handle: 'johndoe'
      },
      responseBody: {
        user: { id: 'user-123', email: 'user@example.com' },
        message: 'Account created successfully. Please check your email for verification.'
      }
    },
    {
      method: 'POST',
      path: '/auth/logout',
      description: 'End user session',
      authentication: true,
      responseBody: { message: 'Logged out successfully' }
    }
  ]
};

// ============================================================================
// CREATOR APIs
// ============================================================================

export const creatorAPIs: APISection = {
  title: 'Creator Management',
  description: 'APIs for managing creator profiles and analytics',
  endpoints: [
    {
      method: 'GET',
      path: '/creators/{creatorId}',
      description: 'Get creator profile information',
      authentication: true,
      pathParams: { creatorId: 'Creator ID (can be "me" for current user)' },
      responseBody: {
        id: 'creator-123',
        email: 'creator@example.com',
        first_name: 'John',
        last_name: 'Creator',
        instagram_handle: 'johndoe',
        bio: 'Content creator specializing in tech reviews',
        location: 'Mumbai, India',
        website: 'https://johndoe.com',
        followers_count: 50000,
        engagement_rate: 4.2,
        categories: ['Technology', 'Reviews'],
        verified: true,
        created_at: '2024-01-01T00:00:00Z'
      }
    },
    {
      method: 'PUT',
      path: '/creators/{creatorId}',
      description: 'Update creator profile',
      authentication: true,
      pathParams: { creatorId: 'Creator ID (can be "me" for current user)' },
      requestBody: {
        bio: 'Updated bio',
        location: 'Delhi, India',
        categories: ['Technology', 'Gaming']
      },
      responseBody: {
        message: 'Profile updated successfully',
        profile: { /* updated profile object */ }
      }
    },
    {
      method: 'GET',
      path: '/creators/{creatorId}/analytics',
      description: 'Get creator analytics and performance metrics',
      authentication: true,
      pathParams: { creatorId: 'Creator ID' },
      queryParams: {
        period: '30d | 90d | 1y (default: 30d)',
        metrics: 'earnings,deals,engagement (comma-separated)'
      },
      responseBody: {
        period: '30d',
        metrics: {
          total_earnings: 125000,
          total_deals: 24,
          average_deal_value: 5208,
          response_rate: 89,
          completion_rate: 95,
          monthly_trend: [
            { month: '2024-11', earnings: 18500, deals: 5 }
          ]
        }
      }
    }
  ]
};

// ============================================================================
// BRAND DEAL APIs
// ============================================================================

export const brandDealAPIs: APISection = {
  title: 'Brand Deals',
  description: 'APIs for managing brand collaborations and deals',
  endpoints: [
    {
      method: 'GET',
      path: '/deals',
      description: 'List brand deals for current user',
      authentication: true,
      queryParams: {
        status: 'active | completed | pending | cancelled',
        limit: 'Number of results (default: 20)',
        offset: 'Pagination offset (default: 0)',
        sort_by: 'created_at | updated_at | deal_amount',
        sort_order: 'asc | desc'
      },
      responseBody: {
        deals: [
          {
            id: 'deal-123',
            brand_name: 'Nike',
            deal_amount: 25000,
            status: 'active',
            deliverables: ['1 Instagram Reel', '3 Stories'],
            due_date: '2024-12-15T00:00:00Z',
            created_at: '2024-11-15T00:00:00Z'
          }
        ],
        total: 24,
        has_more: true
      }
    },
    {
      method: 'GET',
      path: '/deals/{dealId}',
      description: 'Get detailed deal information',
      authentication: true,
      pathParams: { dealId: 'Deal ID' },
      responseBody: {
        id: 'deal-123',
        creator_id: 'creator-456',
        brand_name: 'Nike',
        brand_email: 'contact@nike.com',
        deal_amount: 25000,
        status: 'active',
        deliverables: ['1 Instagram Reel', '3 Stories'],
        content_requirements: 'Product showcase with authentic usage',
        deadline: '2024-12-15T00:00:00Z',
        contract_file_url: 'https://.../contract.pdf',
        payment_status: 'pending',
        created_at: '2024-11-15T00:00:00Z',
        updated_at: '2024-11-15T00:00:00Z'
      }
    },
    {
      method: 'POST',
      path: '/deals/{dealId}/accept',
      description: 'Accept a brand deal offer',
      authentication: true,
      pathParams: { dealId: 'Deal ID' },
      responseBody: {
        message: 'Deal accepted successfully',
        deal: { /* updated deal object */ },
        next_steps: [
          'Review contract terms',
          'Submit content requirements',
          'Schedule content creation'
        ]
      }
    },
    {
      method: 'POST',
      path: '/deals/{dealId}/decline',
      description: 'Decline a brand deal offer',
      authentication: true,
      pathParams: { dealId: 'Deal ID' },
      requestBody: {
        reason: 'Not aligned with brand values',
        feedback: 'Optional feedback for the brand'
      },
      responseBody: {
        message: 'Deal declined successfully'
      }
    }
  ]
};

// ============================================================================
// COLLABORATION REQUEST APIs
// ============================================================================

export const collabRequestAPIs: APISection = {
  title: 'Collaboration Requests',
  description: 'APIs for brand-to-creator collaboration requests',
  endpoints: [
    {
      method: 'GET',
      path: '/collab/{creatorHandle}',
      description: 'Get creator collaboration page data',
      authentication: false,
      pathParams: { creatorHandle: 'Instagram handle without @' },
      responseBody: {
        creator: {
          name: 'John Doe',
          handle: 'johndoe',
          bio: 'Tech content creator',
          followers: 50000,
          engagement_rate: 4.2,
          categories: ['Technology', 'Reviews'],
          pricing: {
            reel: 5000,
            story: 2000,
            post: 3000
          }
        },
        recent_work: [
          { type: 'reel', brand: 'Samsung', engagement: '2.1M views' }
        ]
      }
    },
    {
      method: 'POST',
      path: '/collab/{creatorHandle}/submit',
      description: 'Submit collaboration request from brand',
      authentication: false,
      pathParams: { creatorHandle: 'Instagram handle without @' },
      requestBody: {
        brand_name: 'Nike India',
        brand_email: 'contact@nike.in',
        collab_type: 'paid',
        exact_budget: 25000,
        campaign_description: 'Launch campaign for new running shoes',
        deliverables: ['1 Instagram Reel', '3 Stories'],
        deadline: '2024-12-15',
        brand_website: 'https://nike.com/in',
        brand_instagram: 'nikeindia'
      },
      responseBody: {
        message: 'Collaboration request submitted successfully',
        request_id: 'request-123',
        next_steps: 'Creator will review and respond within 48 hours'
      }
    }
  ]
};

// ============================================================================
// PAYMENT APIs
// ============================================================================

export const paymentAPIs: APISection = {
  title: 'Payments',
  description: 'Payment processing and financial operations',
  endpoints: [
    {
      method: 'GET',
      path: '/payments',
      description: 'List payment transactions',
      authentication: true,
      queryParams: {
        status: 'pending | completed | failed | refunded',
        type: 'incoming | outgoing',
        limit: '20',
        offset: '0'
      },
      responseBody: {
        payments: [
          {
            id: 'payment-123',
            amount: 25000,
            currency: 'INR',
            status: 'completed',
            type: 'incoming',
            description: 'Nike collaboration payment',
            deal_id: 'deal-456',
            created_at: '2024-12-01T00:00:00Z',
            completed_at: '2024-12-02T00:00:00Z'
          }
        ],
        total: 150,
        has_more: true
      }
    },
    {
      method: 'POST',
      path: '/payments/{paymentId}/confirm',
      description: 'Confirm payment received (creator action)',
      authentication: true,
      pathParams: { paymentId: 'Payment ID' },
      responseBody: {
        message: 'Payment confirmed successfully',
        payment: { /* updated payment object */ }
      }
    }
  ]
};

// ============================================================================
// ANALYTICS APIs
// ============================================================================

export const analyticsAPIs: APISection = {
  title: 'Analytics',
  description: 'Platform analytics and insights',
  endpoints: [
    {
      method: 'GET',
      path: '/analytics/overview',
      description: 'Get platform-wide analytics (admin only)',
      authentication: true,
      responseBody: {
        total_users: 1250,
        total_deals: 340,
        total_volume: 2500000,
        monthly_growth: {
          users: 12.5,
          deals: 8.3,
          volume: 15.2
        },
        top_categories: [
          { category: 'Fashion', deals: 85, volume: 650000 },
          { category: 'Beauty', deals: 67, volume: 480000 }
        ]
      }
    },
    {
      method: 'GET',
      path: '/analytics/track',
      description: 'Track user interactions and events',
      authentication: false,
      queryParams: {
        event: 'page_view | button_click | form_submit',
        page: 'Current page URL',
        data: 'JSON string of additional data'
      },
      responseBody: { message: 'Event tracked successfully' }
    }
  ]
};

// ============================================================================
// WEBHOOK APIs (for integrations)
// ============================================================================

export const webhookAPIs: APISection = {
  title: 'Webhooks',
  description: 'Webhook endpoints for external integrations',
  endpoints: [
    {
      method: 'POST',
      path: '/webhooks/payment-update',
      description: 'Receive payment status updates from payment gateway',
      authentication: true, // API key authentication
      requestBody: {
        payment_id: 'payment-123',
        status: 'completed | failed | refunded',
        amount: 25000,
        currency: 'INR',
        transaction_id: 'txn_abc123',
        timestamp: '2024-12-01T10:00:00Z'
      },
      responseBody: { message: 'Payment update processed' }
    },
    {
      method: 'POST',
      path: '/webhooks/deal-update',
      description: 'Receive deal status updates from external systems',
      authentication: true,
      requestBody: {
        deal_id: 'deal-123',
        status: 'completed | cancelled',
        reason: 'Optional reason for status change',
        metadata: {}
      },
      responseBody: { message: 'Deal update processed' }
    }
  ]
};

// ============================================================================
// EXPORT ALL APIs
// ============================================================================

export const apiDocumentation = {
  auth: authAPIs,
  creators: creatorAPIs,
  deals: brandDealAPIs,
  collaborations: collabRequestAPIs,
  payments: paymentAPIs,
  analytics: analyticsAPIs,
  webhooks: webhookAPIs,
};

// Helper function to generate API documentation in different formats
export const generateAPIDocs = (format: 'json' | 'markdown' = 'json') => {
  if (format === 'markdown') {
    return generateMarkdownDocs();
  }
  return apiDocumentation;
};

const generateMarkdownDocs = () => {
  let markdown = '# Creator Armour API Documentation\n\n';

  Object.entries(apiDocumentation).forEach(([sectionKey, section]) => {
    markdown += `## ${section.title}\n\n${section.description}\n\n`;

    section.endpoints.forEach(endpoint => {
      markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
      markdown += `${endpoint.description}\n\n`;

      if (endpoint.authentication) {
        markdown += '**Authentication:** Required\n\n';
      }

      if (endpoint.pathParams) {
        markdown += '**Path Parameters:**\n';
        Object.entries(endpoint.pathParams).forEach(([param, desc]) => {
          markdown += `- \`${param}\`: ${desc}\n`;
        });
        markdown += '\n';
      }

      if (endpoint.queryParams) {
        markdown += '**Query Parameters:**\n';
        Object.entries(endpoint.queryParams).forEach(([param, desc]) => {
          markdown += `- \`${param}\`: ${desc}\n`;
        });
        markdown += '\n';
      }

      if (endpoint.requestBody) {
        markdown += '**Request Body:**\n```json\n' +
          JSON.stringify(endpoint.requestBody, null, 2) + '\n```\n\n';
      }

      if (endpoint.responseBody) {
        markdown += '**Response:**\n```json\n' +
          JSON.stringify(endpoint.responseBody, null, 2) + '\n```\n\n';
      }

      if (endpoint.errors && endpoint.errors.length > 0) {
        markdown += '**Errors:**\n';
        endpoint.errors.forEach(error => {
          markdown += `- \`${error.code}\` (${error.status}): ${error.message}\n`;
        });
        markdown += '\n';
      }
    });
  });

  return markdown;
};

// Export individual sections for easier imports
export {
  authAPIs,
  creatorAPIs,
  brandDealAPIs,
  collabRequestAPIs,
  paymentAPIs,
  analyticsAPIs,
  webhookAPIs
};