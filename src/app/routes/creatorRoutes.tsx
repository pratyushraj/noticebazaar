import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";
import { CreatorContractDashboardRoute } from "./routeHelpers";

const CreatorDashboard = lazy(() => import("@/pages/CreatorDashboard"));
const CreatorCollab = lazy(() => import("@/pages/CreatorCollab"));
const CollabRequestCounterPage = lazy(() => import("@/pages/CollabRequestCounterPage"));
const CollabRequestBriefPage = lazy(() => import("@/pages/CollabRequestBriefPage"));
const CreatorAnalytics = lazy(() => import("@/pages/CreatorAnalytics"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));
const CreatorProfile = lazy(() => import("@/pages/CreatorProfile"));
const CreatorContracts = lazy(() => import("@/pages/CreatorContracts"));
const DealDeliveryDetailsPage = lazy(() => import("@/pages/DealDeliveryDetailsPage"));
const CreateDealPage = lazy(() => import("@/pages/CreateDealPage"));
const CreatorPaymentsAndRecovery = lazy(() => import("@/pages/CreatorPaymentsAndRecovery"));
const CreatorOnboarding = lazy(() => import("@/pages/CreatorOnboarding"));
const BrandOpportunities = lazy(() => import("@/pages/BrandOpportunities"));
const InsightsPage = lazy(() => import("@/pages/InsightsPage"));
const ContractComparison = lazy(() => import("@/pages/ContractComparison"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const PaymentDetailPage = lazy(() => import("@/pages/PaymentDetailPage"));
const BrandDealDetailsPage = lazy(() => import("@/pages/BrandDealDetailsPage"));
const BrandDealConsole = lazy(() => import("@/pages/BrandDealConsole"));
const CreatorReputationDashboard = lazy(() => import("@/pages/CreatorReputationDashboard"));
const PushTestLab = lazy(() => import("@/pages/PushTestLab"));

export const CreatorRoutes = () => (
  <>
    <Route path="/creator-onboarding" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorOnboarding /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["creator", "client"]}><CreatorDashboard /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-collab" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorCollab /></ProtectedLayout></LazyRoute>} />
    <Route path="/collab-requests" element={<Navigate to="/creator-dashboard?tab=collabs&subtab=pending" replace />} />
    <Route path="/collab-requests/:requestId/brief" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CollabRequestBriefPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/collab-requests/:requestId/counter" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CollabRequestCounterPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-profile" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorProfile /></ProtectedLayout></LazyRoute>} />
    <Route path="/push-test" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><PushTestLab /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-analytics" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorAnalytics /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-reputation" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorReputationDashboard /></ProtectedLayout></LazyRoute>} />
    <Route path="/notifications" element={<LazyRoute><ProtectedLayout allowedRoles={["client", "admin", "chartered_accountant", "creator"]}><NotificationCenter /></ProtectedLayout></LazyRoute>} />
    <Route path="/search" element={<LazyRoute><ProtectedLayout allowedRoles={["client", "admin", "chartered_accountant", "creator"]}><SearchResults /></ProtectedLayout></LazyRoute>} />
    <Route path="/calendar" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CalendarPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-contracts" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorContracts /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-payments" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorPaymentsAndRecovery /></ProtectedLayout></LazyRoute>} />
    <Route path="/insights" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><InsightsPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/contract-comparison" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><ContractComparison /></ProtectedLayout></LazyRoute>} />
    <Route path="/deal-delivery-details/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><DealDeliveryDetailsPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/create-deal" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreateDealPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/payment/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><PaymentDetailPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/deal/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><BrandDealDetailsPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/deal/:dealId/brand-response" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><BrandDealDetailsPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/brand-opportunities" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><BrandOpportunities /></ProtectedLayout></LazyRoute>} />
    <Route path="/brand-deal-console" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><BrandDealConsole /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-contract-dashboard/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorContractDashboardRoute /></ProtectedLayout></LazyRoute>} />
  </>
);
