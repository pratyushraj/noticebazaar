import React from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  IndianRupee, 
  Sparkles
} from 'lucide-react';
import MobileDashboardDemo from './MobileDashboardDemo';

const InstaMockup = () => {
  const mockProfile = {
    // Hack: Setting username to the full name to fix greeting without changing shared dashboard code
    username: 'Dipali Tripathi', 
    first_name: 'Dipali',
    last_name: 'Tripathi',
    instagram_followers: '45.2K',
    // Using a reliable, high-quality profile picture
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9ce23b9933?auto=format&fit=crop&q=80&w=400',
    content_niches: ['Beauty', 'Fashion', 'Lifestyle']
  };

  const mockOffers = [
    {
      id: 'offer_1',
      brand_name: 'Luxe Beauty',
      amount: 45000,
      collab_type: 'paid',
      campaign_category: 'Skincare Launch',
      selected_package_label: 'Premium Reel'
    }
  ];

  const mockDeals = [
    {
      id: 'deal_1',
      brand_name: 'Nike India',
      deal_amount: 75000,
      status: 'active',
      progressStep: 4,
      totalStages: 7,
      campaign_category: 'Summer Run'
    },
    {
      id: 'deal_2',
      brand_name: 'Mamaearth',
      deal_amount: 124000, // Using deal_amount for calculation
      status: 'completed',
      progressStep: 7,
      totalStages: 7,
      campaign_category: 'Natural Glow'
    }
  ];

  return (
    <div id="insta-ad-capture" className="w-[1080px] h-[1080px] bg-[#020D0A] flex flex-col items-center justify-center relative overflow-hidden font-outfit">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="/marketing/background.png" 
          alt="Premium Background" 
          className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#020D0A] via-[#020D0A]/80 to-transparent" />
      </div>

      {/* CSS Injection to polish the look */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Force photo visibility */
        .insta-mockup-frame img {
          opacity: 1 !important;
          visibility: visible !important;
        }

        /* Aggressively hide PWA install prompts and other fixed overlays inside the mockup */
        .insta-mockup-frame > div > div > div:has(button:contains("INSTALL")),
        .insta-mockup-frame div[class*="fixed"]:has(p:contains("home screen")),
        .insta-mockup-frame div[class*="absolute"]:has(p:contains("home screen")) {
          display: none !important;
        }

        .premium-glass {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Fix for rounding issues at the top */
        .phone-frame-container {
            mask-image: linear-gradient(to bottom, black 0%, black 100%); /* ensures no bleeding */
        }
      `}</style>

      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse z-0" style={{ animationDelay: '2s' }} />
      
      {/* Top Header */}
      <div className="absolute top-12 left-12 flex items-center gap-3 z-10">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter leading-none italic">Creator Armour</h2>
          <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">The Elite Standard</p>
        </div>
      </div>

      <div className="absolute top-16 right-12 text-right z-10">
        <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-widest mb-1">
          <Sparkles className="w-4 h-4" />
          <span>New UI 2.0</span>
        </div>
        <p className="text-white/40 text-xs font-medium uppercase tracking-tighter">Coming to all creators</p>
      </div>

      {/* Main Content Area */}
      <div className="flex items-center justify-center gap-16 w-full px-20 z-10">
        
        {/* Left Side: Copy */}
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <h1 className="text-7xl font-black text-white tracking-tighter leading-[0.85]">
              STOP <span className="text-emerald-500">CHASING</span><br />
              <span className="text-white/40">PAYMENTS.</span>
            </h1>
            <p className="text-xl text-white/70 font-medium leading-relaxed max-w-md">
              The professional OS built specifically for creators. Manage deals, automate invoices, and secure every payout.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 rounded-[40px] premium-glass">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-3xl font-black text-white italic">84%</p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Faster Deals</p>
            </div>
            <div className="p-8 rounded-[40px] premium-glass">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                <IndianRupee className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-3xl font-black text-white italic">100%</p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Secure Pay</p>
            </div>
          </div>
        </div>

        {/* Right Side: Phone Mockup */}
        <div className="relative">
          {/* Decorative Rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[110%] border border-white/5 rounded-[100px] z-0" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[120%] border border-white/5 rounded-[120px] z-0" />

          {/* Phone Frame */}
          <div className="w-[420px] h-[860px] bg-[#0B1324] rounded-[64px] p-[16px] border-[12px] border-[#1E293B] shadow-[0_80px_160px_-40px_rgba(0,0,0,0.8)] relative overflow-hidden ring-1 ring-white/10 z-10 phone-frame-container">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#1E293B] rounded-b-3xl z-50" />
            
            {/* Content Container */}
            <div className="w-full h-full rounded-[48px] overflow-hidden bg-[#020D0A] relative insta-mockup-frame">
                <MobileDashboardDemo 
                  profile={mockProfile}
                  collabRequests={mockOffers}
                  brandDeals={mockDeals}
                  isLoadingProfile={false}
                  isLoadingDealsOverride={false}
                  isLoadingCollab={false}
                  profileViewsToday={1240}
                  isInline={true}
                  hideNavbar={true}
                />
            </div>
          </div>

          {/* Floating Element */}
          <div className="absolute -bottom-8 -left-24 p-6 rounded-[32px] bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 z-50 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">New Offer Received</p>
                <p className="text-3xl font-black italic tracking-tight">₹45,000.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-12 w-full text-center z-10">
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-[1px] w-12 bg-white/10" />
          <p className="text-white/20 text-xs font-black uppercase tracking-[0.4em]">
            Elite Creator OS
          </p>
          <div className="h-[1px] w-12 bg-white/10" />
        </div>
        <p className="text-white/40 text-sm font-bold tracking-tight">
          Join the waitlist at <span className="text-emerald-500">creatorarmour.com</span>
        </p>
      </div>
    </div>
  );
};

export default InstaMockup;
