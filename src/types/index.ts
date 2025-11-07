// src/types/index.ts
import { Tables } from './supabase';
import { LucideIcon } from 'lucide-react'; // Import LucideIcon for CreatorKpi

export type Profile = Tables<'profiles'> & {
  role: 'client' | 'admin' | 'chartered_accountant' | 'creator'; // Override role to be specific string literals, added 'chartered_accountant' and 'creator'
  business_name?: string | null; // New field
  gstin?: string | null; // New field
  business_entity_type?: string | null; // New field
  onboarding_complete?: boolean; // New field
};

export type Message = Tables<'messages'> & {
  sender?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  } | null;
  content: string | React.ReactNode; // Allow ReactNode for rich content display
};

export type Case = Tables<'cases'> & {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

export type Category = Tables<'categories'> & {
  // Add any joined profiles or specific category-related fields here if needed
};

export type Document = Tables<'documents'> & {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  cases?: { // Added for joining case details
    title: string;
  } | null;
  categories?: { // Added for joining category details
    name: string;
    is_system_category: boolean;
  } | null;
  is_favorite: boolean; // Added for document favorite feature
  status: 'Awaiting Review' | 'Approved' | 'Action Required' | 'Rejected'; // Added for document status
};

export type Activity = Tables<'activity_log'> & {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

export type Subscription = Tables<'subscriptions'> & {
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
  priceDisplay?: string; // Added for displaying custom price strings
  cases_limit?: number; // Placeholder for subscription usage stats
  documents_limit?: number; // Placeholder for subscription usage stats
  consultations_limit?: number; // Placeholder for subscription usage stats
};

export type Consultation = Tables<'consultations'> & {
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed'; // Override status to be specific string literals
  profiles?: {
    first_name: string;
    last_name: string;
  } | null;
};

// New type for Creator KPI cards
export interface CreatorKpi {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  color: string;
  changePercentage?: number; // Optional: e.g., 12 for +12%
  changeDirection?: 'up' | 'down' | 'neutral'; // Optional: for trend arrows
  statusDescription?: string; // Optional: e.g., "In Progress", "Requires Action", "Improving"
}