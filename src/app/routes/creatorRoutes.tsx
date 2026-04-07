import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";
import PaymentDetailPage from "@/pages/PaymentDetailPage";
import DealDetailPage from "@/pages/DealDetailPage";

const CreatorDashboard = lazy(() => import("@/pages/CreatorDashboard"));
const CollabRequestBriefPage = lazy(() => import("@/pages/CollabRequestBriefPage"));
const CreatorProfile = lazy(() => import("@/pages/CreatorProfile"));
const DealDeliveryDetailsPage = lazy(() => import("@/pages/DealDeliveryDetailsPage"));
const CreatorOnboarding = lazy(() => import("@/pages/CreatorOnboarding"));

export const CreatorRoutes = () => (
  <>
    <Route path="/creator-onboarding" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorOnboarding /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["creator", "client"]}><CreatorDashboard /></ProtectedLayout></LazyRoute>} />
    <Route path="/collab-requests" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/collab-requests/:requestId/brief" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CollabRequestBriefPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/creator-profile" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorProfile /></ProtectedLayout></LazyRoute>} />
    <Route path="/deal-delivery-details/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><DealDeliveryDetailsPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/payment/:dealId" element={<ProtectedLayout allowedRoles={["creator"]}><PaymentDetailPage /></ProtectedLayout>} />
    <Route path="/deal/:dealId" element={<ProtectedLayout allowedRoles={["creator"]}><DealDetailPage /></ProtectedLayout>} />
    <Route path="/creator-contracts" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/creator-contracts/:dealId" element={<Navigate to="/deal/:dealId" replace />} />
    <Route path="/creator-contracts/:dealId/delivery-details" element={<Navigate to="/deal-delivery-details/:dealId" replace />} />
    <Route path="/brand-deal-console" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/notifications" element={<Navigate to="/creator-dashboard" replace />} />
  </>
);
