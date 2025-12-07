import { useState, useEffect } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { SplashScreen } from "@/components/mobile/SplashScreen";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MarketingHome from "./pages/MarketingHome";
import HomePage from "./pages/HomePage";
import AdminDashboard from "./pages/AdminDashboard";
import CADashboard from "./pages/CADashboard";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorAnalytics from "./pages/CreatorAnalytics"; // New: Import CreatorDashboard
import NotificationCenter from "./pages/NotificationCenter";
import AdminDocuments from "./pages/AdminDocuments";
import AdminCases from "./pages/AdminCases";
import AdminClients from "./pages/AdminClients";
import AdminConsultations from "./pages/AdminConsultations";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import MessagesPage from "./pages/MessagesPage";
import ClientProfile from "./pages/ClientProfile";
import ClientSubscription from "./pages/ClientSubscription";
import ClientCases from "./pages/ClientCases";
import ClientDocuments from "./pages/ClientDocuments";
import ClientConsultations from "./pages/ClientConsultations";
import AdminActivityLog from "./pages/AdminActivityLog";
import ClientActivityLog from "./pages/ClientActivityLog";
import AdminProfile from "./pages/AdminProfile";
import CreatorProfile from "./pages/CreatorProfile";
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail"; // Corrected path
import PricingComparison from "./pages/PricingComparison";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import DeleteData from "./pages/DeleteData";
import Sitemap from "./pages/Sitemap";
import EssentialPlan from "./pages/EssentialPlan";
import GrowthPlan from "./pages/GrowthPlan";
import StrategicPlan from "./pages/StrategicPlan";
import FreeLegalCheck from "./pages/FreeLegalCheck";
import ThankYou from "./pages/ThankYou";
import GstComplianceChecklist from "./pages/blog/GstComplianceChecklist"; // Import new article component
import { SessionContextProvider } from "./contexts/SessionContext";
import { SidebarProvider } from "./contexts/SidebarContext";
import ProtectedLayout from "./components/ProtectedLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AppToaster from "./components/AppToaster";
import FacebookPixelTracker from "./components/FacebookPixelTracker";
import GoogleAnalyticsTracker from "./components/GoogleAnalyticsTracker"; // Import new tracker

