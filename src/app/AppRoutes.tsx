import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Route, Routes, useParams, useSearchParams } from "react-router-dom";
import { SessionContextProvider } from "@/contexts/SessionContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import ProtectedLayout from "@/components/ProtectedLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import LegacyCollabRedirect from "@/components/collab/LegacyCollabRedirect";
import LegacyCollabSuccessRedirect from "@/components/collab/LegacyCollabSuccessRedirect";
import LegacyCreatorProfileRedirect from "@/components/collab/LegacyCreatorProfileRedirect";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import AddToHomeScreen from "@/components/mobile/AddToHomeScreen";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const MarketingHome = lazy(() => import("@/pages/MarketingHome"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const CreatorDashboard = lazy(() => import("@/pages/CreatorDashboard"));
const CreatorCollab = lazy(() => import("@/pages/CreatorCollab"));
const CollabRequestCounterPage = lazy(() => import("@/pages/CollabRequestCounterPage"));
const CollabRequestBriefPage = lazy(() => import("@/pages/CollabRequestBriefPage"));
const CreatorAnalytics = lazy(() => import("@/pages/CreatorAnalytics"));
const NotificationCenter = lazy(() => import("@/pages/NotificationCenter"));
const ClientProfile = lazy(() => import("@/pages/ClientProfile"));
const ClientSubscription = lazy(() => import("@/pages/ClientSubscription"));
const ClientCases = lazy(() => import("@/pages/ClientCases"));
const ClientDocuments = lazy(() => import("@/pages/ClientDocuments"));
const ClientConsultations = lazy(() => import("@/pages/ClientConsultations"));
const ClientActivityLog = lazy(() => import("@/pages/ClientActivityLog"));
const CreatorProfile = lazy(() => import("@/pages/CreatorProfile"));
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
const CreatorContracts = lazy(() => import("@/pages/CreatorContracts"));
const DealDeliveryDetailsPage = lazy(() => import("@/pages/DealDeliveryDetailsPage"));
const CreateDealPage = lazy(() => import("@/pages/CreateDealPage"));
const CreatorPaymentsAndRecovery = lazy(() => import("@/pages/CreatorPaymentsAndRecovery"));
const DashboardWhitePreview = lazy(() => import("@/pages/DashboardWhitePreview"));
const CreatorOnboarding = lazy(() => import("@/pages/CreatorOnboarding"));
const CreatorDashboardPreview = lazy(() => import("@/pages/CreatorDashboardPreview"));
const DashboardPreview = lazy(() => import("@/pages/DashboardPreview"));
const MobileDashboardDemo = lazy(() => import("@/pages/MobileDashboardDemo"));
const BrandDealConsoleDemo = lazy(() => import("@/pages/BrandDealConsoleDemo"));
const BrandDesktopDashboard = lazy(() => import("@/pages/BrandDesktopDashboard"));
const BrandDirectory = lazy(() => import("@/pages/BrandDirectory"));
const BrandDetails = lazy(() => import("@/pages/BrandDetails"));
const BrandOpportunities = lazy(() => import("@/pages/BrandOpportunities"));
const ContractAnalyzer = lazy(() => import("@/pages/ContractAnalyzer"));
const RateCalculator = lazy(() => import("@/pages/RateCalculator"));
const DynamicRateCalculator = lazy(() => import("@/pages/DynamicRateCalculator"));
const ReferralLanding = lazy(() => import("@/pages/ReferralLanding"));
const InsightsPage = lazy(() => import("@/pages/InsightsPage"));
const ContractComparison = lazy(() => import("@/pages/ContractComparison"));
const MaintenancePage = lazy(() => import("@/pages/MaintenancePage"));
const SearchResults = lazy(() => import("@/pages/SearchResults"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const PaymentDetailPage = lazy(() => import("@/pages/PaymentDetailPage"));
const BrandDealDetailsPage = lazy(() => import("@/pages/BrandDealDetailsPage"));
const ContractReadyPage = lazy(() => import("@/pages/ContractReadyPage"));
const CreatorSignPage = lazy(() => import("@/pages/CreatorSignPage"));
const ShipPage = lazy(() => import("@/pages/ShipPage"));
const FeedbackPage = lazy(() => import("@/pages/FeedbackPage"));
const UpgradePage = lazy(() => import("@/pages/UpgradePage"));
const CollabLinkLanding = lazy(() => import("@/pages/CollabLinkLanding"));
const CollabLinkSuccess = lazy(() => import("@/pages/CollabLinkSuccess"));
const BrandDealConsole = lazy(() => import("@/pages/BrandDealConsole"));
const ProposalSent = lazy(() => import("@/pages/ProposalSent"));
const BrandDashboard = lazy(() => import("@/pages/BrandDashboard"));
const BrandSettings = lazy(() => import("@/pages/BrandSettings"));
const CollabAcceptPage = lazy(() => import("@/pages/CollabAcceptPage"));
const CollabActionPage = lazy(() => import("@/pages/CollabActionPage"));
const CreatorsDirectory = lazy(() => import("@/pages/CreatorsDirectory"));
const DiscoverCreators = lazy(() => import("@/pages/DiscoverCreators"));
const CreatorReputationDashboard = lazy(() => import("@/pages/CreatorReputationDashboard"));
const PreviewAmanParmar = lazy(() => import("@/pages/PreviewAmanParmar"));
const PushTestLab = lazy(() => import("@/pages/PushTestLab"));
const SeoDashboard = lazy(() => import("@/pages/seo-dashboard"));
const MessagesPage = lazy(() => import("@/pages/MessagesPage"));
const ContractUploadFlow = lazy(() => import("@/pages/ContractUploadFlow"));

const RouteFallback = () => (
  <div className="min-h-[45vh] flex items-center justify-center px-4">
    <div className="flex items-center gap-2 text-sm text-white/80">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      Loading page...
    </div>
  </div>
);

const LazyRoute = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary variant="inline">
    <Suspense fallback={<RouteFallback />}>{children}</Suspense>
  </ErrorBoundary>
);

const ContractReadyRedirect = () => {
  const { token } = useParams<{ token: string }>();
  return <Navigate to={`/contract-ready/${token}`} replace />;
};

const CreatorContractDashboardRoute = () => {
  const { dealId } = useParams<{ dealId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "collabs");
    next.set("subtab", "active");
    if (dealId) next.set("dealId", dealId);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [dealId, searchParams, setSearchParams]);

  return <CreatorDashboard />;
};

export default function AppRoutes() {
  return (
    <SessionContextProvider>
      <SidebarProvider>
        <Routes>
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

          <Route path="/client-dashboard" element={<Navigate to="/creator-dashboard" replace />} />
          <Route path="/client-profile" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientProfile /></ProtectedLayout></LazyRoute>} />
          <Route path="/client-subscription" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientSubscription /></ProtectedLayout></LazyRoute>} />
          <Route path="/client-cases" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientCases /></ProtectedLayout></LazyRoute>} />
          <Route path="/client-documents" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientDocuments /></ProtectedLayout></LazyRoute>} />
          <Route path="/client-consultations" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientConsultations /></ProtectedLayout></LazyRoute>} />
          <Route path="/client-activity-log" element={<LazyRoute><ProtectedLayout allowedRoles={["client"]}><ClientActivityLog /></ProtectedLayout></LazyRoute>} />

          <Route path="/creator-onboarding" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorOnboarding /></ProtectedLayout></LazyRoute>} />
          <Route path="/creator-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["creator", "client"]}><CreatorDashboard /></ProtectedLayout></LazyRoute>} />
          <Route path="/creator-collab" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorCollab /></ProtectedLayout></LazyRoute>} />
          <Route path="/collab-requests" element={<Navigate to="/creator-dashboard?tab=collabs&subtab=pending" replace />} />
          <Route path="/collab-requests/:requestId/brief" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CollabRequestBriefPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/collab-requests/:requestId/counter" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CollabRequestCounterPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/creator-profile" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorProfile /></ProtectedLayout></LazyRoute>} />
          <Route path="/push-test" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><PushTestLab /></ProtectedLayout></LazyRoute>} />
          <Route path="/creator-analytics" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorAnalytics /></ProtectedLayout></LazyRoute>} />
          <Route path="/creator-reputation" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorReputationDashboard /></ProtectedLayout></LazyRoute>} />
          <Route path="/notifications" element={<LazyRoute><ProtectedLayout allowedRoles={["client", "admin", "chartered_accountant", "creator"]}><NotificationCenter /></ProtectedLayout></LazyRoute>} />
          <Route path="/search" element={<LazyRoute><ProtectedLayout allowedRoles={["client", "admin", "chartered_accountant", "creator"]}><SearchResults /></ProtectedLayout></LazyRoute>} />
          <Route path="/calendar" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CalendarPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/creator-contracts" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorContracts /></ProtectedLayout></LazyRoute>} />
          <Route path="/creator-payments" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorPaymentsAndRecovery /></ProtectedLayout></LazyRoute>} />
          <Route path="/insights" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><InsightsPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/contract-comparison" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><ContractComparison /></ProtectedLayout></LazyRoute>} />
          <Route path="/deal-delivery-details/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><DealDeliveryDetailsPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/create-deal" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreateDealPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/payment/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><PaymentDetailPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/deal/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><BrandDealDetailsPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/deal/:dealId/brand-response" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><BrandDealDetailsPage /></ProtectedLayout></LazyRoute>} />

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
          <Route path="/brand-opportunities" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><BrandOpportunities /></ProtectedLayout></LazyRoute>} />
          <Route path="/brand-deal-console" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><BrandDealConsole /></ProtectedLayout></LazyRoute>} />
          <Route path="/brand-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandDashboard /></ProtectedLayout></LazyRoute>} />
          <Route path="/brand-settings" element={<LazyRoute><ProtectedLayout allowedRoles={["brand"]}><BrandSettings /></ProtectedLayout></LazyRoute>} />
          <Route path="/upgrade" element={<LazyRoute><ProtectedLayout><UpgradePage /></ProtectedLayout></LazyRoute>} />

          <Route path="/messages" element={<LazyRoute><ProtectedLayout><MessagesPage /></ProtectedLayout></LazyRoute>} />
          <Route path="/messages/:conversationId" element={<LazyRoute><ProtectedLayout><MessagesPage /></ProtectedLayout></LazyRoute>} />

          <Route path="/contract-upload" element={<LazyRoute><ProtectedLayout><ContractUploadFlow /></ProtectedLayout></LazyRoute>} />
          <Route path="/maintenance" element={<LazyRoute><MaintenancePage /></LazyRoute>} />
          <Route path="/creator-contract-dashboard/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={["creator"]}><CreatorContractDashboardRoute /></ProtectedLayout></LazyRoute>} />
          <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
        </Routes>
        <AddToHomeScreen />
      </SidebarProvider>
    </SessionContextProvider>
  );
}
