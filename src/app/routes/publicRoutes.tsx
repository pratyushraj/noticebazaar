import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import LegacyCollabRedirect from "@/components/collab/LegacyCollabRedirect";
import LegacyCollabSuccessRedirect from "@/components/collab/LegacyCollabSuccessRedirect";
import LegacyCreatorProfileRedirect from "@/components/collab/LegacyCreatorProfileRedirect";
import { LazyRoute } from "./routeElements";
import ReservedUsernameGuard from "@/components/collab/ReservedUsernameGuard";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const BlogListing = lazy(() => import("@/pages/BlogListing"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const BrandLandingPage = lazy(() => import("@/pages/BrandLandingPage"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const About = lazy(() => import("@/pages/About"));
const Careers = lazy(() => import("@/pages/Careers"));
const PricingComparison = lazy(() => import("@/pages/PricingComparison"));
const FreeLegalCheck = lazy(() => import("@/pages/FreeLegalCheck"));
const FreeInfluencerContract = lazy(() => import("@/pages/FreeInfluencerContract"));
const CollaborationAgreementGenerator = lazy(() => import("@/pages/CollaborationAgreementGenerator"));
const BrandDirectory = lazy(() => import("@/pages/BrandDirectory"));
const DiscoverCreators = lazy(() => import("@/pages/DiscoverCreators"));
const RateCalculator = lazy(() => import("@/pages/RateCalculator"));
const CollabLinkLanding = lazy(() => import("@/pages/CollabLinkLanding"));

export const PublicRoutes = () => (
  <>
    <Route path="/" element={<LazyRoute><LandingPage /></LazyRoute>} />
    <Route path="/blog" element={<LazyRoute><BlogListing /></LazyRoute>} />
    <Route path="/blog/:slug" element={<LazyRoute><BlogPost /></LazyRoute>} />
    <Route path="/brands" element={<LazyRoute><BrandLandingPage /></LazyRoute>} />
    <Route path="/brand" element={<Navigate to="/brands" replace />} />
    <Route path="/login" element={<LazyRoute><Login /></LazyRoute>} />
    <Route path="/signup" element={<LazyRoute><Signup /></LazyRoute>} />
    <Route path="/reset-password" element={<LazyRoute><ResetPassword /></LazyRoute>} />
    <Route path="/forgot-password" element={<LazyRoute><ForgotPassword /></LazyRoute>} />
    {/* Reserve /404 so it doesn't get interpreted as a collab username and loop */}
    <Route path="/404" element={<LazyRoute><NotFound /></LazyRoute>} />
    <Route path="/privacy-policy" element={<LazyRoute><PrivacyPolicy /></LazyRoute>} />
    <Route path="/terms-of-service" element={<LazyRoute><TermsOfService /></LazyRoute>} />
    <Route path="/refund-policy" element={<LazyRoute><RefundPolicy /></LazyRoute>} />
    <Route path="/about" element={<LazyRoute><About /></LazyRoute>} />
    <Route path="/careers" element={<LazyRoute><Careers /></LazyRoute>} />
    <Route path="/pricing-comparison" element={<LazyRoute><PricingComparison /></LazyRoute>} />
    <Route path="/free-legal-check" element={<LazyRoute><FreeLegalCheck /></LazyRoute>} />
    <Route path="/free-influencer-contract" element={<LazyRoute><FreeInfluencerContract /></LazyRoute>} />
    <Route path="/collaboration-agreement-generator" element={<LazyRoute><CollaborationAgreementGenerator /></LazyRoute>} />
    <Route path="/brand-directory" element={<LazyRoute><BrandDirectory /></LazyRoute>} />
    <Route path="/discover" element={<LazyRoute><DiscoverCreators /></LazyRoute>} />
    <Route path="/rate-calculator" element={<LazyRoute><RateCalculator /></LazyRoute>} />
    <Route path="/creator/:username" element={<LegacyCreatorProfileRedirect />} />
    <Route path="/settings" element={<Navigate to="/creator-profile" replace />} />
    <Route path="/brand-opportunities" element={<Navigate to="/creator-dashboard" replace />} />
    <Route path="/:username" element={<ReservedUsernameGuard><LazyRoute><CollabLinkLanding /></LazyRoute></ReservedUsernameGuard>} />
    <Route path="/:username/success" element={<ReservedUsernameGuard><LazyRoute><CollabLinkLanding /></LazyRoute></ReservedUsernameGuard>} />
    <Route path="/collab/:username" element={<LegacyCollabRedirect />} />
    <Route path="/collab/:username/success" element={<LegacyCollabSuccessRedirect />} />
    <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
  </>
);
