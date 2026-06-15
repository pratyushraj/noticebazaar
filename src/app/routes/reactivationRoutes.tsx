import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { LazyRoute } from './routeElements';

// ─── Lazy page imports ────────────────────────────────────────────────────────

const ReactivationLayout = lazy(() => import('@/pages/reactivation/ReactivationLayout'));
const ReactivationDashboard = lazy(() => import('@/pages/reactivation/ReactivationDashboard'));
const ReactivationReceptionist = lazy(() => import('@/pages/reactivation/ReactivationReceptionist'));
const ReactivationCustomers = lazy(() => import('@/pages/reactivation/ReactivationCustomers'));
const ReactivationSegments = lazy(() => import('@/pages/reactivation/ReactivationSegments'));
const ReactivationCampaigns = lazy(() => import('@/pages/reactivation/ReactivationCampaigns'));
const ReactivationAnalytics = lazy(() => import('@/pages/reactivation/ReactivationAnalytics'));
const ReactivationAutomations = lazy(() => import('@/pages/reactivation/ReactivationAutomations'));
const ReactivationReviews = lazy(() => import('@/pages/reactivation/ReactivationReviews'));
const ReactivationLogin = lazy(() => import('@/pages/reactivation/ReactivationLogin'));
const ReactivationScheduler = lazy(() => import('@/pages/reactivation/ReactivationScheduler'));
const ReactivationClinicSettings = lazy(() => import('@/pages/reactivation/ReactivationClinicSettings'));

// ─── Route definitions ────────────────────────────────────────────────────────

export const ReactivationRoutes = () => (
  <>
    <Route
      path="/reactivation/login"
      element={
        <LazyRoute>
          <ReactivationLogin />
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation"
      element={<Navigate to="/reactivation/customers" replace />}
    />

    <Route
      path="/reactivation/receptionist"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationReceptionist />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation/customers"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationCustomers />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation/scheduler"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationScheduler />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation/segments"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationSegments />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation/campaigns"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationCampaigns />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation/analytics"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationAnalytics />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation/automations"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationAutomations />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation/reviews"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationReviews />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
    <Route
      path="/reactivation/settings"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationClinicSettings />
          </ReactivationLayout>
        </LazyRoute>
      }
    />
  </>
);
