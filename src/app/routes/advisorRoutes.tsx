import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import { LazyRoute } from "./routeElements";

const CADashboard = lazy(() => import("@/pages/CADashboard"));
const LawyerDashboard = lazy(() => import("@/pages/LawyerDashboard"));

export const AdvisorRoutes = () => (
  <>
    <Route path="/ca-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["chartered_accountant"]}><CADashboard /></ProtectedLayout></LazyRoute>} />
    <Route path="/lawyer-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["lawyer"]}><LawyerDashboard /></ProtectedLayout></LazyRoute>} />
  </>
);

