import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import MarketingHome from "./pages/MarketingHome";
import ClientDashboard from "./pages/ClientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CADashboard from "./pages/CADashboard";
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
import Blog from "./pages/Blog";
import BlogPostDetail from "./pages/BlogPostDetail";
import PricingComparison from "./pages/PricingComparison";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";
import Sitemap from "./pages/Sitemap";
import EssentialPlan from "./pages/EssentialPlan";
import GrowthPlan from "./pages/GrowthPlan";
import StrategicPlan from "./pages/StrategicPlan";
import FreeLegalCheck from "./pages/FreeLegalCheck";
import ThankYou from "./pages/ThankYou";
import GstComplianceChecklist from "./pages/blog/GstComplianceChecklist"; // Import new article component
import { SessionContextProvider } from "./contexts/SessionContext";
import ProtectedLayout from "./components/ProtectedLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import AppToaster from "./components/AppToaster";
import FacebookPixelTracker from "./components/FacebookPixelTracker";
import GoogleAnalyticsTracker from "./components/GoogleAnalyticsTracker"; // Import new tracker

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppToaster />
      <BrowserRouter>
        <FacebookPixelTracker />
        <GoogleAnalyticsTracker /> {/* Add GA4 tracker here */}
        <SessionContextProvider>
          <Routes>
            {/* Root route: Renders MarketingHome. ProtectedRoute handles redirection if authenticated. */}
            <Route path="/" element={<ProtectedRoute><MarketingHome /></ProtectedRoute>} />
            
            {/* Login route: Accessible directly, not protected */}
            <Route path="/login" element={<Login />} />

            {/* Public routes */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPostDetail />} />
            <Route path="/pricing-comparison" element={<PricingComparison />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/sitemap" element={<Sitemap />} />
            
            {/* Plan Detail Routes */}
            <Route path="/plan/essential" element={<EssentialPlan />} />
            <Route path="/plan/growth" element={<GrowthPlan />} />
            <Route path="/plan/strategic" element={<StrategicPlan />} />
            
            {/* NEW LEAD FUNNEL ROUTES */}
            <Route path="/free-legal-check" element={<FreeLegalCheck />} />
            <Route path="/thank-you" element={<ThankYou />} />

            {/* Client-specific routes */}
            <Route path="/client-dashboard" element={<ProtectedLayout allowedRoles={['client']}><ClientDashboard /></ProtectedLayout>} />
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
            
            {/* Shared routes (accessible by client, admin, and CA) */}
            <Route path="/messages" element={<ProtectedLayout allowedRoles={['client', 'admin', 'chartered_accountant']}><MessagesPage /></ProtectedLayout>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;