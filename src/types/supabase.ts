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
      cases: {
        Row: {
          client_id: string
          created_at: string | null
          deadline: string | null
          id: string
          status: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          deadline?: string | null
          id?: string
          status?: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
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
          created_at: string | null
          id: string
          is_system_category: boolean
          name: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_system_category?: boolean
          name: string
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_system_category?: boolean
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          preferred_date: string
          preferred_time: string
          status: string
          topic: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          preferred_date: string
          preferred_time: string
          status?: string
          topic?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
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
      documents: {
        Row: {
          case_id: string | null
          category_id: string | null
          client_id: string
          id: string
          is_favorite: boolean
          name: string
          url: string
          uploaded_at: string | null
          status: string
        }
        Insert: {
          case_id?: string | null
          category_id?: string | null
          client_id: string
          id?: string
          is_favorite?: boolean
          name: string
          url: string
          uploaded_at?: string | null
          status?: string
        }
        Update: {
          case_id?: string | null
          category_id?: string | null
          client_id?: string
          id?: string
          is_favorite?: boolean
          name?: string
          url?: string
          uploaded_at?: string | null
          status?: string
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
      messages: {
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
      profiles: {
        Row: {
          avatar_url: string | null
          first_name: string | null
          id: string
          last_name: string | null
          role: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string
          updated_at?: string | null
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
          created_at: string | null
          id: string
          next_billing_date: string
          plan_name: string
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          next_billing_date: string
          plan_name: string
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicTableNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicTableNameOrOptions]
    : never