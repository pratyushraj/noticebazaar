import { useState, useEffect, lazy, Suspense, type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from "react-router-dom";
import { SplashScreen } from "@/components/mobile/SplashScreen";

// Lazy-loaded page components for better bundle splitting
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const MarketingHome = lazy(() => import("./pages/MarketingHome"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CADashboard = lazy(() => import("./pages/CADashboard"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const CreatorCollab = lazy(() => import("./pages/CreatorCollab"));
const CollabRequestsPage = lazy(() => import("./pages/CollabRequestsPage"));
const CollabRequestCounterPage = lazy(() => import("./pages/CollabRequestCounterPage"));
const CollabRequestBriefPage = lazy(() => import("./pages/CollabRequestBriefPage"));
const CreatorAnalytics = lazy(() => import("./pages/CreatorAnalytics"));
const NotificationCenter = lazy(() => import("./pages/NotificationCenter"));
const AdminDocuments = lazy(() => import("./pages/AdminDocuments"));
const AdminCases = lazy(() => import("./pages/AdminCases"));
const AdminClients = lazy(() => import("./pages/AdminClients"));
const AdminConsultations = lazy(() => import("./pages/AdminConsultations"));
const AdminSubscriptions = lazy(() => import("./pages/AdminSubscriptions"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const ClientSubscription = lazy(() => import("./pages/ClientSubscription"));
const ClientCases = lazy(() => import("./pages/ClientCases"));
const ClientDocuments = lazy(() => import("./pages/ClientDocuments"));
const ClientConsultations = lazy(() => import("./pages/ClientConsultations"));
const AdminActivityLog = lazy(() => import("./pages/AdminActivityLog"));
const ClientActivityLog = lazy(() => import("./pages/ClientActivityLog"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const AdminInfluencers = lazy(() => import("./pages/AdminInfluencers"));
const AdminDiscovery = lazy(() => import("./pages/AdminDiscovery"));
const CreatorProfile = lazy(() => import("./pages/CreatorProfile"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const Careers = lazy(() => import("./pages/Careers"));
const FreeInfluencerContract = lazy(() => import("./pages/FreeInfluencerContract"));
const CollaborationAgreementGenerator = lazy(() => import("./pages/CollaborationAgreementGenerator"));
const PricingComparison = lazy(() => import("./pages/PricingComparison"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const DeleteData = lazy(() => import("./pages/DeleteData"));
const Sitemap = lazy(() => import("./pages/Sitemap"));
const EssentialPlan = lazy(() => import("./pages/EssentialPlan"));
const GrowthPlan = lazy(() => import("./pages/GrowthPlan"));
const StrategicPlan = lazy(() => import("./pages/StrategicPlan"));
const FreeLegalCheck = lazy(() => import("./pages/FreeLegalCheck"));
const ThankYou = lazy(() => import("./pages/ThankYou"));

// Creator-specific pages
const CreatorContracts = lazy(() => import("./pages/CreatorContracts"));
const DealDeliveryDetailsPage = lazy(() => import("./pages/DealDeliveryDetailsPage"));
const CreateDealPage = lazy(() => import("./pages/CreateDealPage"));
const CreatorPaymentsAndRecovery = lazy(() => import("./pages/CreatorPaymentsAndRecovery"));
const DashboardWhitePreview = lazy(() => import("./pages/DashboardWhitePreview"));
const CreatorTaxCompliancePage = lazy(() => import("./pages/CreatorTaxCompliancePage"));
const CreatorOnboarding = lazy(() => import("./pages/CreatorOnboarding"));
const CreatorDashboardPreview = lazy(() => import("./pages/CreatorDashboardPreview"));
const DashboardPreview = lazy(() => import("./pages/DashboardPreview"));
const MobileDashboardDemo = lazy(() => import("./pages/MobileDashboardDemo"));
const BrandDealConsoleDemo = lazy(() => import("./pages/BrandDealConsoleDemo"));
const BrandDesktopDashboard = lazy(() => import("./pages/BrandDesktopDashboard"));
const BrandDirectory = lazy(() => import("./pages/BrandDirectory"));
const BrandDetails = lazy(() => import("./pages/BrandDetails"));
const BrandOpportunities = lazy(() => import("./pages/BrandOpportunities"));
const ContractAnalyzer = lazy(() => import("./pages/ContractAnalyzer"));
const RateCalculator = lazy(() => import("./pages/RateCalculator"));
const DynamicRateCalculator = lazy(() => import("./pages/DynamicRateCalculator"));
const PartnerProgram = lazy(() => import("./pages/PartnerProgram"));
const AIPitchGenerator = lazy(() => import("./pages/AIPitchGenerator"));
const ReferralLanding = lazy(() => import("./pages/ReferralLanding"));
const DocumentsVault = lazy(() => import("./pages/DocumentsVault"));
const InsightsPage = lazy(() => import("./pages/InsightsPage"));
const ContractComparison = lazy(() => import("./pages/ContractComparison"));
const MaintenancePage = lazy(() => import("./pages/MaintenancePage"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ContractProtectionDetails = lazy(() => import("./pages/ContractProtectionDetails"));
const PaymentDetailPage = lazy(() => import("./pages/PaymentDetailPage"));
const BrandDealDetailsPage = lazy(() => import("./pages/BrandDealDetailsPage"));
const ContractReadyPage = lazy(() => import("./pages/ContractReadyPage"));
const CreatorSignPage = lazy(() => import("./pages/CreatorSignPage"));
const ShipPage = lazy(() => import("./pages/ShipPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const AdvisorDashboard = lazy(() => import("./pages/AdvisorDashboard"));
const LawyerDashboard = lazy(() => import("./pages/LawyerDashboard"));
const ConsumerComplaints = lazy(() => import("./pages/lawyer/ConsumerComplaints"));
const ConsumerComplaintsPage = lazy(() => import("./pages/ConsumerComplaintsPage"));
const ComplaintFormPage = lazy(() => import("./pages/ComplaintFormPage"));
const MyConsumerComplaintsPage = lazy(() => import("./pages/MyConsumerComplaintsPage"));
const ConsumerComplaintsHowItWorks = lazy(() => import("./pages/ConsumerComplaintsHowItWorks"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const CollabLinkLanding = lazy(() => import("./pages/CollabLinkLanding"));
const CollabLinkSuccess = lazy(() => import("./pages/CollabLinkSuccess"));
const BrandDealConsole = lazy(() => import("./pages/BrandDealConsole"));
const ProposalSent = lazy(() => import("./pages/ProposalSent"));
const BrandDashboard = lazy(() => import("./pages/BrandDashboard"));
const BrandSettings = lazy(() => import("./pages/BrandSettings"));
const CollabAcceptPage = lazy(() => import("./pages/CollabAcceptPage"));
const CollabActionPage = lazy(() => import("./pages/CollabActionPage"));
const CreatorsDirectory = lazy(() => import("./pages/CreatorsDirectory"));
const DiscoverCreators = lazy(() => import("./pages/DiscoverCreators"));
const CreatorProfilePage = lazy(() => import("./pages/CreatorProfilePage"));
const CreatorReputationDashboard = lazy(() => import("./pages/CreatorReputationDashboard"));
const PreviewAmanParmar = lazy(() => import("./pages/PreviewAmanParmar"));
const PushTestLab = lazy(() => import("./pages/PushTestLab"));
const SeoDashboard = lazy(() => import("./pages/seo-dashboard"));

// Already lazy-loaded
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const ContractUploadFlow = lazy(() => import("./pages/ContractUploadFlow"));

// Non-page imports (keep as static imports)
import { SessionContextProvider } from "./contexts/SessionContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import ProtectedLayout from "./components/ProtectedLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AppToaster from "./components/AppToaster";
import FacebookPixelTracker from "./components/FacebookPixelTracker";
import GoogleAnalyticsTracker from "./components/GoogleAnalyticsTracker";
import LegacyCollabRedirect from "./components/collab/LegacyCollabRedirect";
import LegacyCollabSuccessRedirect from "./components/collab/LegacyCollabSuccessRedirect";
import { ErrorBoundary } from "./components/ui/error-boundary";
import NetworkStatusWrapper from "./components/NetworkStatusWrapper";
import ScrollToTop from "./components/ScrollToTop";
import AddToHomeScreen from "./components/mobile/AddToHomeScreen";

// Lazy-loaded pages for better bundle splitting

const RouteFallback = () => (
  <div className="min-h-[45vh] flex items-center justify-center px-4">
    <div className="flex items-center gap-2 text-sm text-white/80">
      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      Loading page...
    </div>
  </div>
);

const LazyRoute = ({ children }: { children: ReactNode }) => (
  <ErrorBoundary variant="inline">
    <Suspense fallback={<RouteFallback />}>{children}</Suspense>
  </ErrorBoundary>
);

// Redirect component for old brand-reply routes
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

// Configure React Query with timeout and retry settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for network/server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

const App = () => {
  // Removed the temporary useEffect block for role update
  const [showSplash, setShowSplash] = useState(true);
  const [appLoaded, setAppLoaded] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

  // Redirect hash-based public token URLs to path-based URLs (BrowserRouter uses pathname, not hash)
  useEffect(() => {
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    if (pathname !== "/" || !hash || !hash.startsWith("#/")) return;
    const pathFromHash = hash.slice(1);
    const hashRouteMatch = pathFromHash.match(
      /^\/(contract-ready|ship|deal-details|deal\/brand-response|deal|proposal-sent|feedback|brand-reply|brand\/response)\/[^/]+/
    );
    if (hashRouteMatch) {
      window.location.replace(window.location.origin + pathFromHash);
    }
  }, []);

  // Mark app as loaded (prefetch removed - not needed for SPA routing)
  useEffect(() => {
    if (!appLoaded) {
      setAppLoaded(true);
    }
  }, [appLoaded]);

  // Check if splash should be shown (only on first load)
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    if (hasSeenSplash) {
      setShowSplash(false);
      setSplashComplete(true);
    }
  }, []);

  // Handle OAuth errors and malformed OAuth URLs (before routing)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorCode = urlParams.get('error_code');
    const errorDescription = urlParams.get('error_description');

    // Check for malformed OAuth callback (tokens in pathname instead of hash)
    const pathname = window.location.pathname;
    const hasOAuthInPathname = pathname.includes('access_token=') || pathname.includes('refresh_token=');

    if (hasOAuthInPathname) {
      console.log('[App] Detected OAuth tokens in pathname, moving to hash...');

      // Extract tokens from pathname
      const tokenPart = pathname.substring(pathname.indexOf('access_token='));
      const newHash = '#' + tokenPart;

      // Clean the URL and set hash
      window.history.replaceState({}, '', '/');
      window.location.hash = newHash;

      return; // Exit early, let SessionContext handle the OAuth flow
    }

    if (error || errorCode || errorDescription) {
      // Clean the URL immediately to prevent routing to error string
      const cleanPath = window.location.pathname;
      const cleanUrl = cleanPath;
      window.history.replaceState({}, '', cleanUrl);

      // Redirect to login page where error will be displayed
      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }
  }, []);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
    // Wait for splash to fully fade out before showing app
    setTimeout(() => {
      setSplashComplete(true);
    }, 250); // Slightly longer than splash fade-out duration
  };

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AppToaster />
          {/* Splash Screen */}
          {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

          {/* Main App - Only show after splash is completely gone */}
          {splashComplete && (
            <div className="opacity-0 animate-[fadeInApp_0.2s_ease-out_0.05s_forwards]">
              {/* replaced-by-ultra-polish: Skip to main content link for accessibility */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10001] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Skip to main content"
              >
                Skip to main content
              </a>
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ScrollToTop />
                <NetworkStatusWrapper>
                  <FacebookPixelTracker />
                  <GoogleAnalyticsTracker /> {/* Add GA4 tracker here */}
                  <SessionContextProvider>
                    <SidebarProvider>
                      <Routes>
                        {/* Root route: Public marketing landing page. LandingPage handles redirecting logged-in users. */}
                        <Route path="/" element={<LazyRoute><LandingPage /></LazyRoute>} />
                        <Route path="/old-home" element={<LazyRoute><ProtectedRoute><MarketingHome /></ProtectedRoute></LazyRoute>} />

                        {/* Auth routes: Accessible directly, not protected */}
                        <Route path="/login" element={<LazyRoute><Login /></LazyRoute>} />
                        <Route path="/signup" element={<LazyRoute><Signup /></LazyRoute>} />
                        <Route path="/reset-password" element={<LazyRoute><ResetPassword /></LazyRoute>} />

                        {/* Public routes */}
                        <Route path="/about" element={<LazyRoute><About /></LazyRoute>} />
                        <Route path="/blog" element={<LazyRoute><Blog /></LazyRoute>} />
                        <Route path="/blog/:slug" element={<LazyRoute><BlogPostDetail /></LazyRoute>} />
                        <Route path="/careers" element={<LazyRoute><Careers /></LazyRoute>} />

                        {/* Free Tool Landing Pages */}
                        <Route path="/free-influencer-contract" element={<LazyRoute><FreeInfluencerContract /></LazyRoute>} />
                        <Route path="/collaboration-agreement-generator" element={<LazyRoute><CollaborationAgreementGenerator /></LazyRoute>} />
                        <Route path="/pricing-comparison" element={<LazyRoute><PricingComparison /></LazyRoute>} />
                        <Route path="/privacy-policy" element={<LazyRoute><PrivacyPolicy /></LazyRoute>} />
                        <Route path="/terms-of-service" element={<LazyRoute><TermsOfService /></LazyRoute>} />
                        <Route path="/refund-policy" element={<LazyRoute><RefundPolicy /></LazyRoute>} />
                        <Route path="/delete-data" element={<LazyRoute><DeleteData /></LazyRoute>} />
                        <Route path="/sitemap" element={<LazyRoute><Sitemap /></LazyRoute>} />
                        <Route path="/consumer-complaints/how-it-works" element={<LazyRoute><ConsumerComplaintsHowItWorks /></LazyRoute>} />

                        {/* Plan Detail Routes */}
                        <Route path="/plan/essential" element={<LazyRoute><EssentialPlan /></LazyRoute>} />
                        <Route path="/plan/growth" element={<LazyRoute><GrowthPlan /></LazyRoute>} />
                        <Route path="/plan/strategic" element={<LazyRoute><StrategicPlan /></LazyRoute>} />

                        {/* NEW LEAD FUNNEL ROUTES */}
                        <Route path="/free-legal-check" element={<LazyRoute><FreeLegalCheck /></LazyRoute>} />
                        <Route path="/thank-you" element={<LazyRoute><ThankYou /></LazyRoute>} />

                        {/* Preview Routes */}
                        <Route path="/dashboard-white-preview" element={<LazyRoute><DashboardWhitePreview /></LazyRoute>} />
                        <Route path="/dashboard-preview" element={<LazyRoute><CreatorDashboardPreview /></LazyRoute>} />
                        <Route path="/dashboard-components-preview" element={<LazyRoute><DashboardPreview /></LazyRoute>} />
                        <Route path="/demo-dashboard" element={<LazyRoute><MobileDashboardDemo /></LazyRoute>} />
                        <Route path="/brand-console-demo" element={<LazyRoute><BrandDealConsoleDemo /></LazyRoute>} />
                        <Route path="/brand-desktop-demo" element={<LazyRoute><BrandDesktopDashboard /></LazyRoute>} />
                        <Route path="/preview/aman-parmar" element={<LazyRoute><PreviewAmanParmar /></LazyRoute>} />

                        {/* Referral Landing */}
                        <Route path="/p/:code" element={<LazyRoute><ReferralLanding /></LazyRoute>} />

                        {/* Creator Discovery & Directory Routes (Public) */}
                        <Route path="/discover" element={<LazyRoute><DiscoverCreators /></LazyRoute>} />
                        <Route path="/discover/:category" element={<LazyRoute><DiscoverCreators /></LazyRoute>} />
                        <Route path="/creators" element={<LazyRoute><CreatorsDirectory /></LazyRoute>} />
                        <Route path="/creators/:category" element={<LazyRoute><CreatorsDirectory /></LazyRoute>} />
                        <Route path="/creator/:username" element={<LazyRoute><CreatorProfilePage /></LazyRoute>} />

                        {/* Collaboration Request Link Routes (Public) - SEO-friendly clean URLs */}
                        {/* Accept from email: public preview + soft auth, then redirect to deal */}
                        <Route path="/collab/accept/:requestToken" element={<LazyRoute><CollabAcceptPage /></LazyRoute>} />
                        <Route path="/collab/push-test" element={<Navigate to="/push-test" replace />} />
                        <Route path="/collab-action" element={<LazyRoute><CollabActionPage /></LazyRoute>} />
                         <Route path="/seo-dashboard" element={<LazyRoute><SeoDashboard /></LazyRoute>} />
                         {/* Primary public creator routes: /:username */}
                         <Route path="/:username" element={<LazyRoute><CollabLinkLanding /></LazyRoute>} />
                        <Route path="/:username/success" element={<LazyRoute><CollabLinkSuccess /></LazyRoute>} />

                        {/* Legacy redirect: /collab/:username → /:username */}
                        <Route path="/collab/:username" element={<LegacyCollabRedirect />} />
                        <Route path="/collab/:username/success" element={<LegacyCollabSuccessRedirect />} />

                        {/* Client-specific routes - Redirected to Creator Dashboard */}
                        <Route path="/client-dashboard" element={<Navigate to="/creator-dashboard" replace />} />
                        <Route path="/client-profile" element={<LazyRoute><ProtectedLayout allowedRoles={['client']}><ClientProfile /></ProtectedLayout></LazyRoute>} />
                        <Route path="/client-subscription" element={<LazyRoute><ProtectedLayout allowedRoles={['client']}><ClientSubscription /></ProtectedLayout></LazyRoute>} />
                        <Route path="/client-cases" element={<LazyRoute><ProtectedLayout allowedRoles={['client']}><ClientCases /></ProtectedLayout></LazyRoute>} />
                        <Route path="/client-documents" element={<LazyRoute><ProtectedLayout allowedRoles={['client']}><ClientDocuments /></ProtectedLayout></LazyRoute>} />
                        <Route path="/client-consultations" element={<LazyRoute><ProtectedLayout allowedRoles={['client']}><ClientConsultations /></ProtectedLayout></LazyRoute>} />
                        <Route path="/client-activity-log" element={<LazyRoute><ProtectedLayout allowedRoles={['client']}><ClientActivityLog /></ProtectedLayout></LazyRoute>} />

                        {/* Admin-specific routes */}
                        <Route path="/admin-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminDashboard /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-documents" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminDocuments /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-cases" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminCases /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-clients" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminClients /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-consultations" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminConsultations /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-subscriptions" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminSubscriptions /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-activity-log" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminActivityLog /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-profile" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminProfile /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-influencers" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminInfluencers /></ProtectedLayout></LazyRoute>} />
                        <Route path="/admin-discovery" element={<LazyRoute><ProtectedLayout allowedRoles={['admin']}><AdminDiscovery /></ProtectedLayout></LazyRoute>} />

                        {/* CA-specific routes */}
                        <Route path="/ca-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={['chartered_accountant']}><CADashboard /></ProtectedLayout></LazyRoute>} />

                        {/* Creator-specific routes */}
                        <Route path="/creator-onboarding" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorOnboarding /></ProtectedLayout></LazyRoute>} />
                        <Route path="/creator-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={['creator', 'client']}><CreatorDashboard /></ProtectedLayout></LazyRoute>} />
                        <Route path="/creator-collab" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorCollab /></ProtectedLayout></LazyRoute>} />
                        {/* Legacy creator page: keep the new mobile dashboard as the primary entry point */}
                        <Route path="/collab-requests" element={<Navigate to="/creator-dashboard?tab=collabs&subtab=pending" replace />} />
                        <Route path="/collab-requests/:requestId/brief" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CollabRequestBriefPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/collab-requests/:requestId/counter" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CollabRequestCounterPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/creator-profile" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorProfile /></ProtectedLayout></LazyRoute>} />
                        <Route path="/push-test" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><PushTestLab /></ProtectedLayout></LazyRoute>} />
                        <Route path="/creator-analytics" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorAnalytics /></ProtectedLayout></LazyRoute>} />
                        <Route path="/creator-reputation" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorReputationDashboard /></ProtectedLayout></LazyRoute>} />
                        <Route path="/notifications" element={<LazyRoute><ProtectedLayout allowedRoles={['client', 'admin', 'chartered_accountant', 'creator']}><NotificationCenter /></ProtectedLayout></LazyRoute>} />
                        <Route path="/search" element={<LazyRoute><ProtectedLayout allowedRoles={['client', 'admin', 'chartered_accountant', 'creator']}><SearchResults /></ProtectedLayout></LazyRoute>} />
                        <Route path="/calendar" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CalendarPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/creator-contracts" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorContracts /></ProtectedLayout></LazyRoute>} />
                        <Route path="/creator-tax-compliance" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorTaxCompliancePage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/creator-payments" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorPaymentsAndRecovery /></ProtectedLayout></LazyRoute>} />
                        <Route path="/documents-vault" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><DocumentsVault /></ProtectedLayout></LazyRoute>} />
                        <Route path="/insights" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><InsightsPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/contract-comparison" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><ContractComparison /></ProtectedLayout></LazyRoute>} />
                        <Route path="/contract-protection-details/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><ContractProtectionDetails /></ProtectedLayout></LazyRoute>} />
                        <Route path="/deal-delivery-details/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><DealDeliveryDetailsPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/create-deal" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreateDealPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/payment/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><PaymentDetailPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/deal/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><BrandDealDetailsPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/deal/:dealId/brand-response" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><BrandDealDetailsPage /></ProtectedLayout></LazyRoute>} />

                        {/* Creator Standalone Routes - For new tab views */}
                        <Route path="/contract-ready/:token" element={<LazyRoute><ContractReadyPage /></LazyRoute>} />
                        <Route path="/creator-sign/:token" element={<LazyRoute><CreatorSignPage /></LazyRoute>} />
                        <Route path="/ship/:token" element={<LazyRoute><ShipPage /></LazyRoute>} />
                        <Route path="/proposal-sent/:token" element={<LazyRoute><ProposalSent /></LazyRoute>} />
                        <Route path="/feedback/:token" element={<LazyRoute><FeedbackPage /></LazyRoute>} />

                        {/* Legacy brand-reply route redirect */}
                        <Route path="/brand-reply/:token" element={<ContractReadyRedirect />} />
                        <Route path="/brand/response/:token" element={<ContractReadyRedirect />} />

                        {/* Legal Tools & Calculators */}
                        <Route path="/contract-analyzer" element={<LazyRoute><ContractAnalyzer /></LazyRoute>} />
                        <Route path="/rate-calculator" element={<LazyRoute><RateCalculator /></LazyRoute>} />
                        <Route path="/dynamic-rate-calculator" element={<LazyRoute><DynamicRateCalculator /></LazyRoute>} />
                        <Route path="/ai-pitch-generator" element={<LazyRoute><AIPitchGenerator /></LazyRoute>} />

                        {/* Brand Routes */}
                        <Route path="/brand-directory" element={<LazyRoute><BrandDirectory /></LazyRoute>} />
                        <Route path="/brand/:brandId" element={<LazyRoute><BrandDetails /></LazyRoute>} />
                        <Route path="/brand-opportunities" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><BrandOpportunities /></ProtectedLayout></LazyRoute>} />
                        <Route path="/brand-deal-console" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><BrandDealConsole /></ProtectedLayout></LazyRoute>} />
                        <Route path="/brand-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={['brand']}><BrandDashboard /></ProtectedLayout></LazyRoute>} />
                        <Route path="/brand-settings" element={<LazyRoute><ProtectedLayout allowedRoles={['brand']}><BrandSettings /></ProtectedLayout></LazyRoute>} />
                        <Route path="/upgrade" element={<LazyRoute><ProtectedLayout><UpgradePage /></ProtectedLayout></LazyRoute>} />

                        {/* Consumer Complaints */}
                        <Route path="/consumer-complaints" element={<LazyRoute><ConsumerComplaintsPage /></LazyRoute>} />
                        <Route path="/consumer-complaints/new" element={<LazyRoute><ComplaintFormPage /></LazyRoute>} />
                        <Route path="/consumer-complaints/my" element={<LazyRoute><ProtectedLayout><MyConsumerComplaintsPage /></ProtectedLayout></LazyRoute>} />

                        {/* Messages */}
                        <Route path="/messages" element={<LazyRoute><ProtectedLayout><MessagesPage /></ProtectedLayout></LazyRoute>} />
                        <Route path="/messages/:conversationId" element={<LazyRoute><ProtectedLayout><MessagesPage /></ProtectedLayout></LazyRoute>} />

                        {/* Contract Upload Flow */}
                        <Route path="/contract-upload" element={<LazyRoute><ProtectedLayout><ContractUploadFlow /></ProtectedLayout></LazyRoute>} />

                        {/* Partner Program */}
                        <Route path="/partner-program" element={<LazyRoute><PartnerProgram /></LazyRoute>} />

                        {/* Professional Dashboard Routes */}
                        <Route path="/advisor-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={['advisor']}><AdvisorDashboard /></ProtectedLayout></LazyRoute>} />
                        <Route path="/lawyer-dashboard" element={<LazyRoute><ProtectedLayout allowedRoles={['lawyer']}><LawyerDashboard /></ProtectedLayout></LazyRoute>} />
                        <Route path="/lawyer/consumer-complaints" element={<LazyRoute><ProtectedLayout allowedRoles={['lawyer']}><ConsumerComplaints /></ProtectedLayout></LazyRoute>} />

                        {/* Maintenance Page */}
                        <Route path="/maintenance" element={<LazyRoute><MaintenancePage /></LazyRoute>} />

                        {/* Creator contract dashboard with query params */}
                        <Route path="/creator-contract-dashboard/:dealId" element={<LazyRoute><ProtectedLayout allowedRoles={['creator']}><CreatorContractDashboardRoute /></ProtectedLayout></LazyRoute>} />

                        {/* 404 - MUST BE LAST */}
                        <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
                      </Routes>
                      <AddToHomeScreen />
                    </SidebarProvider>
                  </SessionContextProvider>
                </NetworkStatusWrapper>
              </BrowserRouter>
            </div>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
