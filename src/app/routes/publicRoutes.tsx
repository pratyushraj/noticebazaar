import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import LegacyCollabRedirect from "@/components/collab/LegacyCollabRedirect";
import LegacyCollabSuccessRedirect from "@/components/collab/LegacyCollabSuccessRedirect";
import LegacyCreatorProfileRedirect from "@/components/collab/LegacyCreatorProfileRedirect";
import { LazyRoute } from "./routeElements";
import { ContractReadyRedirect } from "./routeHelpers";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const MarketingHome = lazy(() => import("@/pages/MarketingHome"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const About = lazy(() => import("@/pages/About"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPostDetail = lazy(() => import("@/pages/BlogPostDetail"));
const Careers = lazy(() => import("@/pages/Careers"));
const CollaborationAgreementGenerator = lazy(() => import("@/pages/CollaborationAgreementGenerator"));
const PricingComparison = lazy(() => import("@/pages/PricingComparison"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const RefundPolicy = lazy(() => import("@/pages/RefundPolicy"));
const DeleteData = lazy(() => import("@/pages/DeleteData"));
const Sitemap = lazy(() => import("@/pages/Sitemap"));
const EssentialPlan = lazy(() => import("@/pages/EssentialPlan"));
const GrowthPlan = lazy(() => import("@/pages/GrowthPlan"));
const StrategicPlan = lazy(() => import("@/pages/StrategicPlan"));
const ThankYou = lazy(() => import("@/pages/ThankYou"));
const DashboardWhitePreview = lazy(() => import("@/pages/DashboardWhitePreview"));
const CreatorDashboardPreview = lazy(() => import("@/pages/CreatorDashboardPreview"));
const DashboardPreview = lazy(() => import("@/pages/DashboardPreview"));
const MobileDashboardDemo = lazy(() => import("@/pages/MobileDashboardDemo"));
const BrandDealConsoleDemo = lazy(() => import("@/pages/BrandDealConsoleDemo"));
const BrandDesktopDashboard = lazy(() => import("@/pages/BrandDesktopDashboard"));
const ReferralLanding = lazy(() => import("@/pages/ReferralLanding"));
const DiscoverCreators = lazy(() => import("@/pages/DiscoverCreators"));
const CreatorsDirectory = lazy(() => import("@/pages/CreatorsDirectory"));
const CollabAcceptPage = lazy(() => import("@/pages/CollabAcceptPage"));
const CollabActionPage = lazy(() => import("@/pages/CollabActionPage"));
const SeoDashboard = lazy(() => import("@/pages/seo-dashboard"));
const CollabLinkLanding = lazy(() => import("@/pages/CollabLinkLanding"));
const CollabLinkSuccess = lazy(() => import("@/pages/CollabLinkSuccess"));
const PreviewAmanParmar = lazy(() => import("@/pages/PreviewAmanParmar"));
const ContractReadyPage = lazy(() => import("@/pages/ContractReadyPage"));
const CreatorSignPage = lazy(() => import("@/pages/CreatorSignPage"));
const ShipPage = lazy(() => import("@/pages/ShipPage"));
const ProposalSent = lazy(() => import("@/pages/ProposalSent"));
const FeedbackPage = lazy(() => import("@/pages/FeedbackPage"));
const ContractAnalyzer = lazy(() => import("@/pages/ContractAnalyzer"));
const RateCalculator = lazy(() => import("@/pages/RateCalculator"));
const DynamicRateCalculator = lazy(() => import("@/pages/DynamicRateCalculator"));
const BrandDirectory = lazy(() => import("@/pages/BrandDirectory"));
const BrandDetails = lazy(() => import("@/pages/BrandDetails"));
const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"));

export const PublicRoutes = () => (
  <>
    <Route path="/" element={<LazyRoute><LandingPage /></LazyRoute>} />
    <Route path="/old-home" element={<LazyRoute><ProtectedRoute><MarketingHome /></ProtectedRoute></LazyRoute>} />

    <Route path="/login" element={<LazyRoute><Login /></LazyRoute>} />
    <Route path="/signup" element={<LazyRoute><Signup /></LazyRoute>} />
    <Route path="/reset-password" element={<LazyRoute><ResetPassword /></LazyRoute>} />

    <Route path="/about" element={<LazyRoute><About /></LazyRoute>} />
    <Route path="/blog" element={<LazyRoute><Blog /></LazyRoute>} />
    <Route path="/blog/:slug" element={<LazyRoute><BlogPostDetail /></LazyRoute>} />
    <Route path="/careers" element={<LazyRoute><Careers /></LazyRoute>} />

    <Route path="/collaboration-agreement-generator" element={<LazyRoute><CollaborationAgreementGenerator /></LazyRoute>} />
    <Route path="/pricing-comparison" element={<LazyRoute><PricingComparison /></LazyRoute>} />
    <Route path="/privacy-policy" element={<LazyRoute><PrivacyPolicy /></LazyRoute>} />
    <Route path="/terms-of-service" element={<LazyRoute><TermsOfService /></LazyRoute>} />
    <Route path="/refund-policy" element={<LazyRoute><RefundPolicy /></LazyRoute>} />
    <Route path="/delete-data" element={<LazyRoute><DeleteData /></LazyRoute>} />
    <Route path="/sitemap" element={<LazyRoute><Sitemap /></LazyRoute>} />

    <Route path="/plan/essential" element={<LazyRoute><EssentialPlan /></LazyRoute>} />
    <Route path="/plan/growth" element={<LazyRoute><GrowthPlan /></LazyRoute>} />
    <Route path="/plan/strategic" element={<LazyRoute><StrategicPlan /></LazyRoute>} />
    <Route path="/thank-you" element={<LazyRoute><ThankYou /></LazyRoute>} />

    <Route path="/dashboard-white-preview" element={<LazyRoute><DashboardWhitePreview /></LazyRoute>} />
    <Route path="/dashboard-preview" element={<LazyRoute><CreatorDashboardPreview /></LazyRoute>} />
    <Route path="/dashboard-components-preview" element={<LazyRoute><DashboardPreview /></LazyRoute>} />
    <Route path="/demo-dashboard" element={<LazyRoute><MobileDashboardDemo /></LazyRoute>} />
    <Route path="/brand-console-demo" element={<LazyRoute><BrandDealConsoleDemo /></LazyRoute>} />
    <Route path="/brand-desktop-demo" element={<LazyRoute><BrandDesktopDashboard /></LazyRoute>} />
    <Route path="/preview/aman-parmar" element={<LazyRoute><PreviewAmanParmar /></LazyRoute>} />

    <Route path="/p/:code" element={<LazyRoute><ReferralLanding /></LazyRoute>} />
    <Route path="/discover" element={<LazyRoute><DiscoverCreators /></LazyRoute>} />
    <Route path="/discover/:category" element={<LazyRoute><DiscoverCreators /></LazyRoute>} />
    <Route path="/creators" element={<LazyRoute><CreatorsDirectory /></LazyRoute>} />
    <Route path="/creators/:category" element={<LazyRoute><CreatorsDirectory /></LazyRoute>} />
    <Route path="/creator/:username" element={<LegacyCreatorProfileRedirect />} />

    <Route path="/collab/accept/:requestToken" element={<LazyRoute><CollabAcceptPage /></LazyRoute>} />
    <Route path="/collab/push-test" element={<Navigate to="/push-test" replace />} />
    <Route path="/collab-action" element={<LazyRoute><CollabActionPage /></LazyRoute>} />
    <Route path="/seo-dashboard" element={<LazyRoute><SeoDashboard /></LazyRoute>} />
    <Route path="/:username" element={<LazyRoute><CollabLinkLanding /></LazyRoute>} />
    <Route path="/:username/success" element={<LazyRoute><CollabLinkSuccess /></LazyRoute>} />
    <Route path="/collab/:username" element={<LegacyCollabRedirect />} />
    <Route path="/collab/:username/success" element={<LegacyCollabSuccessRedirect />} />

    <Route path="/contract-ready/:token" element={<LazyRoute><ContractReadyPage /></LazyRoute>} />
    <Route path="/creator-sign/:token" element={<LazyRoute><CreatorSignPage /></LazyRoute>} />
    <Route path="/ship/:token" element={<LazyRoute><ShipPage /></LazyRoute>} />
    <Route path="/proposal-sent/:token" element={<LazyRoute><ProposalSent /></LazyRoute>} />
    <Route path="/feedback/:token" element={<LazyRoute><FeedbackPage /></LazyRoute>} />
    <Route path="/brand-reply/:token" element={<ContractReadyRedirect />} />
    <Route path="/brand/response/:token" element={<ContractReadyRedirect />} />

    <Route path="/contract-analyzer" element={<LazyRoute><ContractAnalyzer /></LazyRoute>} />
    <Route path="/rate-calculator" element={<LazyRoute><RateCalculator /></LazyRoute>} />
    <Route path="/dynamic-rate-calculator" element={<LazyRoute><DynamicRateCalculator /></LazyRoute>} />
    <Route path="/brand-directory" element={<LazyRoute><BrandDirectory /></LazyRoute>} />
    <Route path="/brand/:brandId" element={<LazyRoute><BrandDetails /></LazyRoute>} />
    <Route path="/maintenance" element={<LazyRoute><MaintenancePage /></LazyRoute>} />
    <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
  </>
);
