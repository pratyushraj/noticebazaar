import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import LegacyCollabRedirect from "@/components/collab/LegacyCollabRedirect";
import LegacyCollabSuccessRedirect from "@/components/collab/LegacyCollabSuccessRedirect";
import LegacyCreatorProfileRedirect from "@/components/collab/LegacyCreatorProfileRedirect";
import { LazyRoute } from "./routeElements";
import ReservedUsernameGuard from "@/components/collab/ReservedUsernameGuard";
import KiroFoodsPitch from "@/pages/pitch/KiroFoodsPitch";
import FarmDidiPitch from "@/pages/pitch/FarmDidiPitch";
import NaturallyYoursPitch from "@/pages/pitch/NaturallyYoursPitch";
import PetBrandPitch from "@/pages/pitch/PetBrandPitch";

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
const RateCalculator = lazy(() => import("@/pages/RateCalculator"));
const RateCalculatorDynamic = lazy(() => import("@/pages/RateCalculatorDynamic"));
const PatnaInfluencers = lazy(() => import("@/pages/PatnaInfluencers"));
const LocalInfluencers = lazy(() => import("@/pages/LocalInfluencers"));
const CollabLinkLanding = lazy(() => import("@/pages/CollabLinkLanding"));
const ROICalculator = lazy(() => import("@/pages/ROICalculator"));
const InvestorPitchPage = lazy(() => import("@/pages/InvestorPitchPage"));
const InvestorPitchDeck = lazy(() => import("@/pages/InvestorPitchDeck"));
const BrandPitchDeck = lazy(() => import("@/pages/BrandPitchDeck"));
const SalonProposalDeck = lazy(() => import("@/pages/SalonProposalDeck"));
const ContentWorkspace = lazy(() => import("@/pages/ContentWorkspace"));
const DentistWebsite = lazy(() => import("@/pages/DentistWebsite"));

const WelcomeOnboarding = lazy(() => import("@/pages/WelcomeOnboarding"));
const InstaMockup = lazy(() => import("@/pages/InstaMockup"));
const BarterCollabPage = lazy(() => import("@/pages/BarterCollabPage"));
const AutoplayDirectory = lazy(() => import("@/pages/AutoplayDirectory"));
const ReelGenerator = lazy(() => import("@/pages/ReelGenerator"));
const DentalTrendFinder = lazy(() => import("@/pages/DentalTrendFinder"));
const ShootWorkspace = lazy(() => import("@/pages/ShootWorkspace"));
const CreateShootWorkspace = lazy(() => import("@/pages/CreateShootWorkspace"));


