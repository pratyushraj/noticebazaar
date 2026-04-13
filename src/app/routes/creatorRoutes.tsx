import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";
import PaymentDetailPage from "@/pages/PaymentDetailPage";

const CreatorDashboard = lazy(() => import("@/pages/CreatorDashboard"));
const CollabRequestsPage = lazy(() => import("@/pages/CollabRequestsPage"));
const CollabRequestBriefPage = lazy(() => import("@/pages/CollabRequestBriefPage"));
const CreatorProfile = lazy(() => import("@/pages/CreatorProfile"));
const CreatorPaymentsAndRecovery = lazy(() => import("@/pages/CreatorPaymentsAndRecovery"));
const DealDeliveryDetailsPage = lazy(() => import("@/pages/DealDeliveryDetailsPage"));
const CreatorOnboarding = lazy(() => import("@/pages/CreatorOnboarding"));
const DealDetailPage = lazy(() => import("@/pages/DealDetailPage"));
const CreatorLinkReady = lazy(() => import("@/pages/CreatorLinkReady"));

export const CreatorRoutes = () => (
  <>
    <Route path="/creator-onboarding" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorOnboarding /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-link-ready" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorLinkReady /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["creator", "client"]}><CreatorDashboard /></ProtectedLayout></LazyRoute>} />
    <Route path="/collab-requests" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/collab-requests/:requestId/brief" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CollabRequestBriefPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-profile" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorProfile /></ProtectedLayout></LazyRoute>} />
    <Route path="/deal-delivery-details/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><DealDeliveryDetailsPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/payment/:dealId" element={<ProtectedLayout allowedRoles={["creator"]}><PaymentDetailPage /></ProtectedLayout>} />
    <Route path="/deal/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><DealDetailPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-contracts" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/creator-contracts/:dealId" element={<Navigate to="/deal/:dealId" replace />} />
    <Route path="/creator-contracts/:dealId/delivery-details" element={<Navigate to="/deal-delivery-details/:dealId" replace />} />
    <Route path="/creator-payments" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorPaymentsAndRecovery /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-collab" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CollabRequestsPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/brand-deal-console" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/notifications" element={<Navigate to="/creator-dashboard" replace />} />
  </>
);
