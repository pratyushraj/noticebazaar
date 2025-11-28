/**
 * Search Service
 * 
 * Unified search logic across all data types
 */

import { BrandDeal } from '@/types';
import { Notification } from '@/types/notifications';

export type SearchResultType = 'deal' | 'payment' | 'contract' | 'notification' | 'message' | 'tax';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  description?: string;
  metadata?: Record<string, any>;
  url?: string;
  icon?: string;
  score?: number; // Relevance score (0-1)
}

/**
 * Simple fuzzy matching - checks if query matches text
 */
function matchesQuery(text: string, query: string): boolean {
  if (!text || !query) return false;
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  // Exact match
  if (normalizedText.includes(normalizedQuery)) return true;
  
  // Word-by-word match
  const queryWords = normalizedQuery.split(/\s+/);
  const textWords = normalizedText.split(/\s+/);
  return queryWords.every(qWord => 
    textWords.some(tWord => tWord.includes(qWord))
  );
}

/**
 * Calculate relevance score (0-1)
 */
function calculateScore(item: any, query: string, fields: string[]): number {
  const normalizedQuery = query.toLowerCase();
  let score = 0;
  let matches = 0;

  for (const field of fields) {
    const value = item[field];
    if (!value) continue;

    const normalizedValue = String(value).toLowerCase();
    
    // Exact match gets highest score
    if (normalizedValue === normalizedQuery) {
      score += 1;
      matches++;
    } 
    // Starts with query
    else if (normalizedValue.startsWith(normalizedQuery)) {
      score += 0.8;
      matches++;
    }
    // Contains query
    else if (normalizedValue.includes(normalizedQuery)) {
      score += 0.5;
      matches++;
    }
  }

  // Normalize score
  return matches > 0 ? Math.min(score / fields.length, 1) : 0;
}

/**
 * Search deals
 */
export function searchDeals(deals: BrandDeal[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const deal of deals) {
    const searchFields = [
      deal.brand_name,
      deal.contact_person,
      deal.platform,
      deal.status,
      deal.brand_email,
      deal.deliverables ? JSON.parse(deal.deliverables).join(' ') : '',
      deal.deal_amount?.toString(),
    ].filter(Boolean);

    const matches = searchFields.some(field => 
      matchesQuery(String(field), query)
    );

    if (matches) {
      const score = calculateScore(deal, query, [
        'brand_name',
        'contact_person',
        'platform',
        'status',
      ]);

      results.push({
        id: deal.id,
        type: 'deal',
        title: deal.brand_name || 'Untitled Deal',
        subtitle: `${deal.platform || 'Multiple'} • ₹${deal.deal_amount?.toLocaleString('en-IN') || '0'}`,
        description: deal.status,
        metadata: {
          amount: deal.deal_amount,
          platform: deal.platform,
          status: deal.status,
          dueDate: deal.due_date,
        },
        url: `/creator-contracts/${deal.id}`,
        score,
      });
    }
  }

  // Sort by relevance score
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Search payments (from deals)
 */
export function searchPayments(deals: BrandDeal[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  // Transform deals to payment transactions
  const paymentDeals = deals.filter(deal => 
    deal.payment_received_date || deal.status === 'Payment Pending'
  );

  for (const deal of paymentDeals) {
    const searchFields = [
      deal.brand_name,
      deal.invoice_file_url ? `INV-${deal.id}` : '',
      deal.utr_number,
      deal.payment_received_date,
      deal.payment_expected_date,
      deal.deal_amount?.toString(),
    ].filter(Boolean);

    const matches = searchFields.some(field => 
      matchesQuery(String(field), query)
    );

    if (matches) {
      const score = calculateScore(deal, query, [
        'brand_name',
        'utr_number',
        'deal_amount',
      ]);

      const isReceived = !!deal.payment_received_date;
      const date = isReceived 
        ? new Date(deal.payment_received_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : deal.payment_expected_date 
          ? `Expected: ${new Date(deal.payment_expected_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          : 'TBD';

      results.push({
        id: deal.id,
        type: 'payment',
        title: `${deal.brand_name} Payment`,
        subtitle: `₹${deal.deal_amount?.toLocaleString('en-IN') || '0'} • ${date}`,
        description: isReceived ? 'Received' : 'Pending',
        metadata: {
          amount: deal.deal_amount,
          status: isReceived ? 'completed' : 'pending',
          date: isReceived ? deal.payment_received_date : deal.payment_expected_date,
          utr: deal.utr_number,
        },
        url: `/creator-payments`,
        score,
      });
    }
  }

  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Search contracts/documents
 */
export function searchContracts(documents: any[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const doc of documents) {
    const searchFields = [
      doc.name,
      doc.type,
      doc.dealName,
      ...(doc.tags || []),
    ].filter(Boolean);

    const matches = searchFields.some(field => 
      matchesQuery(String(field), query)
    );

    if (matches) {
      const score = calculateScore(doc, query, ['name', 'type', 'dealName']);

      results.push({
        id: doc.id,
        type: 'contract',
        title: doc.name || 'Untitled Document',
        subtitle: `${doc.type} • ${new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        description: doc.dealName || 'No associated deal',
        metadata: {
          type: doc.type,
          size: doc.size,
          uploadedAt: doc.uploadedAt,
        },
        url: `/documents-vault`,
        score,
      });
    }
  }

  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Search notifications
 */
export function searchNotifications(notifications: Notification[], query: string): SearchResult[] {
  if (!query.trim()) return [];

  const results: SearchResult[] = [];

  for (const notification of notifications) {
    const searchFields = [
      notification.title,
      notification.message,
      notification.type,
      notification.category,
    ].filter(Boolean);

    const matches = searchFields.some(field => 
      matchesQuery(String(field), query)
    );

    if (matches) {
      const score = calculateScore(notification, query, ['title', 'message', 'type']);

      results.push({
        id: notification.id,
        type: 'notification',
        title: notification.title,
        subtitle: notification.category,
        description: notification.message,
        metadata: {
          type: notification.type,
          category: notification.category,
          read: notification.read,
          priority: notification.priority,
        },
        url: notification.link || '/notifications',
        score,
      });
    }
  }

  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

/**
 * Unified search across all data types
 */
export interface GlobalSearchOptions {
  deals?: BrandDeal[];
  documents?: any[];
  notifications?: Notification[];
  query: string;
  limit?: number;
}

export function globalSearch(options: GlobalSearchOptions): SearchResult[] {
  const { deals = [], documents = [], notifications = [], query, limit = 20 } = options;

  if (!query.trim()) return [];

  const allResults: SearchResult[] = [
    ...searchDeals(deals, query),
    ...searchPayments(deals, query),
    ...searchContracts(documents, query),
    ...searchNotifications(notifications, query),
  ];

  // Sort by relevance score and limit
  return allResults
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, limit);
}

/**
 * Get search suggestions based on query
 */
export function getSearchSuggestions(query: string, history: string[]): string[] {
  if (!query.trim()) return history.slice(0, 5);

  const normalizedQuery = query.toLowerCase();
  return history
    .filter(item => item.toLowerCase().includes(normalizedQuery))
    .slice(0, 5);
}