// NEW: Import Creator-specific pages
import CreatorContracts from "./pages/CreatorContracts";
import DealDetailPage from "./pages/DealDetailPage";
import CreateDealPage from "./pages/CreateDealPage";
import CreatorPaymentsAndRecovery from "./pages/CreatorPaymentsAndRecovery";
import DashboardWhitePreview from "./pages/DashboardWhitePreview";
import CreatorContentProtection from "./pages/CreatorContentProtection";
import CreatorTaxCompliancePage from "./pages/CreatorTaxCompliancePage";
import CreatorOnboarding from "./pages/CreatorOnboarding"; // NEW: Import CreatorOnboarding
import CreatorDashboardPreview from "./pages/CreatorDashboardPreview"; // NEW: Import CreatorDashboardPreview
import BrandDirectory from "./pages/BrandDirectory";
import BrandDetails from "./pages/BrandDetails";
import BrandOpportunities from "./pages/BrandOpportunities";
import ContractAnalyzer from "./pages/ContractAnalyzer";
import RateCalculator from "./pages/RateCalculator";
import PartnerProgram from "./pages/PartnerProgram";
import AIPitchGenerator from "./pages/AIPitchGenerator";
import ReferralLanding from "./pages/ReferralLanding";
import CreatorProfessionalTeamPage from "./pages/CreatorProfessionalTeam";
import DocumentsVault from "./pages/DocumentsVault";
import InsightsPage from "./pages/InsightsPage";
import ContractUploadFlow from "./pages/ContractUploadFlow";
import ContractComparison from "./pages/ContractComparison";
import MaintenancePage from "./pages/MaintenancePage";
import SearchResults from "./pages/SearchResults";
import CalendarPage from "./pages/CalendarPage";
import ContractProtectionDetails from "./pages/ContractProtectionDetails";
import PaymentDetailPage from "./pages/PaymentDetailPage";
import AdvisorDashboard from "./pages/AdvisorDashboard";
import LawyerDashboard from "./pages/LawyerDashboard";
import { ErrorBoundary } from "./components/ui/error-boundary";
import NetworkStatusWrapper from "./components/NetworkStatusWrapper";


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
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[10001] focus:px-4 focus:py-2 focus:bg-purple-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="Skip to main content"
            >
              Skip to main content
            </a>
            <HashRouter>
              <NetworkStatusWrapper>
                <FacebookPixelTracker />
                <GoogleAnalyticsTracker /> {/* Add GA4 tracker here */}
                <SessionContextProvider>
                  <SidebarProvider>
                  <Routes>
              {/* Root route: Renders HomePage. ProtectedRoute handles redirection if authenticated. */}
              <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/old-home" element={<ProtectedRoute><MarketingHome /></ProtectedRoute>} />
              
              {/* Auth routes: Accessible directly, not protected */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Public routes */}
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPostDetail />} />
              <Route path="/pricing-comparison" element={<PricingComparison />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/delete-data" element={<DeleteData />} />
              <Route path="/sitemap" element={<Sitemap />} />
              
              {/* Plan Detail Routes */}
              <Route path="/plan/essential" element={<EssentialPlan />} />
              <Route path="/plan/growth" element={<GrowthPlan />} />
              <Route path="/plan/strategic" element={<StrategicPlan />} />
              
              {/* NEW LEAD FUNNEL ROUTES */}
              <Route path="/free-legal-check" element={<FreeLegalCheck />} />
              <Route path="/thank-you" element={<ThankYou />} />
              
              {/* Preview Routes */}
              <Route path="/dashboard-white-preview" element={<DashboardWhitePreview />} />
              <Route path="/dashboard-preview" element={<CreatorDashboardPreview />} />
              
              {/* Referral Landing */}
              <Route path="/p/:code" element={<ReferralLanding />} />

              {/* Client-specific routes - Redirected to Creator Dashboard */}
              <Route path="/client-dashboard" element={<Navigate to="/creator-dashboard" replace />} />
              <Route path="/client-profile" element={<ProtectedLayout allowedRoles={['client']}><ClientProfile /></ProtectedLayout>} />
              <Route path="/client-subscription" element={<ProtectedLayout allowedRoles={['client']}><ClientSubscription /></ProtectedLayout>} />
              <Route path="/client-cases" element={<ProtectedLayout allowedRoles={['client']}><ClientCases /></ProtectedLayout>} />
              <Route path="/client-documents" element={<ProtectedLayout allowedRoles={['client']}><ClientDocuments /></ProtectedLayout>} />
              <Route path="/client-consultations" element={<ProtectedLayout allowedRoles={['client']}><ClientConsultations /></ProtectedLayout>} />
              <Route path="/client-activity-log" element={<ProtectedLayout allowedRoles={['client']}><ClientActivityLog /></ProtectedLayout>} />
              
              {/* Admin-specific routes */}
              <Route path="/admin-dashboard" element={<ProtectedLayout allowedRoles={['admin']}><AdminDashboard /></ProtectedLayout>} />
              <Route path="/admin-documents" element={<ProtectedLayout allowedRoles={['admin']}><AdminDocuments /></ProtectedLayout>} />
              <Route path="/admin-cases" element={<ProtectedLayout allowedRoles={['admin']}><AdminCases /></ProtectedLayout>} />
              <Route path="/admin-clients" element={<ProtectedLayout allowedRoles={['admin']}><AdminClients /></ProtectedLayout>} />
              <Route path="/admin-consultations" element={<ProtectedLayout allowedRoles={['admin']}><AdminConsultations /></ProtectedLayout>} />
              <Route path="/admin-subscriptions" element={<ProtectedLayout allowedRoles={['admin']}><AdminSubscriptions /></ProtectedLayout>} />
              <Route path="/admin-activity-log" element={<ProtectedLayout allowedRoles={['admin']}><AdminActivityLog /></ProtectedLayout>} />
              <Route path="/admin-profile" element={<ProtectedLayout allowedRoles={['admin']}><AdminProfile /></ProtectedLayout>} />

              {/* CA-specific routes */}
              <Route path="/ca-dashboard" element={<ProtectedLayout allowedRoles={['chartered_accountant']}><CADashboard /></ProtectedLayout>} />
              
              {/* Creator-specific routes */}
              <Route path="/creator-onboarding" element={<ProtectedLayout allowedRoles={['creator']}><CreatorOnboarding /></ProtectedLayout>} /> {/* NEW: Onboarding Route */}
              <Route path="/creator-dashboard" element={<ProtectedLayout allowedRoles={['creator']}><CreatorDashboard /></ProtectedLayout>} /> {/* New: Creator Dashboard Route */}
              <Route path="/creator-profile" element={<ProtectedLayout allowedRoles={['creator']}><CreatorProfile /></ProtectedLayout>} />
                  <Route path="/creator-analytics" element={<ProtectedLayout allowedRoles={['creator']}><CreatorAnalytics /></ProtectedLayout>} />
                  <Route path="/notifications" element={<ProtectedLayout allowedRoles={['client', 'admin', 'chartered_accountant', 'creator']}><NotificationCenter /></ProtectedLayout>} />
                  <Route path="/search" element={<ProtectedLayout allowedRoles={['client', 'admin', 'chartered_accountant', 'creator']}><SearchResults /></ProtectedLayout>} />
                  <Route path="/calendar" element={<ProtectedLayout allowedRoles={['creator']}><CalendarPage /></ProtectedLayout>} />
                  <Route path="/partner-program" element={<ProtectedLayout allowedRoles={['creator']}><PartnerProgram /></ProtectedLayout>} />
              {/* NEW: Creator-specific pages */}
              <Route path="/creator-contracts" element={<ProtectedLayout allowedRoles={['creator']}><CreatorContracts /></ProtectedLayout>} />
              <Route path="/brand-deals" element={<ProtectedLayout allowedRoles={['creator']}><CreatorContracts /></ProtectedLayout>} />
              <Route path="/create-deal" element={<ProtectedLayout allowedRoles={['creator']}><CreateDealPage /></ProtectedLayout>} />
              <Route path="/creator-contracts/:dealId" element={<ProtectedLayout allowedRoles={['creator']}><DealDetailPage /></ProtectedLayout>} />
              <Route path="/creator-payments" element={<ProtectedLayout allowedRoles={['creator']}><CreatorPaymentsAndRecovery /></ProtectedLayout>} />
              <Route path="/payment/:paymentId" element={<ProtectedLayout allowedRoles={['creator']}><PaymentDetailPage /></ProtectedLayout>} />
              <Route path="/creator-content-protection" element={<ProtectedLayout allowedRoles={['creator']}><CreatorContentProtection /></ProtectedLayout>} />
              <Route path="/creator-tax-compliance" element={<ProtectedLayout allowedRoles={['creator']}><CreatorTaxCompliancePage /></ProtectedLayout>} />
              <Route path="/documents-vault" element={<ProtectedLayout allowedRoles={['creator']}><DocumentsVault /></ProtectedLayout>} />
              <Route path="/insights" element={<ProtectedLayout allowedRoles={['creator']}><InsightsPage /></ProtectedLayout>} />
              {/* NEW: Creator tools */}
              <Route path="/brand-directory" element={<ProtectedLayout allowedRoles={['creator']}><BrandDirectory /></ProtectedLayout>} />
              <Route path="/brands/:brandId" element={<ProtectedLayout allowedRoles={['creator']}><BrandDetails /></ProtectedLayout>} />
              <Route path="/brands/:brandId/opportunities" element={<ProtectedLayout allowedRoles={['creator']}><BrandOpportunities /></ProtectedLayout>} />
              <Route path="/contract-analyzer" element={<ProtectedLayout allowedRoles={['creator']}><ContractAnalyzer /></ProtectedLayout>} />
              <Route path="/contract-upload" element={<ProtectedLayout allowedRoles={['creator']}><ContractUploadFlow /></ProtectedLayout>} />
              <Route path="/contract-comparison" element={<ProtectedLayout allowedRoles={['creator']}><ContractComparison /></ProtectedLayout>} />
              <Route path="/contract-protection/:contractId" element={<ProtectedLayout allowedRoles={['creator']}><ContractProtectionDetails /></ProtectedLayout>} />
              <Route path="/rate-calculator" element={<ProtectedLayout allowedRoles={['creator']}><RateCalculator /></ProtectedLayout>} />
              <Route path="/ai-pitch-generator" element={<ProtectedLayout allowedRoles={['creator']}><AIPitchGenerator /></ProtectedLayout>} />

              {/* Shared routes (accessible by client, admin, CA, and creator - NOT lawyer) */}
              <Route path="/messages" element={<ProtectedLayout allowedRoles={['client', 'admin', 'chartered_accountant', 'creator']}><MessagesPage /></ProtectedLayout>} />
              
              {/* Advisor Dashboard (for admin and CA roles) */}
              <Route path="/advisor-dashboard" element={<ProtectedLayout allowedRoles={['admin', 'chartered_accountant']}><AdvisorDashboard /></ProtectedLayout>} />
              
              {/* Lawyer Dashboard (for lawyer role) */}
              <Route path="/lawyer-dashboard" element={<ProtectedLayout allowedRoles={['lawyer']}><LawyerDashboard /></ProtectedLayout>} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </SidebarProvider>
          </SessionContextProvider>
        </NetworkStatusWrapper>
        </HashRouter>
            </div>
          )}
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;