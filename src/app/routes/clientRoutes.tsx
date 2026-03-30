import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";

const ClientProfile = lazy(() => import("@/pages/ClientProfile"));
const ClientSubscription = lazy(() => import("@/pages/ClientSubscription"));
const ClientCases = lazy(() => import("@/pages/ClientCases"));
const ClientDocuments = lazy(() => import("@/pages/ClientDocuments"));
const ClientConsultations = lazy(() => import("@/pages/ClientConsultations"));
const ClientActivityLog = lazy(() => import("@/pages/ClientActivityLog"));

export const ClientRoutes = () => (
  <>
    <Route path="/client-dashboard" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/client-profile" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientProfile /></ProtectedLayout></LazyRoute>} />
    <Route path="/client-subscription" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientSubscription /></ProtectedLayout></LazyRoute>} />
    <Route path="/client-cases" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientCases /></ProtectedLayout></LazyRoute>} />
    <Route path="/client-documents" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientDocuments /></ProtectedLayout></LazyRoute>} />
    <Route path="/client-consultations" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientConsultations /></ProtectedLayout></LazyRoute>} />
    <Route path="/client-activity-log" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientActivityLog /></ProtectedLayout></LazyRoute>} />
  </>
);
