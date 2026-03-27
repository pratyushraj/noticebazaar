/**
 * Deal Service
 * 
 * Handles all business logic related to brand deals including:
 * - CRUD operations
 * - Status transitions
 * - Payment tracking
 * - Progress management
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/types/supabase';
import { BrandDeal } from '@/types';
import {
  ServiceResult,
  QueryOptions,
  PaginatedResult,
  ok,
  fail,
  handleResult,
  handleListResult,
  mapSupabaseError,
} from './types';

// ============================================
// Types
// ============================================

export type DealStatus =
  | 'Draft'
  | 'Negotiation'
  | 'Sent'
  | 'CONTRACT_READY'
  | 'SIGNED_BY_BRAND'
  | 'SIGNED_BY_CREATOR'
  | 'Content Making'
  | 'Content Delivered'
  | 'Payment Pending'
  | 'Completed'
  | 'Cancelled';

export type DealStage =
  | 'details_submitted'
  | 'contract_ready'
  | 'brand_signed'
  | 'fully_executed'
  | 'live_deal'
  | 'needs_changes'
  | 'declined'
  | 'completed'
  | 'awaiting_product_shipment'
  | 'negotiation'
  | 'content_making'
  | 'content_delivered';

export interface CreateDealInput {
  creator_id: string;
  organization_id?: string;
  brand_name: string;
  brand_email?: string;
  brand_phone?: string;
  brand_address?: string;
  contact_person?: string;
  deal_amount: number;
  deliverables: string;
  platform?: string;
  due_date: string;
  payment_expected_date: string;
  status?: DealStatus;
  contract_file_url?: string;
  deal_type?: 'paid' | 'barter';
}

export interface UpdateDealInput {
  brand_name?: string;
  brand_email?: string;
  brand_phone?: string;
  brand_address?: string;
  contact_person?: string;
  deal_amount?: number;
  deliverables?: string;
  platform?: string;
  due_date?: string;
  payment_expected_date?: string;
  payment_received_date?: string;
  status?: DealStatus;
  contract_file_url?: string;
  invoice_file_url?: string;
  invoice_url?: string;
  invoice_number?: string;
  utr_number?: string;
  progress_percentage?: number;
}

export interface DealFilters {
  status?: DealStatus | 'All';
  platform?: string | 'All';
  hasPendingPayment?: boolean;
  overdue?: boolean;
}

export interface DealQueryOptions extends QueryOptions {
  filters?: DealFilters;
}

export interface DealStats {
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  totalRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  averageDealValue: number;
}

// ============================================
// Deal Service Interface
// ============================================

export interface IDealService {
  // CRUD Operations
  getById(dealId: string): Promise<ServiceResult<BrandDeal>>;
  getByCreator(creatorId: string, options?: DealQueryOptions): Promise<ServiceResult<BrandDeal[]>>;
  create(input: CreateDealInput): Promise<ServiceResult<BrandDeal>>;
  update(dealId: string, input: UpdateDealInput): Promise<ServiceResult<BrandDeal>>;
  delete(dealId: string): Promise<ServiceResult<void>>;

  // Status Management
  updateStatus(dealId: string, status: DealStatus): Promise<ServiceResult<BrandDeal>>;
  updateProgress(dealId: string, stage: DealStage): Promise<ServiceResult<BrandDeal>>;

  // Payment Tracking
  markPaymentReceived(dealId: string, utrNumber: string, date: string): Promise<ServiceResult<BrandDeal>>;
  getPendingPayments(creatorId: string): Promise<ServiceResult<BrandDeal[]>>;
  getOverduePayments(creatorId: string): Promise<ServiceResult<BrandDeal[]>>;

  // Analytics
  getStats(creatorId: string): Promise<ServiceResult<DealStats>>;

  // File Management
  uploadContract(dealId: string, file: File, creatorId: string): Promise<ServiceResult<string>>;
  uploadInvoice(dealId: string, file: File, creatorId: string): Promise<ServiceResult<string>>;
}

// ============================================
// Deal Service Implementation
// ============================================

export class DealService implements IDealService {
  private supabase;

  constructor(supabaseClient?: typeof supabase) {
    this.supabase = supabaseClient ?? supabase;
  }

  // ----------------------------------------
  // CRUD Operations
  // ----------------------------------------

  async getById(dealId: string): Promise<ServiceResult<BrandDeal>> {
    const { data, error } = await this.supabase
      .from('brand_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    return handleResult<BrandDeal>(data, error);
  }

  async getByCreator(
    creatorId: string,
    options?: DealQueryOptions
  ): Promise<ServiceResult<BrandDeal[]>> {
    const { filters, sortBy = 'created_at', sortOrder = 'desc', limit } = options || {};

    // Signed statuses that should be visible
    const signedStatuses = [
      'sent', 'CONTRACT_READY', 'contract_ready', 'signed',
      'SIGNED_BY_BRAND', 'SIGNED_BY_CREATOR', 'content_making',
      'Content Making', 'content_delivered', 'Content Delivered',
      'REVISION_REQUESTED', 'revision_requested', 'Revision Requested',
      'REVISION_DONE', 'revision_done', 'Revision Done',
      'CONTENT_APPROVED', 'content_approved', 'Content Approved',
      'PAYMENT_RELEASED', 'payment_released', 'Payment Released',
      'completed', 'COMPLETED', 'FULLY_EXECUTED', 'fully_executed',
      'Drafting', 'drafting', 'Awaiting Product Shipment',
    ];

    let query = this.supabase
      .from('brand_deals')
      .select('*')
      .eq('creator_id', creatorId)
      .in('status', signedStatuses)
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    if (filters?.status && filters.status !== 'All') {
      query = query.eq('status', filters.status);
    }

    if (filters?.platform && filters.platform !== 'All') {
      query = query.eq('platform', filters.platform);
    }

    if (filters?.hasPendingPayment) {
      query = query.is('payment_received_date', null);
    }

    if (filters?.overdue) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lt('payment_expected_date', today).is('payment_received_date', null);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    return handleListResult<BrandDeal>(data, error);
  }

  async create(input: CreateDealInput): Promise<ServiceResult<BrandDeal>> {
    const insertPayload: Database['public']['Tables']['brand_deals']['Insert'] = {
      creator_id: input.creator_id,
      brand_name: input.brand_name,
      deal_amount: input.deal_amount,
      deliverables: input.deliverables,
      due_date: input.due_date,
      payment_expected_date: input.payment_expected_date,
      status: input.status || 'Draft',
      brand_email: input.brand_email || null,
      brand_phone: input.brand_phone || null,
      brand_address: input.brand_address || null,
      contact_person: input.contact_person || null,
      platform: input.platform || null,
      contract_file_url: input.contract_file_url || null,
    };

    if (input.organization_id) {
      insertPayload.organization_id = input.organization_id;
    }

    const { data, error } = await this.supabase
      .from('brand_deals')
      .insert(insertPayload)
      .select()
      .single();

    return handleResult<BrandDeal>(data, error);
  }

  async update(dealId: string, input: UpdateDealInput): Promise<ServiceResult<BrandDeal>> {
    const updatePayload: Database['public']['Tables']['brand_deals']['Update'] = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    // Consistency: If payment received, force status to Completed
    if (input.payment_received_date) {
      updatePayload.status = 'Completed';
    }

    const { data, error } = await this.supabase
      .from('brand_deals')
      .update(updatePayload)
      .eq('id', dealId)
      .select()
      .single();

    return handleResult<BrandDeal>(data, error);
  }

  async delete(dealId: string): Promise<ServiceResult<void>> {
    const { error } = await this.supabase
      .from('brand_deals')
      .delete()
      .eq('id', dealId);

    if (error) {
      return { success: false, error: mapSupabaseError(error) };
    }
    return ok(undefined);
  }

  // ----------------------------------------
  // Status Management
  // ----------------------------------------

  async updateStatus(dealId: string, status: DealStatus): Promise<ServiceResult<BrandDeal>> {
    return this.update(dealId, { status });
  }

  async updateProgress(dealId: string, stage: DealStage): Promise<ServiceResult<BrandDeal>> {
    const stageToProgress: Record<DealStage, number> = {
      details_submitted: 20,
      contract_ready: 40,
      brand_signed: 60,
      fully_executed: 80,
      live_deal: 100,
      needs_changes: 40,
      declined: 0,
      completed: 100,
      awaiting_product_shipment: 50,
      negotiation: 30,
      content_making: 85,
      content_delivered: 95,
    };

    const stageToStatus: Record<DealStage, string> = {
      details_submitted: 'Draft',
      contract_ready: 'CONTRACT_READY',
      brand_signed: 'SIGNED_BY_BRAND',
      fully_executed: 'FULLY_EXECUTED',
      live_deal: 'Content Making',
      needs_changes: 'Draft',
      declined: 'Cancelled',
      completed: 'Completed',
      awaiting_product_shipment: 'Draft',
      negotiation: 'Negotiation',
      content_making: 'Content Making',
      content_delivered: 'Content Delivered',
    };

    return this.update(dealId, {
      progress_percentage: stageToProgress[stage],
      status: stageToStatus[stage] as DealStatus,
    });
  }

  // ----------------------------------------
  // Payment Tracking
  // ----------------------------------------

  async markPaymentReceived(
    dealId: string,
    utrNumber: string,
    date: string
  ): Promise<ServiceResult<BrandDeal>> {
    return this.update(dealId, {
      utr_number: utrNumber,
      payment_received_date: date,
      status: 'Completed',
    });
  }

  async getPendingPayments(creatorId: string): Promise<ServiceResult<BrandDeal[]>> {
    const { data, error } = await this.supabase
      .from('brand_deals')
      .select('*')
      .eq('creator_id', creatorId)
      .is('payment_received_date', null)
      .order('payment_expected_date', { ascending: true });

    return handleListResult<BrandDeal>(data, error);
  }

  async getOverduePayments(creatorId: string): Promise<ServiceResult<BrandDeal[]>> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase
      .from('brand_deals')
      .select('*')
      .eq('creator_id', creatorId)
      .lt('payment_expected_date', today)
      .is('payment_received_date', null)
      .order('payment_expected_date', { ascending: true });

    return handleListResult<BrandDeal>(data, error);
  }

  // ----------------------------------------
  // Analytics
  // ----------------------------------------

  async getStats(creatorId: string): Promise<ServiceResult<DealStats>> {
    const dealsResult = await this.getByCreator(creatorId);

    if (!dealsResult.success) {
      return { success: false, error: dealsResult.error };
    }

    const deals = dealsResult.data;

    const stats: DealStats = {
      totalDeals: deals.length,
      activeDeals: deals.filter(d => 
        !['Completed', 'Cancelled'].includes(d.status)
      ).length,
      completedDeals: deals.filter(d => d.status === 'Completed').length,
      totalRevenue: deals
        .filter(d => d.status === 'Completed')
        .reduce((sum, d) => sum + (d.deal_amount || 0), 0),
      pendingPayments: deals
        .filter(d => !d.payment_received_date)
        .reduce((sum, d) => sum + (d.deal_amount || 0), 0),
      overduePayments: deals
        .filter(d => {
          if (d.payment_received_date) return false;
          const expected = d.payment_expected_date;
          if (!expected) return false;
          return new Date(expected) < new Date();
        })
        .reduce((sum, d) => sum + (d.deal_amount || 0), 0),
      averageDealValue: 0,
    };

    stats.averageDealValue = stats.totalDeals > 0
      ? Math.round(deals.reduce((sum, d) => sum + (d.deal_amount || 0), 0) / stats.totalDeals)
      : 0;

    return ok(stats);
  }

  // ----------------------------------------
  // File Management
  // ----------------------------------------

  async uploadContract(
    dealId: string,
    file: File,
    creatorId: string
  ): Promise<ServiceResult<string>> {
    const fileExtension = file.name.split('.').pop();
    const sanitizedBrandName = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const filePath = `${creatorId}/contracts/${sanitizedBrandName}-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await this.supabase.storage
      .from('creator-assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      return fail('STORAGE_ERROR', `Failed to upload contract: ${uploadError.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from('creator-assets')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return fail('STORAGE_ERROR', 'Failed to get contract URL');
    }

    // Update deal with contract URL
    await this.update(dealId, { contract_file_url: urlData.publicUrl });

    return ok(urlData.publicUrl);
  }

  async uploadInvoice(
    dealId: string,
    file: File,
    creatorId: string
  ): Promise<ServiceResult<string>> {
    const fileExtension = file.name.split('.').pop();
    const sanitizedBrandName = file.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const filePath = `${creatorId}/invoices/${sanitizedBrandName}-${Date.now()}.${fileExtension}`;

    const { error: uploadError } = await this.supabase.storage
      .from('creator-assets')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      return fail('STORAGE_ERROR', `Failed to upload invoice: ${uploadError.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from('creator-assets')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return fail('STORAGE_ERROR', 'Failed to get invoice URL');
    }

    // Update deal with invoice URL
    await this.update(dealId, { invoice_file_url: urlData.publicUrl });

    return ok(urlData.publicUrl);
  }
}

// ============================================
// Singleton Instance
// ============================================

export const dealService = new DealService();
