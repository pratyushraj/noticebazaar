import { lazy } from "react";
import { Route } from "react-router-dom";
import LegacyCollabRedirect from "@/components/collab/LegacyCollabRedirect";
import LegacyCollabSuccessRedirect from "@/components/collab/LegacyCollabSuccessRedirect";
import LegacyCreatorProfileRedirect from "@/components/collab/LegacyCreatorProfileRedirect";
import { LazyRoute } from "./routeElements";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const CollabLinkLanding = lazy(() => import("@/pages/CollabLinkLanding"));

export const PublicRoutes = () => (
  <>
    <Route path="/" element={<LazyRoute><LandingPage /></LazyRoute>} />
    <Route path="/login" element={<LazyRoute><Login /></LazyRoute>} />
    <Route path="/signup" element={<LazyRoute><Signup /></LazyRoute>} />
    <Route path="/reset-password" element={<LazyRoute><ResetPassword /></LazyRoute>} />
    <Route path="/privacy-policy" element={<LazyRoute><PrivacyPolicy /></LazyRoute>} />
    <Route path="/terms-of-service" element={<LazyRoute><TermsOfService /></LazyRoute>} />
    <Route path="/creator/:username" element={<LegacyCreatorProfileRedirect />} />
    <Route path="/:username" element={<LazyRoute><CollabLinkLanding /></LazyRoute>} />
    <Route path="/:username/success" element={<LazyRoute><CollabLinkLanding /></LazyRoute>} />
    <Route path="/collab/:username" element={<LegacyCollabRedirect />} />
    <Route path="/collab/:username/success" element={<LegacyCollabSuccessRedirect />} />
    <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
  </>
);
