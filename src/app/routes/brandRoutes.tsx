import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";

const BrandDashboard = lazy(() => import("@/pages/BrandDashboard"));
const BrandSettings = lazy(() => import("@/pages/BrandSettings"));
const UpgradePage = lazy(() => import("@/pages/UpgradePage"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const ContractUploadFlow = lazy(() => import("@/pages/ContractUploadFlow"));

export const BrandRoutes = () => (
  <>
    <Route path="/brand-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandDashboard /></ProtectedLayout></LazyRoute>} />
    <Route path="/brand-settings" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandSettings /></ProtectedLayout></LazyRoute>} />
    <Route path="/upgrade" element={<LazyRoute><ProtectedLayout><UpgradePage /></ProtectedLayout></LazyRoute>} />
    <Route path="/messages" element={<LazyRoute><ProtectedLayout><MessagesPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/messages/:conversationId" element={<LazyRoute><ProtectedLayout><MessagesPage /></ProtectedLayout></LazyRoute>} />
    <Route path="/contract-upload" element={<LazyRoute><ProtectedLayout><ContractUploadFlow /></ProtectedLayout></LazyRoute>} />
  </>
);
