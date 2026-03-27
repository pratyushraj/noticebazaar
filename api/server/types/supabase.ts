export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          client_id: string | null
          created_at: string | null
          description: string
          id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          description: string
          id?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
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
      audit_logs: {
        Row: {
          action_type: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          is_security_event: boolean | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          severity: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          is_security_event?: boolean | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          is_security_event?: boolean | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          severity?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      brand_deals: {
        Row: {
          analysis_report_id: string | null
          brand_address: string | null
          brand_email: string | null
          brand_name: string
          brand_phone: string | null
          brand_response_at: string | null
          brand_response_ip: string | null
          brand_response_message: string | null
          brand_response_status:
            | Database["public"]["Enums"]["brand_response_status"]
            | null
          campaign_name: string | null
          contact_person: string | null
          contract_file_url: string | null
          contract_html: string | null
          contract_id: string | null
          created_at: string | null
          created_via: string | null
          creator_id: string | null
          deal_amount: number
          deal_type: string | null
          deal_value: number | null
          deliverables: string | null
          due_date: string
          end_date: string | null
          expected_payment_date: string | null
          id: string
          invoice_file_url: string | null
          organization_id: string | null
          otp_attempts: number | null
          otp_expires_at: string | null
          otp_hash: string | null
          otp_last_sent_at: string | null
          otp_verified: boolean | null
          otp_verified_at: string | null
          payment_expected_date: string
          payment_received_date: string | null
          platform: string | null
          progress_percentage: number
          proof_of_payment_url: string | null
          start_date: string | null
          status: string
          updated_at: string
          utr_number: string | null
        }
        Insert: {
          analysis_report_id?: string | null
          brand_address?: string | null
          brand_email?: string | null
          brand_name: string
          brand_phone?: string | null
          brand_response_at?: string | null
          brand_response_ip?: string | null
          brand_response_message?: string | null
          brand_response_status?:
            | Database["public"]["Enums"]["brand_response_status"]
            | null
          campaign_name?: string | null
          contact_person?: string | null
          contract_file_url?: string | null
          contract_html?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_via?: string | null
          creator_id?: string | null
          deal_amount?: number
          deal_type?: string | null
          deal_value?: number | null
          deliverables?: string | null
          due_date?: string
          end_date?: string | null
          expected_payment_date?: string | null
          id?: string
          invoice_file_url?: string | null
          organization_id?: string | null
          otp_attempts?: number | null
          otp_expires_at?: string | null
          otp_hash?: string | null
          otp_last_sent_at?: string | null
          otp_verified?: boolean | null
          otp_verified_at?: string | null
          payment_expected_date?: string
          payment_received_date?: string | null
          platform?: string | null
          progress_percentage?: number
          proof_of_payment_url?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          utr_number?: string | null
        }
        Update: {
          analysis_report_id?: string | null
          brand_address?: string | null
          brand_email?: string | null
          brand_name?: string
          brand_phone?: string | null
          brand_response_at?: string | null
          brand_response_ip?: string | null
          brand_response_message?: string | null
          brand_response_status?:
            | Database["public"]["Enums"]["brand_response_status"]
            | null
          campaign_name?: string | null
          contact_person?: string | null
          contract_file_url?: string | null
          contract_html?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_via?: string | null
          creator_id?: string | null
          deal_amount?: number
          deal_type?: string | null
          deal_value?: number | null
          deliverables?: string | null
          due_date?: string
          end_date?: string | null
          expected_payment_date?: string | null
          id?: string
          invoice_file_url?: string | null
          organization_id?: string | null
          otp_attempts?: number | null
          otp_expires_at?: string | null
          otp_hash?: string | null
          otp_last_sent_at?: string | null
          otp_verified?: boolean | null
          otp_verified_at?: string | null
          payment_expected_date?: string
          payment_received_date?: string | null
          platform?: string | null
          progress_percentage?: number
          proof_of_payment_url?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
          utr_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_deals_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_deals_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_creator_id"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_interactions: {
        Row: {
          brand_id: string
          created_at: string
          creator_id: string
          id: string
          interaction_type: string
          metadata: Json | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          creator_id: string
          id?: string
          interaction_type: string
          metadata?: Json | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          creator_id?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_interactions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_interactions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_reply_audit_log: {
        Row: {
          action_source: string
          action_timestamp: string
          action_type: string
          brand_team_name: string | null
          deal_id: string
          decision_version: number | null
          id: string
          ip_address_hash: string | null
          ip_address_partial: string | null
          optional_comment: string | null
          reply_token_id: string
          response_status: string | null
          user_agent: string | null
        }
        Insert: {
          action_source?: string
          action_timestamp?: string
          action_type: string
          brand_team_name?: string | null
          deal_id: string
          decision_version?: number | null
          id?: string
          ip_address_hash?: string | null
          ip_address_partial?: string | null
          optional_comment?: string | null
          reply_token_id: string
          response_status?: string | null
          user_agent?: string | null
        }
        Update: {
          action_source?: string
          action_timestamp?: string
          action_type?: string
          brand_team_name?: string | null
          deal_id?: string
          decision_version?: number | null
          id?: string
          ip_address_hash?: string | null
          ip_address_partial?: string | null
          optional_comment?: string | null
          reply_token_id?: string
          response_status?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_reply_audit_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_reply_audit_log_reply_token_id_fkey"
            columns: ["reply_token_id"]
            isOneToOne: false
            referencedRelation: "brand_reply_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_reply_tokens: {
        Row: {
          created_at: string
          created_by: string
          deal_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          revoked_at: string | null
          revoked_by: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          deal_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deal_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          revoked_at?: string | null
          revoked_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_reply_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_reply_tokens_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_reply_tokens_revoked_by_fkey"
            columns: ["revoked_by"]
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
          application_count: number | null
          avg_payment_time_days: number | null
          bookmark_count: number | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          industry: string
          last_opportunity_date: string | null
          late_payment_reports: number | null
          logo_url: string | null
          name: string
          source: string | null
          status: string | null
          tier: string | null
          updated_at: string
          verified: boolean | null
          view_count: number | null
          website_url: string | null
        }
        Insert: {
          application_count?: number | null
          avg_payment_time_days?: number | null
          bookmark_count?: number | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          industry: string
          last_opportunity_date?: string | null
          late_payment_reports?: number | null
          logo_url?: string | null
          name: string
          source?: string | null
          status?: string | null
          tier?: string | null
          updated_at?: string
          verified?: boolean | null
          view_count?: number | null
          website_url?: string | null
        }
        Update: {
          application_count?: number | null
          avg_payment_time_days?: number | null
          bookmark_count?: number | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          industry?: string
          last_opportunity_date?: string | null
          late_payment_reports?: number | null
          logo_url?: string | null
          name?: string
          source?: string | null
          status?: string | null
          tier?: string | null
          updated_at?: string
          verified?: boolean | null
          view_count?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      cases: {
        Row: {
          client_id: string
          created_at: string | null
          deadline: string | null
          id: string
          organization_id: string | null
          status: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deadline?: string | null
          id?: string
          organization_id?: string | null
          status?: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          deadline?: string | null
          id?: string
          organization_id?: string | null
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
          {
            foreignKeyName: "cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          is_system_category: boolean | null
          name: string
          organization_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_system_category?: boolean | null
          name: string
          organization_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_system_category?: boolean | null
          name?: string
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_deadlines: {
        Row: {
          assigned_to: string | null
          compliance_type: Database["public"]["Enums"]["compliance_type"]
          created_at: string | null
          description: string
          due_date: string
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["compliance_status"]
        }
        Insert: {
          assigned_to?: string | null
          compliance_type: Database["public"]["Enums"]["compliance_type"]
          created_at?: string | null
          description: string
          due_date: string
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["compliance_status"]
        }
        Update: {
          assigned_to?: string | null
          compliance_type?: Database["public"]["Enums"]["compliance_type"]
          created_at?: string | null
          description?: string
          due_date?: string
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["compliance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "compliance_deadlines_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_deadlines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_scores: {
        Row: {
          id: string
          overall_score: number
          profile_id: string
          recommendations: string | null
          score_breakdown: Json | null
          score_date: string
        }
        Insert: {
          id?: string
          overall_score: number
          profile_id: string
          recommendations?: string | null
          score_breakdown?: Json | null
          score_date?: string
        }
        Update: {
          id?: string
          overall_score?: number
          profile_id?: string
          recommendations?: string | null
          score_breakdown?: Json | null
          score_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_scores_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          organization_id: string | null
          preferred_date: string
          preferred_time: string
          status: string
          topic: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          preferred_date: string
          preferred_time: string
          status?: string
          topic?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          preferred_date?: string
          preferred_time?: string
          status?: string
          topic?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      consumer_complaints: {
        Row: {
          amount: number | null
          category: string
          category_name: string | null
          company_name: string
          created_at: string
          creator_id: string
          description: string
          filed_at: string | null
          filing_reference: string | null
          id: string
          issue_type: string
          lawyer_review_notes: string | null
          lawyer_review_suggestions: string | null
          lawyer_reviewed_at: string | null
          lawyer_reviewed_by: string | null
          metadata: Json | null
          notice_draft_url: string | null
          notice_generated_at: string | null
          notice_generated_by: string | null
          proof_file_url: string | null
          status: string
          updated_at: string
          wants_lawyer_review: boolean | null
          wants_notice_draft: boolean | null
        }
        Insert: {
          amount?: number | null
          category: string
          category_name?: string | null
          company_name: string
          created_at?: string
          creator_id: string
          description: string
          filed_at?: string | null
          filing_reference?: string | null
          id?: string
          issue_type: string
          lawyer_review_notes?: string | null
          lawyer_review_suggestions?: string | null
          lawyer_reviewed_at?: string | null
          lawyer_reviewed_by?: string | null
          metadata?: Json | null
          notice_draft_url?: string | null
          notice_generated_at?: string | null
          notice_generated_by?: string | null
          proof_file_url?: string | null
          status?: string
          updated_at?: string
          wants_lawyer_review?: boolean | null
          wants_notice_draft?: boolean | null
        }
        Update: {
          amount?: number | null
          category?: string
          category_name?: string | null
          company_name?: string
          created_at?: string
          creator_id?: string
          description?: string
          filed_at?: string | null
          filing_reference?: string | null
          id?: string
          issue_type?: string
          lawyer_review_notes?: string | null
          lawyer_review_suggestions?: string | null
          lawyer_reviewed_at?: string | null
          lawyer_reviewed_by?: string | null
          metadata?: Json | null
          notice_draft_url?: string | null
          notice_generated_at?: string | null
          notice_generated_by?: string | null
          proof_file_url?: string | null
          status?: string
          updated_at?: string
          wants_lawyer_review?: boolean | null
          wants_notice_draft?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer_complaints_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_complaints_lawyer_reviewed_by_fkey"
            columns: ["lawyer_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumer_complaints_notice_generated_by_fkey"
            columns: ["notice_generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_ai_analysis: {
        Row: {
          analysis_date: string | null
          contract_id: string | null
          full_analysis: Json | null
          id: string
          missing_rights: string | null
          payment_risks: string | null
          profile_id: string
          risk_score: number | null
          risky_clauses: Json | null
          suggested_edits: string | null
          summary: string | null
        }
        Insert: {
          analysis_date?: string | null
          contract_id?: string | null
          full_analysis?: Json | null
          id?: string
          missing_rights?: string | null
          payment_risks?: string | null
          profile_id: string
          risk_score?: number | null
          risky_clauses?: Json | null
          suggested_edits?: string | null
          summary?: string | null
        }
        Update: {
          analysis_date?: string | null
          contract_id?: string | null
          full_analysis?: Json | null
          id?: string
          missing_rights?: string | null
          payment_risks?: string | null
          profile_id?: string
          risk_score?: number | null
          risky_clauses?: Json | null
          suggested_edits?: string | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_ai_analysis_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_ai_analysis_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_issues: {
        Row: {
          created_at: string
          creator_id: string
          deal_id: string
          description: string | null
          id: string
          impact: Json | null
          issue_type: string
          metadata: Json | null
          recommendation: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          deal_id: string
          description?: string | null
          id?: string
          impact?: Json | null
          issue_type: string
          metadata?: Json | null
          recommendation?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          deal_id?: string
          description?: string | null
          id?: string
          impact?: Json | null
          issue_type?: string
          metadata?: Json | null
          recommendation?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_issues_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_issues_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_issues_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_risk_tags: {
        Row: {
          contract_id: string
          created_at: string | null
          details: string | null
          id: string
          severity: string
          tag_name: string
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          details?: string | null
          id?: string
          severity: string
          tag_name: string
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          details?: string | null
          id?: string
          severity?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_risk_tags_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          contract_url: string | null
          created_at: string | null
          id: string
          last_scanned_at: string | null
          organization_id: string
          risk_score: number | null
          status: Database["public"]["Enums"]["contract_status"]
          title: string
        }
        Insert: {
          contract_url?: string | null
          created_at?: string | null
          id?: string
          last_scanned_at?: string | null
          organization_id: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
        }
        Update: {
          contract_url?: string | null
          created_at?: string | null
          id?: string
          last_scanned_at?: string | null
          organization_id?: string
          risk_score?: number | null
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_id: string | null
          risk_tag: string | null
          title: string | null
          type: string
          unread_count_advisor: number | null
          unread_count_creator: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          risk_tag?: string | null
          title?: string | null
          type?: string
          unread_count_advisor?: number | null
          unread_count_creator?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_id?: string | null
          risk_tag?: string | null
          title?: string | null
          type?: string
          unread_count_advisor?: number | null
          unread_count_creator?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      copyright_alerts: {
        Row: {
          alert_status: Database["public"]["Enums"]["alert_status"]
          created_at: string | null
          id: string
          infringing_content_type: string
          organization_id: string
          source_url: string
          takedown_notice_id: string | null
        }
        Insert: {
          alert_status?: Database["public"]["Enums"]["alert_status"]
          created_at?: string | null
          id?: string
          infringing_content_type: string
          organization_id: string
          source_url: string
          takedown_notice_id?: string | null
        }
        Update: {
          alert_status?: Database["public"]["Enums"]["alert_status"]
          created_at?: string | null
          id?: string
          infringing_content_type?: string
          organization_id?: string
          source_url?: string
          takedown_notice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copyright_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copyright_alerts_takedown_notice_id_fkey"
            columns: ["takedown_notice_id"]
            isOneToOne: false
            referencedRelation: "legal_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      copyright_matches: {
        Row: {
          detected_at: string | null
          id: string
          infringing_content_type: string | null
          match_url: string
          platform: string | null
          profile_id: string
          status: string | null
          takedown_notice_id: string | null
        }
        Insert: {
          detected_at?: string | null
          id?: string
          infringing_content_type?: string | null
          match_url: string
          platform?: string | null
          profile_id: string
          status?: string | null
          takedown_notice_id?: string | null
        }
        Update: {
          detected_at?: string | null
          id?: string
          infringing_content_type?: string | null
          match_url?: string
          platform?: string | null
          profile_id?: string
          status?: string | null
          takedown_notice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copyright_matches_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copyright_matches_takedown_notice_id_fkey"
            columns: ["takedown_notice_id"]
            isOneToOne: false
            referencedRelation: "legal_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          address: string | null
          business_name: string | null
          business_type: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gst_number: string | null
          id: string
          pan_number: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          pan_number?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          business_type?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          pan_number?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      deal_action_logs: {
        Row: {
          created_at: string
          deal_id: string
          event: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          event: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          event?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_action_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_details_submissions: {
        Row: {
          created_at: string
          creator_id: string
          deal_id: string | null
          form_data: Json
          id: string
          submitted_at: string
          token_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          deal_id?: string | null
          form_data: Json
          id?: string
          submitted_at?: string
          token_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          deal_id?: string | null
          form_data?: Json
          id?: string
          submitted_at?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_details_submissions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_details_submissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_details_submissions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "deal_details_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_details_tokens: {
        Row: {
          created_at: string
          creator_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_details_tokens_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          case_id: string | null
          category_id: string | null
          client_id: string
          id: string
          is_favorite: boolean | null
          name: string
          organization_id: string | null
          status: string | null
          uploaded_at: string | null
          url: string
        }
        Insert: {
          case_id?: string | null
          category_id?: string | null
          client_id: string
          id?: string
          is_favorite?: boolean | null
          name: string
          organization_id?: string | null
          status?: string | null
          uploaded_at?: string | null
          url: string
        }
        Update: {
          case_id?: string | null
          category_id?: string | null
          client_id?: string
          id?: string
          is_favorite?: boolean | null
          name?: string
          organization_id?: string | null
          status?: string | null
          uploaded_at?: string | null
          url?: string
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
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      dyad_runs: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          id: string
          input_data: Json | null
          organization_id: string
          output_data: Json | null
          profile_id: string | null
          status: string
          workflow_name: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          input_data?: Json | null
          organization_id: string
          output_data?: Json | null
          profile_id?: string | null
          status: string
          workflow_name: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          id?: string
          input_data?: Json | null
          organization_id?: string
          output_data?: Json | null
          profile_id?: string | null
          status?: string
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "dyad_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dyad_runs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_company_cache: {
        Row: {
          address: string
          created_at: string
          fetched_at: string
          gstin: string
          legal_name: string
          state: string
          status: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          fetched_at?: string
          gstin: string
          legal_name: string
          state: string
          status: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          fetched_at?: string
          gstin?: string
          legal_name?: string
          state?: string
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      issue_history: {
        Row: {
          action: string
          created_at: string
          id: string
          issue_id: string
          message: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          issue_id: string
          message?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          issue_id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_history_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assigned_team: string | null
          category: string
          created_at: string
          deal_id: string
          id: string
          message: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_team?: string | null
          category: string
          created_at?: string
          deal_id: string
          id?: string
          message: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_team?: string | null
          category?: string
          created_at?: string
          deal_id?: string
          id?: string
          message?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_requests: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          attachments: Json | null
          category: string
          created_at: string
          creator_id: string
          deal_id: string | null
          description: string
          id: string
          metadata: Json | null
          responded_at: string | null
          responded_by: string | null
          response_text: string | null
          status: string
          subject: string
          updated_at: string
          urgency: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          creator_id: string
          deal_id?: string | null
          description: string
          id?: string
          metadata?: Json | null
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string
          subject: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          creator_id?: string
          deal_id?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          responded_at?: string | null
          responded_by?: string | null
          response_text?: string | null
          status?: string
          subject?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "lawyer_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_submissions: {
        Row: {
          business_stage: string | null
          company_name: string | null
          company_type: string | null
          created_at: string | null
          debt_recovery_challenge: string | null
          email: string | null
          entity_type: string | null
          full_name: string | null
          has_client_vendor_agreements: string | null
          has_employee_agreements: string | null
          has_filed_annual_returns: string | null
          has_gst: string | null
          id: string
          lead_id: string
          ongoing_disputes: string | null
          phone: string | null
          preferred_contact_method: string | null
          status: string
          updated_at: string | null
          wants_consultation: string | null
        }
        Insert: {
          business_stage?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          debt_recovery_challenge?: string | null
          email?: string | null
          entity_type?: string | null
          full_name?: string | null
          has_client_vendor_agreements?: string | null
          has_employee_agreements?: string | null
          has_filed_annual_returns?: string | null
          has_gst?: string | null
          id?: string
          lead_id: string
          ongoing_disputes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          status?: string
          updated_at?: string | null
          wants_consultation?: string | null
        }
        Update: {
          business_stage?: string | null
          company_name?: string | null
          company_type?: string | null
          created_at?: string | null
          debt_recovery_challenge?: string | null
          email?: string | null
          entity_type?: string | null
          full_name?: string | null
          has_client_vendor_agreements?: string | null
          has_employee_agreements?: string | null
          has_filed_annual_returns?: string | null
          has_gst?: string | null
          id?: string
          lead_id?: string
          ongoing_disputes?: string | null
          phone?: string | null
          preferred_contact_method?: string | null
          status?: string
          updated_at?: string | null
          wants_consultation?: string | null
        }
        Relationships: []
      }
      legacy_messages: {
        Row: {
          case_id: string | null
          content: string
          id: string
          is_read: boolean
          receiver_id: string
          sender_id: string
          sent_at: string | null
        }
        Insert: {
          case_id?: string | null
          content: string
          id?: string
          is_read?: boolean
          receiver_id: string
          sender_id: string
          sent_at?: string | null
        }
        Update: {
          case_id?: string | null
          content?: string
          id?: string
          is_read?: boolean
          receiver_id?: string
          sender_id?: string
          sent_at?: string | null
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
      legal_notices: {
        Row: {
          created_at: string | null
          id: string
          notice_url: string
          organization_id: string
          recovery_case_id: string | null
          sent_date: string | null
          status: Database["public"]["Enums"]["notice_status"]
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notice_url: string
          organization_id: string
          recovery_case_id?: string | null
          sent_date?: string | null
          status?: Database["public"]["Enums"]["notice_status"]
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notice_url?: string
          organization_id?: string
          recovery_case_id?: string | null
          sent_date?: string | null
          status?: Database["public"]["Enums"]["notice_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_notices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_notices_recovery_case_id_fkey"
            columns: ["recovery_case_id"]
            isOneToOne: false
            referencedRelation: "recovery_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_review_requests: {
        Row: {
          created_at: string | null
          id: string
          lawyer_notes: string | null
          report_id: string
          requested_at: string | null
          reviewed_at: string | null
          status: string
          updated_at: string | null
          user_email: string | null
          user_id: string
          user_phone: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lawyer_notes?: string | null
          report_id: string
          requested_at?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id: string
          user_phone?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lawyer_notes?: string | null
          report_id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          status?: string
          updated_at?: string | null
          user_email?: string | null
          user_id?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_review_requests_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "protection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          id: string
          message_id: string
          scanned_at: string | null
          signed_download_url: string | null
          storage_path: string
          virus_scan_result: string | null
          virus_scan_status: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          id?: string
          message_id: string
          scanned_at?: string | null
          signed_download_url?: string | null
          storage_path: string
          virus_scan_result?: string | null
          virus_scan_status?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          id?: string
          message_id?: string
          scanned_at?: string | null
          signed_download_url?: string | null
          storage_path?: string
          virus_scan_result?: string | null
          virus_scan_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          message_id: string
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          message_id: string
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          message_id?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_audit_logs_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean | null
          is_read: boolean | null
          message_type: string
          sender_id: string
          sent_at: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          message_type?: string
          sender_id: string
          sent_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_read?: boolean | null
          message_type?: string
          sender_id?: string
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          do_not_disturb: boolean | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          preferences: Json | null
          push_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          do_not_disturb?: boolean | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          preferences?: Json | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          do_not_disturb?: boolean | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          preferences?: Json | null
          push_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          action_link: string | null
          category: string
          created_at: string | null
          data: Json | null
          expires_at: string | null
          icon: string | null
          id: string
          link: string | null
          message: string | null
          priority: string | null
          read: boolean | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_link?: string | null
          category: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          link?: string | null
          message?: string | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_link?: string | null
          category?: string
          created_at?: string | null
          data?: Json | null
          expires_at?: string | null
          icon?: string | null
          id?: string
          link?: string | null
          message?: string | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          application_count: number | null
          brand_id: string
          campaign_end_date: string | null
          campaign_start_date: string | null
          created_at: string
          deadline: string
          deliverable_type: string
          deliverables_description: string | null
          description: string | null
          filled_count: number | null
          id: string
          min_followers: number | null
          payout_max: number
          payout_min: number
          required_categories: string[] | null
          required_platforms: string[] | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_count?: number | null
          brand_id: string
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          created_at?: string
          deadline: string
          deliverable_type: string
          deliverables_description?: string | null
          description?: string | null
          filled_count?: number | null
          id?: string
          min_followers?: number | null
          payout_max: number
          payout_min: number
          required_categories?: string[] | null
          required_platforms?: string[] | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_count?: number | null
          brand_id?: string
          campaign_end_date?: string | null
          campaign_start_date?: string | null
          created_at?: string
          deadline?: string
          deliverable_type?: string
          deliverables_description?: string | null
          description?: string | null
          filled_count?: number | null
          id?: string
          min_followers?: number | null
          payout_max?: number
          payout_min?: number
          required_categories?: string[] | null
          required_platforms?: string[] | null
          status?: string | null
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
      organizations: {
        Row: {
          created_at: string | null
          gstin: string | null
          id: string
          industry: string | null
          name: string
          org_type: Database["public"]["Enums"]["org_type"]
          owner_id: string | null
        }
        Insert: {
          created_at?: string | null
          gstin?: string | null
          id?: string
          industry?: string | null
          name: string
          org_type: Database["public"]["Enums"]["org_type"]
          owner_id?: string | null
        }
        Update: {
          created_at?: string | null
          gstin?: string | null
          id?: string
          industry?: string | null
          name?: string
          org_type?: Database["public"]["Enums"]["org_type"]
          owner_id?: string | null
        }
        Relationships: []
      }
      partner_earnings: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          milestone_id: string | null
          net_amount: number
          referral_id: string | null
          source: string
          tds_amount: number
          tds_applied: boolean
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          milestone_id?: string | null
          net_amount: number
          referral_id?: string | null
          source: string
          tds_amount?: number
          tds_applied?: boolean
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          milestone_id?: string | null
          net_amount?: number
          referral_id?: string | null
          source?: string
          tds_amount?: number
          tds_applied?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_earnings_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "partner_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_earnings_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_earnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_milestones: {
        Row: {
          achieved_at: string
          id: string
          milestone_name: string
          reward_type: string
          reward_value: number
          user_id: string
        }
        Insert: {
          achieved_at?: string
          id?: string
          milestone_name: string
          reward_type: string
          reward_value: number
          user_id: string
        }
        Update: {
          achieved_at?: string
          id?: string
          milestone_name?: string
          reward_type?: string
          reward_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_rewards: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reward_type: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reward_type: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reward_type?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_stats: {
        Row: {
          active_referrals: number
          created_at: string | null
          current_month_earnings: number
          free_months_credit: number
          next_payout_date: string | null
          next_reward_referrals: number | null
          partner_rank: number | null
          tier: string
          total_clicks: number
          total_earnings: number
          total_paid_users: number
          total_referrals: number
          total_signups: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_referrals?: number
          created_at?: string | null
          current_month_earnings?: number
          free_months_credit?: number
          next_payout_date?: string | null
          next_reward_referrals?: number | null
          partner_rank?: number | null
          tier?: string
          total_clicks?: number
          total_earnings?: number
          total_paid_users?: number
          total_referrals?: number
          total_signups?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_referrals?: number
          created_at?: string | null
          current_month_earnings?: number
          free_months_credit?: number
          next_payout_date?: string | null
          next_reward_referrals?: number | null
          partner_rank?: number | null
          tier?: string
          total_clicks?: number
          total_earnings?: number
          total_paid_users?: number
          total_referrals?: number
          total_signups?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      passkeys: {
        Row: {
          counter: number | null
          created_at: string | null
          credential_id: string
          device_name: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          public_key: string
          user_id: string
        }
        Insert: {
          counter?: number | null
          created_at?: string | null
          credential_id: string
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          public_key: string
          user_id: string
        }
        Update: {
          counter?: number | null
          created_at?: string | null
          credential_id?: string
          device_name?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          public_key?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          brand_deal_id: string | null
          created_at: string | null
          due_date: string
          id: string
          invoice_number: string
          organization_id: string
          paid_on: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          brand_deal_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          invoice_number: string
          organization_id: string
          paid_on?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          brand_deal_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          organization_id?: string
          paid_on?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_brand_deal_id_fkey"
            columns: ["brand_deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      presence: {
        Row: {
          conversation_id: string
          id: string
          last_seen_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          last_seen_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          last_seen_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presence_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_entity_type: string | null
          business_name: string | null
          first_name: string | null
          free_months_credit: number | null
          gstin: string | null
          id: string
          is_trial: boolean | null
          last_name: string | null
          location: string | null
          onboarding_complete: boolean | null
          organization_id: string | null
          pan: string | null
          partner_tier: string | null
          phone: string | null
          role: string
          trial_expires_at: string | null
          trial_locked: boolean | null
          trial_started_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_entity_type?: string | null
          business_name?: string | null
          first_name?: string | null
          free_months_credit?: number | null
          gstin?: string | null
          id: string
          is_trial?: boolean | null
          last_name?: string | null
          location?: string | null
          onboarding_complete?: boolean | null
          organization_id?: string | null
          pan?: string | null
          partner_tier?: string | null
          phone?: string | null
          role?: string
          trial_expires_at?: string | null
          trial_locked?: boolean | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_entity_type?: string | null
          business_name?: string | null
          first_name?: string | null
          free_months_credit?: number | null
          gstin?: string | null
          id?: string
          is_trial?: boolean | null
          last_name?: string | null
          location?: string | null
          onboarding_complete?: boolean | null
          organization_id?: string | null
          pan?: string | null
          partner_tier?: string | null
          phone?: string | null
          role?: string
          trial_expires_at?: string | null
          trial_locked?: boolean | null
          trial_started_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_issues: {
        Row: {
          category: string
          clause_reference: string | null
          created_at: string | null
          description: string
          id: string
          recommendation: string | null
          report_id: string
          severity: string
          title: string
        }
        Insert: {
          category: string
          clause_reference?: string | null
          created_at?: string | null
          description: string
          id?: string
          recommendation?: string | null
          report_id: string
          severity: string
          title: string
        }
        Update: {
          category?: string
          clause_reference?: string | null
          created_at?: string | null
          description?: string
          id?: string
          recommendation?: string | null
          report_id?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "protection_issues_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "protection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      protection_reports: {
        Row: {
          analysis_json: Json
          analyzed_at: string | null
          brand_detected: Json | null
          contract_file_url: string
          created_at: string | null
          deal_id: string | null
          detected_contract_category: string | null
          document_type: string | null
          id: string
          negotiation_power_score: number | null
          overall_risk: string
          pdf_report_url: string | null
          protection_score: number
          risk_score: number | null
          safe_contract_url: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_json: Json
          analyzed_at?: string | null
          brand_detected?: Json | null
          contract_file_url: string
          created_at?: string | null
          deal_id?: string | null
          detected_contract_category?: string | null
          document_type?: string | null
          id?: string
          negotiation_power_score?: number | null
          overall_risk: string
          pdf_report_url?: string | null
          protection_score: number
          risk_score?: number | null
          safe_contract_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_json?: Json
          analyzed_at?: string | null
          brand_detected?: Json | null
          contract_file_url?: string
          created_at?: string | null
          deal_id?: string | null
          detected_contract_category?: string | null
          document_type?: string | null
          id?: string
          negotiation_power_score?: number | null
          overall_risk?: string
          pdf_report_url?: string | null
          protection_score?: number
          risk_score?: number | null
          safe_contract_url?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protection_reports_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "brand_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      recovery_cases: {
        Row: {
          amount_due: number
          created_at: string | null
          id: string
          last_action_date: string | null
          organization_id: string
          payment_id: string | null
          status: string
        }
        Insert: {
          amount_due: number
          created_at?: string | null
          id?: string
          last_action_date?: string | null
          organization_id: string
          payment_id?: string | null
          status: string
        }
        Update: {
          amount_due?: number
          created_at?: string | null
          id?: string
          last_action_date?: string | null
          organization_id?: string
          payment_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recovery_cases_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_events: {
        Row: {
          event_type: string
          id: string
          metadata: Json | null
          referral_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          event_type: string
          id?: string
          metadata?: Json | null
          referral_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          event_type?: string
          id?: string
          metadata?: Json | null
          referral_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_events_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_links: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          first_payment_at: string | null
          id: string
          referred_user_id: string
          referrer_id: string
          subscribed: boolean
        }
        Insert: {
          created_at?: string
          first_payment_at?: string | null
          id?: string
          referred_user_id: string
          referrer_id: string
          subscribed?: boolean
        }
        Update: {
          created_at?: string
          first_payment_at?: string | null
          id?: string
          referred_user_id?: string
          referrer_id?: string
          subscribed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_clauses: {
        Row: {
          created_at: string | null
          explanation: string | null
          id: string
          issue_id: string | null
          original_clause: string
          report_id: string
          safe_clause: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          issue_id?: string | null
          original_clause: string
          report_id: string
          safe_clause: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          explanation?: string | null
          id?: string
          issue_id?: string | null
          original_clause?: string
          report_id?: string
          safe_clause?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safe_clauses_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "protection_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safe_clauses_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "protection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reports: {
        Row: {
          id: string
          report_id: string
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          report_id: string
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          report_id?: string
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reports_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "protection_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          creator_id: string | null
          followers: number | null
          id: string
          linked_at: string | null
          platform: string
          username: string
        }
        Insert: {
          creator_id?: string | null
          followers?: number | null
          id?: string
          linked_at?: string | null
          platform: string
          username: string
        }
        Update: {
          creator_id?: string | null
          followers?: number | null
          id?: string
          linked_at?: string | null
          platform?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_accounts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          next_billing_date: string
          organization_id: string | null
          plan_name: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          next_billing_date: string
          organization_id?: string | null
          plan_name: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          next_billing_date?: string
          organization_id?: string | null
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
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filings: {
        Row: {
          created_at: string
          creator_id: string
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
          created_at?: string
          creator_id: string
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
          created_at?: string
          creator_id?: string
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
          created_at: string
          creator_id: string
          gst_rate: number
          id: string
          itr_slab: string
          tds_rate: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          gst_rate?: number
          id?: string
          itr_slab?: string
          tds_rate?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
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
      influencers: {
        Row: {
          id: string
          creator_name: string
          instagram_handle: string
          followers: number
          niche: string | null
          email: string | null
          website: string | null
          manager_email: string | null
          fit_score: number | null
          profile_link: string
          bio: string | null
          link_in_bio: string | null
          location: string | null
          last_post_date: string | null
          is_active: boolean | null
          is_india_based: boolean | null
          is_relevant_niche: boolean | null
          status: string
          source: string
          contacted_at: string | null
          last_dm_sent_at: string | null
          follow_up_due_at: string | null
          response_status: string | null
          last_checked_at: string
          created_at: string
          updated_at: string
          search_keywords: string[] | null
          classification_metadata: Json | null
          notes: string | null
          data_source_log: Json | null
          last_classification_at: string | null
        }
        Insert: {
          id?: string
          creator_name: string
          instagram_handle: string
          followers: number
          niche?: string | null
          email?: string | null
          website?: string | null
          manager_email?: string | null
          fit_score?: number | null
          profile_link: string
          bio?: string | null
          link_in_bio?: string | null
          location?: string | null
          last_post_date?: string | null
          is_active?: boolean | null
          is_india_based?: boolean | null
          is_relevant_niche?: boolean | null
          status?: string
          source?: string
          contacted_at?: string | null
          last_dm_sent_at?: string | null
          follow_up_due_at?: string | null
          response_status?: string | null
          last_checked_at?: string
          created_at?: string
          updated_at?: string
          search_keywords?: string[] | null
          classification_metadata?: Json | null
          notes?: string | null
          data_source_log?: Json | null
          last_classification_at?: string | null
        }
        Update: {
          id?: string
          creator_name?: string
          instagram_handle?: string
          followers?: number
          niche?: string | null
          email?: string | null
          website?: string | null
          manager_email?: string | null
          fit_score?: number | null
          profile_link?: string
          bio?: string | null
          link_in_bio?: string | null
          location?: string | null
          last_post_date?: string | null
          is_active?: boolean | null
          is_india_based?: boolean | null
          is_relevant_niche?: boolean | null
          status?: string
          source?: string
          contacted_at?: string | null
          last_dm_sent_at?: string | null
          follow_up_due_at?: string | null
          response_status?: string | null
          last_checked_at?: string
          created_at?: string
          updated_at?: string
          search_keywords?: string[] | null
          classification_metadata?: Json | null
          notes?: string | null
          data_source_log?: Json | null
          last_classification_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      performance_metrics: {
        Row: {
          rows_last_7_days: number | null
          rows_with_creator: number | null
          table_name: string | null
          total_rows: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_referral: { Args: { referral_id: string }; Returns: undefined }
      add_free_month_credit: {
        Args: { months_count?: number; p_user_id: string }
        Returns: undefined
      }
      apply_tds: {
        Args: { amount: number; user_yearly_total: number }
        Returns: {
          net_amount: number
          tds_amount: number
          tds_applied: boolean
        }[]
      }
      calculate_brand_popularity_score: {
        Args: { brand_uuid: string }
        Returns: number
      }
      calculate_commission: {
        Args: { p_user_id: string; subscription_amount: number }
        Returns: number
      }
      check_and_award_milestones: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_contract_issue: {
        Args: {
          deal_id_param: string
          description_param?: string
          impact_param?: Json
          issue_type_param: string
          recommendation_param?: string
          severity_param: string
          title_param: string
        }
        Returns: Json
      }
      create_conversation: {
        Args: {
          p_advisor_id: string
          p_creator_id: string
          p_risk_tag?: string
          p_title?: string
          p_type?: string
        }
        Returns: string
      }
      generate_referral_code: { Args: { user_uuid: string }; Returns: string }
      get_brand_avg_rating: { Args: { brand_uuid: string }; Returns: number }
      get_or_create_referral_link: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_recommended_brands: {
        Args: { creator_uuid: string; limit_count?: number }
        Returns: {
          brand_id: string
          brand_name: string
          industry: string
          match_reason: string
          popularity_score: number
        }[]
      }
      get_total_partners: { Args: never; Returns: number }
      get_trending_brands: {
        Args: { limit_count?: number }
        Returns: {
          application_count: number
          bookmark_count: number
          brand_id: string
          brand_name: string
          interaction_score: number
          view_count: number
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      get_user_conversations: {
        Args: never
        Returns: {
          created_at: string
          id: string
          last_message_at: string
          last_message_id: string
          risk_tag: string
          title: string
          type: string
          unread_count_advisor: number
          unread_count_creator: number
          updated_at: string
        }[]
      }
      get_user_emails: {
        Args: { user_ids: string[] }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      get_user_organization_id: { Args: never; Returns: string }
      initialize_partner_stats: {
        Args: { user_uuid: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_conversation_participant: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      is_org_member: { Args: { target_org_id: string }; Returns: boolean }
      issue_voucher_reward: {
        Args: {
          p_milestone_name: string
          p_reward_value: number
          p_user_id: string
        }
        Returns: string
      }
      log_audit_event: {
        Args: {
          action_type_param: string
          description_param?: string
          is_security_event_param?: boolean
          metadata_param?: Json
          resource_id_param?: string
          resource_type_param: string
          severity_param?: string
        }
        Returns: string
      }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      mark_stale_brands: { Args: never; Returns: number }
      record_referral_commission: {
        Args: { p_referral_id: string; p_subscription_amount: number }
        Returns: string
      }
      refresh_brand_opportunity_dates: { Args: never; Returns: undefined }
      refresh_partner_stats: { Args: { p_user_id: string }; Returns: undefined }
      refresh_partner_stats_complete: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      track_referral_event: {
        Args: {
          p_event_type: string
          p_referral_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_expired_opportunities: { Args: never; Returns: undefined }
      update_partner_ranks: { Args: never; Returns: undefined }
      update_partner_tier: { Args: { p_user_id: string }; Returns: string }
      update_payment_received: {
        Args: {
          deal_id_param: string
          payment_received_date_param: string
          utr_number_param?: string
        }
        Returns: Json
      }
      user_is_conversation_participant: {
        Args: { p_conversation_id: string }
        Returns: boolean
      }
    }
    Enums: {
      alert_status: "new" | "in_progress" | "takedown_sent" | "resolved"
      brand_response_status:
        | "pending"
        | "accepted"
        | "negotiating"
        | "rejected"
        | "accepted_verified"
      compliance_status:
        | "pending"
        | "filed"
        | "overdue"
        | "in_progress"
        | "verified"
      compliance_type:
        | "gst"
        | "roc"
        | "itr"
        | "tds"
        | "labour"
        | "ip_renewal"
        | "other"
      contract_status:
        | "drafting"
        | "review_pending"
        | "approved"
        | "rejected"
        | "expired"
      notice_status: "drafting" | "sent" | "acknowledged" | "closed"
      org_type: "sme" | "creator_account" | "agency"
      payment_status:
        | "pending"
        | "paid"
        | "overdue"
        | "recovery_initiated"
        | "settled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      alert_status: ["new", "in_progress", "takedown_sent", "resolved"],
      brand_response_status: [
        "pending",
        "accepted",
        "negotiating",
        "rejected",
        "accepted_verified",
      ],
      compliance_status: [
        "pending",
        "filed",
        "overdue",
        "in_progress",
        "verified",
      ],
      compliance_type: [
        "gst",
        "roc",
        "itr",
        "tds",
        "labour",
        "ip_renewal",
        "other",
      ],
      contract_status: [
        "drafting",
        "review_pending",
        "approved",
        "rejected",
        "expired",
      ],
      notice_status: ["drafting", "sent", "acknowledged", "closed"],
      org_type: ["sme", "creator_account", "agency"],
      payment_status: [
        "pending",
        "paid",
        "overdue",
        "recovery_initiated",
        "settled",
      ],
    },
  },
} as const
