export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_log: {
        Row: {
          client_id: string | null
          created_at: string
          description: string
          id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description: string
          id?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_deals: {
        Row: {
          brand_email: string | null
          brand_name: string
          contact_person: string | null
          contract_file_url: string | null
          created_at: string
          creator_id: string
          deal_amount: number
          deliverables: string
          due_date: string
          id: string
          invoice_file_url: string | null
          organization_id: string
          payment_expected_date: string
          payment_received_date: string | null
          platform: string | null
          status: string
          updated_at: string | null
          utr_number: string | null
        }
        Insert: {
          brand_email?: string | null
          brand_name: string
          contact_person?: string | null
          contract_file_url?: string | null
          created_at?: string
          creator_id: string
          deal_amount: number
          deliverables: string
          due_date: string
          id?: string
          invoice_file_url?: string | null
          organization_id: string
          payment_expected_date: string
          payment_received_date?: string | null
          platform?: string | null
          status?: string
          updated_at?: string | null
          utr_number?: string | null
        }
        Update: {
          brand_email?: string | null
          brand_name?: string
          contact_person?: string | null
          contract_file_url?: string | null
          created_at?: string
          creator_id?: string
          deal_amount?: number
          deliverables?: string
          due_date?: string
          id?: string
          invoice_file_url?: string | null
          organization_id?: string
          payment_expected_date?: string
          payment_received_date?: string | null
          platform?: string | null
          status?: string
          updated_at?: string | null
          utr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_deals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_bookmarks: {
        Row: {
          brand_id: string
          created_at: string
          creator_id: string
          id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          creator_id: string
          id?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          creator_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_bookmarks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_bookmarks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_reviews: {
        Row: {
          brand_id: string
          communication_rating: number | null
          created_at: string
          creator_id: string
          id: string
          payment_rating: number | null
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          communication_rating?: number | null
          created_at?: string
          creator_id: string
          id?: string
          payment_rating?: number | null
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          communication_rating?: number | null
          created_at?: string
          creator_id?: string
          id?: string
          payment_rating?: number | null
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_reviews_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_reviews_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          avg_payment_time_days: number | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          industry: string
          late_payment_reports: number
          logo_url: string | null
          name: string
          source: string
          status: string
          updated_at: string
          verified: boolean
          website_url: string | null
        }
        Insert: {
          avg_payment_time_days?: number | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          industry: string
          late_payment_reports?: number
          logo_url?: string | null
          name: string
          source?: string
          status?: string
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Update: {
          avg_payment_time_days?: number | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          industry?: string
          late_payment_reports?: number
          logo_url?: string | null
          name?: string
          source?: string
          status?: string
          updated_at?: string
          verified?: boolean
          website_url?: string | null
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          application_count: number
          apply_url: string | null
          brand_id: string
          campaign_end_date: string | null
          campaign_start_date: string | null
          created_at: string
          deadline: string
          deliverable_type: string
          deliverables_description: string | null
          description: string | null
          filled_count: number
          id: string
          min_followers: number | null
          payout_max: number
          payout_min: number
          required_categories: string[] | null
          required_platforms: string[] | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          application_count?: number
          apply_url?: string | null
          brand_id: string
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          created_at?: string
          deadline: string
          deliverable_type: string
          deliverables_description?: string | null
          description?: string | null
          filled_count?: number
          id?: string
          min_followers?: number | null
          payout_max: number
          payout_min: number
          required_categories?: string[] | null
          required_platforms?: string[] | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          application_count?: number
          apply_url?: string | null
          brand_id?: string
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          created_at?: string
          deadline?: string
          deliverable_type?: string
          deliverables_description?: string | null
          description?: string | null
          filled_count?: number
          id?: string
          min_followers?: number | null
          payout_max?: number
          payout_min?: number
          required_categories?: string[] | null
          required_platforms?: string[] | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          client_id: string
          created_at: string
          deadline: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deadline?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deadline?: string | null
          id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_system_category: boolean
          name: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_system_category?: boolean
          name: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_system_category?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          preferred_date: string
          preferred_time: string
          status: string
          topic: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          preferred_date: string
          preferred_time: string
          status?: string
          topic?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          preferred_date?: string
          preferred_time?: string
          status?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_actions: {
        Row: {
          action_type: string
          created_at: string
          document_url: string | null
          id: string
          match_id: string
          status: string
        }
        Insert: {
          action_type: string
          created_at?: string
          document_url?: string | null
          id?: string
          match_id: string
          status?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          document_url?: string | null
          id?: string
          match_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "copyright_actions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "copyright_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_matches: {
        Row: {
          created_at: string
          id: string
          matched_url: string
          platform: string
          scan_id: string
          screenshot_url: string | null
          similarity_score: number
        }
        Insert: {
          created_at?: string
          id?: string
          matched_url: string
          platform: string
          scan_id: string
          screenshot_url?: string | null
          similarity_score: number
        }
        Update: {
          created_at?: string
          id?: string
          matched_url?: string
          platform?: string
          scan_id?: string
          screenshot_url?: string | null
          similarity_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "copyright_matches_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "copyright_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_scans: {
        Row: {
          content_id: string
          created_at: string
          id: string
          scan_status: string
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          scan_status?: string
        }
        Update: {
          content_id?: string
          created_at?: string
          id?: string
          scan_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "copyright_scans_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "original_content"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category_id: string | null
          client_id: string
          contract_type: string | null
          created_at: string
          id: string
          is_favorite: boolean
          name: string
          status: string
          uploaded_at: string
          url: string
          case_id: string | null
        }
        Insert: {
          category_id?: string | null
          client_id: string
          contract_type?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          name: string
          status?: string
          uploaded_at?: string
          url: string
          case_id?: string | null
        }
        Update: {
          category_id?: string | null
          client_id?: string
          contract_type?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          name?: string
          status?: string
          uploaded_at?: string
          url?: string
          case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_submissions: {
        Row: {
          business_stage: string | null
          business_type: string | null
          company_name: string | null
          company_type: string | null
          created_at: string
          debt_recovery_challenge: string | null
          email: string | null
          entity_type: string | null
          full_name: string | null
          has_client_vendor_agreements: string | null
          has_employee_agreements: string | null
          has_filed_annual_returns: string | null
          has_gst: string | null
          id: number
          lead_id: string
          ongoing_disputes: string | null
          phone: string | null
          preferred_contact_method: string | null
          status: string
          updated_at: string
          wants_consultation: string | null
        }
        Insert: {
          business_stage?: string | null
          business_type?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string
          debt_recovery_challenge?: string | null
          email?: string | null
          entity_type?: string | null
          full_name?: string | null
          has_client_vendor_agreements?: string | null
          has_employee_agreements?: string | null
          has_filed_annual_returns?: string | null
          has_gst?: string | null
          id?: number
          lead_id: string
          ongoing_disputes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          status?: string
          updated_at?: string
          wants_consultation?: string | null
        }
        Update: {
          business_stage?: string | null
          business_type?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string
          debt_recovery_challenge?: string | null
          email?: string | null
          entity_type?: string | null
          full_name?: string | null
          has_client_vendor_agreements?: string | null
          has_employee_agreements?: string | null
          has_filed_annual_returns?: string | null
          has_gst?: string | null
          id?: number
          lead_id?: string
          ongoing_disputes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          status?: string
          updated_at?: string
          wants_consultation?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          sent_at: string
          case_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          sent_at?: string
          case_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          sent_at?: string
          case_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      original_content: {
        Row: {
          created_at: string
          id: string
          original_url: string
          platform: string
          user_id: string
          watermark_text: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          original_url: string
          platform: string
          user_id: string
          watermark_text?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          original_url?: string
          platform?: string
          user_id?: string
          watermark_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "original_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_entity_type: string | null
          business_name: string | null
          facebook_profile_url: string | null
          first_name: string | null
          gstin: string | null
          id: string
          instagram_handle: string | null
          last_name: string | null
          onboarding_complete: boolean | null
          organization_id: string | null
          pan: string | null
          role: string
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string | null
          youtube_channel_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_entity_type?: string | null
          business_name?: string | null
          facebook_profile_url?: string | null
          first_name?: string | null
          gstin?: string | null
          id: string
          instagram_handle?: string | null
          last_name?: string | null
          onboarding_complete?: boolean | null
          organization_id?: string | null
          pan?: string | null
          role?: string
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          youtube_channel_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_entity_type?: string | null
          business_name?: string | null
          facebook_profile_url?: string | null
          first_name?: string | null
          gstin?: string | null
          id?: string
          instagram_handle?: string | null
          last_name?: string | null
          onboarding_complete?: boolean | null
          organization_id?: string | null
          pan?: string | null
          role?: string
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string | null
          youtube_channel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          client_id: string
          created_at: string
          id: string
          next_billing_date: string
          plan_name: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          next_billing_date: string
          plan_name: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          next_billing_date?: string
          plan_name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filings: {
        Row: {
          creator_id: string
          created_at: string
          details: string | null
          due_date: string
          filed_date: string | null
          filing_document_url: string | null
          filing_type: string
          id: string
          period_end: string
          period_start: string
          status: string
        }
        Insert: {
          creator_id: string
          created_at?: string
          details?: string | null
          due_date: string
          filed_date?: string | null
          filing_document_url?: string | null
          filing_type: string
          id?: string
          period_end: string
          period_start: string
          status?: string
        }
        Update: {
          creator_id?: string
          created_at?: string
          details?: string | null
          due_date?: string
          filed_date?: string | null
          filing_document_url?: string | null
          filing_type?: string
          id?: string
          period_end?: string
          period_start?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_filings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_settings: {
        Row: {
          creator_id: string
          created_at: string
          gst_rate: number
          id: string
          itr_slab: string
          tds_rate: number
          updated_at: string | null
        }
        Insert: {
          creator_id: string
          created_at?: string
          gst_rate?: number
          id?: string
          itr_slab?: string
          tds_rate?: number
          updated_at?: string | null
        }
        Update: {
          creator_id?: string
          created_at?: string
          gst_rate?: number
          id?: string
          itr_slab?: string
          tds_rate?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_settings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_issues: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          deal_id: string
          creator_id: string
          issue_type: 'exclusivity' | 'payment' | 'termination' | 'ip_rights' | 'timeline' | 'deliverables' | 'other'
          severity: 'high' | 'medium' | 'low'
          title: string
          description: string | null
          impact: Json | null
          recommendation: string | null
          status: 'open' | 'acknowledged' | 'resolved' | 'dismissed'
          resolved_at: string | null
          resolved_by: string | null
          resolution_notes: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          deal_id: string
          creator_id: string
          issue_type: 'exclusivity' | 'payment' | 'termination' | 'ip_rights' | 'timeline' | 'deliverables' | 'other'
          severity: 'high' | 'medium' | 'low'
          title: string
          description?: string | null
          impact?: Json | null
          recommendation?: string | null
          status?: 'open' | 'acknowledged' | 'resolved' | 'dismissed'
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          deal_id?: string
          creator_id?: string
          issue_type?: 'exclusivity' | 'payment' | 'termination' | 'ip_rights' | 'timeline' | 'deliverables' | 'other'
          severity?: 'high' | 'medium' | 'low'
          title?: string
          description?: string | null
          impact?: Json | null
          recommendation?: string | null
          status?: 'open' | 'acknowledged' | 'resolved' | 'dismissed'
          resolved_at?: string | null
          resolved_by?: string | null
          resolution_notes?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_issues_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_issues_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_requests: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          creator_id: string
          deal_id: string | null
          subject: string
          description: string
          urgency: 'low' | 'medium' | 'high' | 'urgent'
          category: 'contract_review' | 'payment_dispute' | 'termination' | 'ip_rights' | 'exclusivity' | 'other'
          status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
          assigned_to: string | null
          assigned_at: string | null
          response_text: string | null
          responded_at: string | null
          responded_by: string | null
          attachments: Json | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          creator_id: string
          deal_id?: string | null
          subject: string
          description: string
          urgency?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'contract_review' | 'payment_dispute' | 'termination' | 'ip_rights' | 'exclusivity' | 'other'
          status?: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
          assigned_to?: string | null
          assigned_at?: string | null
          response_text?: string | null
          responded_at?: string | null
          responded_by?: string | null
          attachments?: Json | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          creator_id?: string
          deal_id?: string | null
          subject?: string
          description?: string
          urgency?: 'low' | 'medium' | 'high' | 'urgent'
          category?: 'contract_review' | 'payment_dispute' | 'termination' | 'ip_rights' | 'exclusivity' | 'other'
          status?: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
          assigned_to?: string | null
          assigned_at?: string | null
          response_text?: string | null
          responded_at?: string | null
          responded_by?: string | null
          attachments?: Json | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_requests_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_requests_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions]['Row']
    : PublicTableNameOrOptions extends keyof Database['public']['Views']
      ? Database['public']['Views'][PublicTableNameOrOptions]['Row']
      : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions]['Insert']
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
    ? Database['public']['Tables'][PublicTableNameOrOptions]['Update']
    : never

export type Enums<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  Name extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Enums'][Name]
  : PublicTableNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicTableNameOrOptions]
    : never