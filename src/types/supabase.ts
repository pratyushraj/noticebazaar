// ... (other types)
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
// ... (rest of the file)