import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";
import BrandDealDetailPage from "@/pages/BrandDealDetailPage";

const BrandDashboard = lazy(() => import("@/pages/BrandDashboard"));
const BrandNewDealPage = lazy(() => import("@/pages/BrandNewDealPage"));
const BrandDiscoverPage = lazy(() => import("@/pages/BrandDiscoverPage"));
const BrandSettings = lazy(() => import("@/pages/BrandSettings"));

export const BrandRoutes = () => (
  <>
    <Route path="/brand-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandDashboard /></ProtectedLayout></LazyRoute>} />
    <Route path="/brand-deal/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandDealDetailPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/brand-new-deal" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandNewDealPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/brand-discover" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandDiscoverPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/brand-settings" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandSettings /></ProtectedLayout></LazyRoute>} />
    <Route path="/upgrade" element={<Navigate to="/brand-dashboard" replace />} />
    <Route path="/messages" element={<Navigate to="/brand-dashboard" replace />} />
    <Route path="/messages/:conversationId" element={<Navigate to="/brand-dashboard" replace />} />
    <Route path="/contract-upload" element={<Navigate to="/brand-dashboard" replace />} />
  </>
);
