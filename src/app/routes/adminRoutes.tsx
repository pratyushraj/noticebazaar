import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";

const AdvisorDashboard = lazy(() => import("@/pages/AdvisorDashboard"));
const AdminClients = lazy(() => import("@/pages/AdminClients"));
const AdminCases = lazy(() => import("@/pages/AdminCases"));
const AdminDocuments = lazy(() => import("@/pages/AdminDocuments"));
const AdminConsultations = lazy(() => import("@/pages/AdminConsultations"));
const AdminSubscriptions = lazy(() => import("@/pages/AdminSubscriptions"));
const AdminActivityLog = lazy(() => import("@/pages/AdminActivityLog"));
const AdminProfile = lazy(() => import("@/pages/AdminProfile"));
const AdminInfluencers = lazy(() => import("@/pages/AdminInfluencers"));
const AdminDiscovery = lazy(() => import("@/pages/AdminDiscovery"));
const AdminPayouts = lazy(() => import("@/pages/AdminPayouts"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));

export const AdminRoutes = () => (
  <>
    <Route
      path="/admin"
      element={
        <LazyRoute>
          <ProtectedLayout allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/admin-dashboard"
      element={
        <LazyRoute>
          <ProtectedLayout allowedRoles={["admin"]}>
            <AdvisorDashboard />
          </ProtectedLayout>
        </LazyRoute>
      }
    />
    <Route path="/admin-clients" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminClients /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-cases" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminCases /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-documents" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminDocuments /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-consultations" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminConsultations /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-subscriptions" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminSubscriptions /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-activity-log" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminActivityLog /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-profile" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminProfile /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-influencers" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminInfluencers /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-discovery" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminDiscovery /></ProtectedLayout></LazyRoute>} />
    <Route path="/admin-payouts" element={<LazyRoute><ProtectedLayout allowedRoles={["admin"]}><AdminPayouts /></ProtectedLayout></LazyRoute>} />
  </>
);

