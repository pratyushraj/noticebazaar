import { ReactNode } from "react";
import { Navigate, useParams } from "react-router-dom";

// Prevent greedy `/:username` from capturing real routes.
// Keep this list tight and add to it when new top-level routes are introduced.
export const RESERVED_ROUTES = new Set<string>([
  "login",
  "signup",
  "reset-password",
  "forgot-password",
  "privacy-policy",
  "terms-of-service",
  "404",
  "messages",
  "creator-dashboard",
  "creator-onboarding",
  "creator-profile",
  "creator-link-ready",
  "creator-contracts",
  "creator-payments",
  "deal",
  "payment",
  "deal-delivery-details",
  "brand-dashboard",
  "brand-deal",
  "brand-new-deal",
  "brand-discover",
  "brand-settings",
  "admin-dashboard",
  "admin-clients",
  "admin-cases",
  "admin-documents",
  "admin-consultations",
  "admin-subscriptions",
  "admin-activity-log",
  "admin-profile",
  "admin-influencers",
  "admin-discovery",
  "ca-dashboard",
  "lawyer-dashboard",
  "collab",
  "about",
  "careers",
  "pricing-comparison",
  "free-legal-check",
  "free-influencer-contract",
  "contract-analyzer",
  "rate-calculator",
  "collaboration-agreement-generator",
  "brand-directory",
  "discover",
  "blog",
  "deck",
  "pitch-deck",
  "investors",
  "welcome",
  "insta-mockup",
  "brands",
  "brand",
  "calculator",
  "refund-policy",
  "creators-list",
  "barter-collab",
  "barter",
  "product-exchange",
  "influencer-gifting",
  "pitch",
]);

export default function ReservedUsernameGuard({ children }: { children: ReactNode }) {
  const params = useParams();
  const username = String(params.username || "").trim().toLowerCase();
  if (username && RESERVED_ROUTES.has(username)) {
    return <Navigate to="/404" replace />;
  }
  return <>{children}</>;
}