export const PublicRoutes = () => (
  <>
    <Route path="/" element={<LazyRoute><LandingPage /></LazyRoute>} />
    <Route path="/pitch/kiro-foods" element={<KiroFoodsPitch />} />
    <Route path="/farmdidi" element={<FarmDidiPitch />} />
    <Route path="/pitch/farmdidi" element={<Navigate to="/farmdidi" replace />} />
    <Route path="/naturallyyours" element={<NaturallyYoursPitch />} />
    <Route path="/pitch/naturallyyours" element={<Navigate to="/naturallyyours" replace />} />
    <Route path="/pet-care" element={<PetBrandPitch />} />
    <Route path="/pitch/pet-care" element={<Navigate to="/pet-care" replace />} />
    <Route path="/insta-mockup" element={<LazyRoute><InstaMockup /></LazyRoute>} />
    <Route path="/reel-generator" element={<LazyRoute><ReelGenerator /></LazyRoute>} />
    <Route path="/reels-creator" element={<Navigate to="/reel-generator" replace />} />
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
    <Route path="/patna-influencers" element={<LazyRoute><PatnaInfluencers /></LazyRoute>} />
    <Route path="/discover/patna" element={<Navigate to="/patna-influencers" replace />} />
    <Route path="/local-creators/patna" element={<Navigate to="/patna-influencers" replace />} />
    <Route path="/local-creators/:city" element={<LazyRoute><LocalInfluencers /></LazyRoute>} />
    <Route path="/delhi-influencers" element={<Navigate to="/local-creators/delhi" replace />} />
    <Route path="/mumbai-influencers" element={<Navigate to="/local-creators/mumbai" replace />} />
    <Route path="/bangalore-influencers" element={<Navigate to="/local-creators/bangalore" replace />} />
    <Route path="/pune-influencers" element={<Navigate to="/local-creators/pune" replace />} />
    <Route path="/lucknow-influencers" element={<Navigate to="/local-creators/lucknow" replace />} />
    <Route path="/dehradun-influencers" element={<Navigate to="/local-creators/dehradun" replace />} />
    <Route path="/noida-influencers" element={<Navigate to="/local-creators/noida" replace />} />
    <Route path="/discover" element={<Navigate to="/signup" replace />} />
    <Route path="/discover/:category" element={<Navigate to="/signup" replace />} />
    <Route path="/creators-list" element={<Navigate to="/signup" replace />} />
    <Route path="/rate-calculator" element={<LazyRoute><RateCalculator /></LazyRoute>} />
    <Route path="/calculator" element={<LazyRoute><ROICalculator /></LazyRoute>} />
    <Route path="/investors" element={<LazyRoute><InvestorPitchPage /></LazyRoute>} />
    <Route path="/deck" element={<LazyRoute><InvestorPitchDeck /></LazyRoute>} />
    <Route path="/brand-deck" element={<LazyRoute><BrandPitchDeck /></LazyRoute>} />
    <Route path="/pitch-deck" element={<Navigate to="/brand-deck" replace />} />
    <Route path="/salon-proposal" element={<LazyRoute><SalonProposalDeck /></LazyRoute>} />
    <Route path="/salon-deck" element={<Navigate to="/salon-proposal" replace />} />
    <Route path="/salons" element={<Navigate to="/salon-proposal" replace />} />
    <Route path="/dentist-proposal" element={<LazyRoute><ContentWorkspace /></LazyRoute>} />
    <Route path="/dentist-website" element={<LazyRoute><DentistWebsite /></LazyRoute>} />
    <Route path="/clinic-website" element={<Navigate to="/dentist-website" replace />} />
    <Route path="/dentist-preview" element={<Navigate to="/dentist-proposal" replace />} />
    <Route path="/dentist-deck" element={<Navigate to="/dentist-proposal" replace />} />
    <Route path="/dental-trends" element={<LazyRoute><DentalTrendFinder /></LazyRoute>} />
    <Route path="/dentist-trends" element={<Navigate to="/dental-trends" replace />} />
    <Route path="/shoot-workspace/new" element={<LazyRoute><CreateShootWorkspace /></LazyRoute>} />
    <Route path="/shoot-workspace/:id" element={<LazyRoute><ShootWorkspace /></LazyRoute>} />
    <Route path="/patliputra/shoot" element={<LazyRoute><ShootWorkspace idOverride="126fc6ff-e1e4-4d43-b4dc-9fb45f077dde" roleOverride="influencer" /></LazyRoute>} />
    <Route path="/patliputra/review" element={<LazyRoute><ShootWorkspace idOverride="126fc6ff-e1e4-4d43-b4dc-9fb45f077dde" roleOverride="dentist" /></LazyRoute>} />
    <Route path="/calculator/:platform/:niche" element={<LazyRoute><RateCalculatorDynamic /></LazyRoute>} />
    <Route path="/creator/:username" element={<LegacyCreatorProfileRedirect />} />
    <Route path="/settings" element={<Navigate to="/creator-profile" replace />} />
    <Route path="/brand-opportunities" element={<Navigate to="/creator-dashboard" replace />} />
    {/* Barter SEO Pages */}
    <Route path="/barter-collab" element={<LazyRoute><BarterCollabPage /></LazyRoute>} />
    <Route path="/barter" element={<Navigate to="/barter-collab" replace />} />
    <Route path="/product-exchange" element={<Navigate to="/barter-collab" replace />} />
    <Route path="/influencer-gifting" element={<Navigate to="/barter-collab" replace />} />
    {/* Local Autoplay Directory */}
    <Route path="/autoplay-directory" element={<LazyRoute><AutoplayDirectory /></LazyRoute>} />
    <Route path="/secret-reels" element={<LazyRoute><AutoplayDirectory /></LazyRoute>} />
    <Route path="/local-creators" element={<Navigate to="/autoplay-directory" replace />} />
    <Route path="/:username" element={<ReservedUsernameGuard><LazyRoute><CollabLinkLanding /></LazyRoute></ReservedUsernameGuard>} />
    <Route path="/:username/success" element={<ReservedUsernameGuard><LazyRoute><CollabLinkLanding /></LazyRoute></ReservedUsernameGuard>} />
    <Route path="/collab/:username" element={<LegacyCollabRedirect />} />
    <Route path="/collab/:username/success" element={<LegacyCollabSuccessRedirect />} />
    <Route path="*" element={<LazyRoute><NotFound /></LazyRoute>} />
  </>
);
