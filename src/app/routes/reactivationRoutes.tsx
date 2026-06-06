import { lazy } from 'react';
import { Route } from 'react-router-dom';
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

// ─── Route definitions ────────────────────────────────────────────────────────

export const ReactivationRoutes = () => (
  <>
    <Route
      path="/reactivation"
      element={
        <LazyRoute>
          <ReactivationLayout>
            <ReactivationDashboard />
          </ReactivationLayout>
        </LazyRoute>
      }
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
  </>
);
