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
const RateCalculatorDynamic = lazy(() => import("@/pages/RateCalculatorDynamic"));
const CollabLinkLanding = lazy(() => import("@/pages/CollabLinkLanding"));
const LlmCreatorDirectory = lazy(() => import("@/pages/LlmCreatorDirectory"));

const WelcomeOnboarding = lazy(() => import("@/pages/WelcomeOnboarding"));
const InstaMockup = lazy(() => import("@/pages/InstaMockup"));
const BarterCollabPage = lazy(() => import("@/pages/BarterCollabPage"));
const KiroFoodsPitch = lazy(() => import("@/pages/pitch/KiroFoodsPitch"));

export const PublicRoutes = () => (
  <>
    <Route path="/" element={<LazyRoute><LandingPage /></LazyRoute>} />
    <Route path="/pitch/kiro-foods" element={<LazyRoute><KiroFoodsPitch /></LazyRoute>} />
    <Route path="/insta-mockup" element={<LazyRoute><InstaMockup /></LazyRoute>} />
    <Route path="/welcome" element={<LazyRoute><WelcomeOnboarding /></LazyRoute>} />
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
    <Route path="/discover/:category" element={<LazyRoute><DiscoverCreators /></LazyRoute>} />
    <Route path="/creators-list" element={<LazyRoute><LlmCreatorDirectory /></LazyRoute>} />
    <Route path="/rate-calculator" element={<LazyRoute><RateCalculator /></LazyRoute>} />
    <Route path="/calculator/:platform/:niche" element={<LazyRoute><RateCalculatorDynamic /></LazyRoute>} />
    <Route path="/creator/:username" element={<LegacyCreatorProfileRedirect />} />
    <Route path="/settings" element={<Navigate to="/creator-profile" replace />} />
    <Route path="/brand-opportunities" element={<Navigate to="/creator-dashboard" replace />} />
    {/* Barter SEO Pages */}
    <Route path="/barter-collab" element={<LazyRoute><BarterCollabPage /></LazyRoute>} />
    <Route path="/barter" element={<Navigate to="/barter-collab" replace />} />
    <Route path="/product-exchange" element={<Navigate to="/barter-collab" replace />} />
    <Route path="/influencer-gifting" element={<Navigate to="/barter-collab" replace />} />
    <Route path="/:username" element={<ReservedUsernameGuard><LazyRoute><CollabLinkLanding /></LazyRoute></ReservedUsernameGuard>} />
    <Route path="/:username/success" element={<ReservedUsernameGuard><LazyRoute><CollabLinkLanding /></LazyRoute></ReservedUsernameGuard>} />
    <Route path="/collab/:username" element={<LegacyCollabRedirect />} />
    <Route path="/collab/:username/success" element={<LegacyCollabSuccessRedirect />} />
    <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
  </>
);
