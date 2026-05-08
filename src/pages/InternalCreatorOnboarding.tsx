import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Users, 
  IndianRupee, 
  Loader2,
  Video,
  Play,
  Search,
  UserPlus,
  Rocket,
  Wand2,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { scanChatScreenshot } from '@/lib/ai/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { getApiBaseUrl } from '@/lib/utils/api';

const CATEGORIES = [
  'General', 'Fashion', 'Beauty', 'Fitness', 'Tech', 'Food', 'Travel', 
  'Lifestyle', 'Gaming', 'Education', 'Finance', 'Health', 'Parenting'
];

const GENDER_OPTIONS = [
  '70% Female', '60% Female', '50% Male/Female', '60% Male', '70% Male', 'Over 80% Female', 'Over 80% Male'
];

const AGE_OPTIONS = [
  '13-17', '18-24', '25-34', '35-44', '45+', 'Mix (18-34)'
];

const TURNAROUND_OPTIONS = [
  '2 Days', '3 Days', '4 Days', '5 Days', '7 Days', '10 Days', '14 Days'
];

const RELIABILITY_OPTIONS = [
  '100%', '99%', '98%', '97%', '96%', '95%'
];

const LANGUAGE_OPTIONS = [
  'Hindi', 'English', 'Hindi / English', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi'
];

export default function InternalCreatorOnboarding() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isNewUserMode, setIsNewUserMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMagicScanning, setIsMagicScanning] = useState(false);

  // Auth fields for new user
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('CreatorArmour2026!');

  // Form State - Identity
  const [fullName, setFullName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [instaHandle, setInstaHandle] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  // Form State - Bio & Visuals
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Form State - Metrics
  const [followers, setFollowers] = useState('');
  const [avgViews, setAvgViews] = useState('');
  const [engagement, setEngagement] = useState('');

  // Form State - Audience
  const [genderSplit, setGenderSplit] = useState('70% Female');
  const [ageRange, setAgeRange] = useState('18-24');
  const [language, setLanguage] = useState('Hindi / English');
  const [topCities, setTopCities] = useState('Mumbai, Delhi, Bangalore');

  // Form State - Marketing Polish
  const [introLine, setIntroLine] = useState('');
  const [fitNote, setFitNote] = useState('');
  const [relevanceNote, setRelevanceNote] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState('');
  const [mediaKitUrl, setMediaKitUrl] = useState('');

  // Form State - Commercials
  const [turnaround, setTurnaround] = useState('4 Days');
  const [reliability, setReliability] = useState('98%');
  const [pastBrands, setPastBrands] = useState('');
  const [brandsCount, setBrandsCount] = useState('');
  const [baseRate, setBaseRate] = useState('');
  const [dealPref, setDealPref] = useState<'paid_only' | 'barter_only' | 'open_to_both'>('open_to_both');
  

  // Form State - Logistics & Payout
  const [payoutUpi, setPayoutUpi] = useState('');
  const [pincode, setPincode] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [vibes, setVibes] = useState('Aesthetic, Relatable');

  // Phase logic
  const isPhase1Complete = (isNewUserMode ? (newEmail && newUsername) : selectedUser) && instaHandle && baseRate;

  // Profile Strength & Tiering
  const profileStrength = (() => {
    let score = 0;
    if (isPhase1Complete) score += 40;
    if (category && fullName) score += 15;
    if (followers && avgViews) score += 15;
    if (genderSplit && ageRange) score += 10;
    if (introLine) score += 10;
    if (payoutUpi) score += 10;
    return score;
  })();

  const profileTier = (() => {
    if (profileStrength >= 95) return { label: 'Verified Partner', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    if (profileStrength >= 75) return { label: 'Premium Brand Ready', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
    if (profileStrength >= 50) return { label: 'Good Brand Ready', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    return { label: 'Basic Profile', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/20' };
  })();

  const aiSummary = (() => {
    if (!instaHandle || !category) return "Enter handle and category to generate summary...";
    const audience = genderSplit.includes('Female') ? 'female' : 'male';
    return `${category} creator @${instaHandle} focusing on ${audience} audiences with high product discovery potential.`;
  })();

  // Search for user
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['admin_search_users', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${searchTerm}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: searchTerm.length > 2
  });

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setFullName(user.full_name || '');
    setPhotoUrl(user.profile_photo || '');
    setInstaHandle(user.instagram_handle || '');
    setWhatsapp(user.whatsapp_number || '');
    setCategory(user.category || '');
    setLocation(user.location_city ? `${user.location_city}, ${user.location_state || ''}` : '');
    setIsVerified(user.is_verified || false);
    
    setTitle(user.bio || '');
    setVideoUrl(user.discovery_video_url || '');
    setFollowers(user.instagram_followers?.toString() || '');
    setAvgViews(user.performance_proof?.median_reel_views?.toString() || '');
    setEngagement(user.engagement_rate?.toString() || '');
    
    setGenderSplit(user.audience_gender_percent || user.audience_gender_split || '70% Female');
    setAgeRange(user.audience_age_range || '18-24');
    setLanguage(user.primary_audience_language || 'Hindi / English');
    setTopCities(Array.isArray(user.top_cities) ? user.top_cities.join(', ') : 'Mumbai, Delhi, Bangalore');
    
    setIntroLine(user.collab_intro_line || '');
    setFitNote(user.collab_audience_fit_note || '');
    setRelevanceNote(user.collab_audience_relevance_note || '');
    setPortfolioLinks(Array.isArray(user.portfolio_links) ? user.portfolio_links.join(', ') : '');
    setMediaKitUrl(user.media_kit_url || '');

    setTurnaround(user.collab_response_hours_override?.toString() ? `${user.collab_response_hours_override} Days` : '4 Days');
    setReliability(user.reliability_score?.toString() ? `${user.reliability_score}%` : '98%');
    setPastBrands(user.past_brands_text || '');
    setBrandsCount(user.collab_brands_count_override?.toString() || '');
    setBaseRate(user.avg_rate_reel?.toString() || '');
    setDealPref(user.collab_deal_preference || 'open_to_both');

    setPayoutUpi(user.payout_upi || user.bank_upi || '');
    setPincode(user.pincode || '');
    setShippingAddress(user.location || '');
    setVibes(Array.isArray(user.content_vibes) ? user.content_vibes.join(', ') : 'Aesthetic, Relatable');
    setSearchTerm('');
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      let targetUserId = selectedUser?.id;

      // 1. Create account if in New User mode
      if (isNewUserMode) {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${getApiBaseUrl()}/api/admin/users`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            email: newEmail,
            username: newUsername,
            password: newPassword,
            full_name: newUsername
          })
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
        targetUserId = result.user.id;
      }

      if (!targetUserId) throw new Error('No user selected');

      // Helper to map count to range ID
      const getFollowerRangeId = (count: number): string => {
        if (count < 1000) return '<1k';
        if (count < 10000) return '1k-10k';
        if (count < 50000) return '10k-50k';
        return '50k+';
      };

      const city = location.includes(',') ? location.split(',')[0]?.trim() : location.trim();
      const state = location.includes(',') ? location.split(',')[1]?.trim() : null;

      // 2. Update profile with Verification data
      const eliteData = {
        first_name: fullName.split(' ')[0] || '',
        last_name: fullName.split(' ').slice(1).join(' ') || '',
        avatar_url: photoUrl,
        instagram_handle: instaHandle,
        phone: whatsapp,
        location: shippingAddress || `${city}${state ? ', ' + state : ''}`,
        bio: title,
        discovery_video_url: videoUrl,
        instagram_followers: parseInt(followers) || 0,
        instagram_profile_photo: photoUrl,
        avg_rate_reel: parseInt(baseRate) || 0,
        
        audience_gender_split: genderSplit,
        audience_age_range: ageRange,
        primary_audience_language: language,
        top_cities: topCities.split(',').map(c => c.trim()).filter(Boolean),
        
        payout_upi: payoutUpi,
        content_vibes: vibes.split(',').map(v => v.trim()).filter(Boolean),
        avg_reel_views_manual: parseInt(avgViews) || 0,
        engagement_rate: parseFloat(engagement) || 0,
        collab_brands_count_override: parseInt(brandsCount) || 0,
        response_hours: turnaround.toLowerCase().includes('24') ? 24 : 
                        turnaround.toLowerCase().includes('48') ? 48 : 72,
        reliability_score: parseInt(reliability) || 98,
        past_brands: pastBrands.split(',').map(b => b.trim()).filter(Boolean),
        is_elite_verified: true,
        is_verified: true,
        onboarding_complete: true
      };

      // 2. Update profile with Elite data via Backend API (to bypass RLS and ensure logging)
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${getApiBaseUrl()}/api/admin/users/${targetUserId}/profile`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(eliteData)
      });

      const updateResult = await res.json();
      if (!updateResult.success) throw new Error(updateResult.error);
      
      // Close the loop with a DM template
      const dmTemplate = `Your Creator Armour profile is now live 🚀\n\nPreview: creatorarmour.app/${newUsername || selectedUser.username}\n\nBrands can now view your rates, send collaboration requests, and check audience insights instantly. Want to optimize your profile further for premium brand deals? 👀`;
      
      toast.success(
        <div className="space-y-3">
          <p className="font-bold">@${newUsername || selectedUser.username} is now Live! 🚀</p>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest h-8"
            onClick={() => {
              navigator.clipboard.writeText(dmTemplate);
              toast.success("DM Template copied! Send it to the creator.");
            }}
          >
            Copy DM Launch Message
          </Button>
        </div>,
        { duration: 10000 }
      );
      setSelectedUser(null);
      setIsNewUserMode(false);
      // Reset form
      setFullName(''); setPhotoUrl(''); setInstaHandle(''); setWhatsapp(''); setCategory(''); setLocation('');
      setTitle(''); setVideoUrl(''); setFollowers(''); setAvgViews(''); setEngagement('');
      setGenderSplit('70% Female'); setAgeRange('18-24'); setLanguage('Hindi / English'); setTopCities('Mumbai, Delhi, Bangalore');
      setIntroLine(''); setFitNote(''); setRelevanceNote('');
      setPortfolioLinks(''); setMediaKitUrl('');
      setTurnaround('4 Days'); setReliability('98%');
      setPastBrands(''); setBrandsCount(''); setBaseRate('');
      setPayoutUpi(''); setPincode(''); setShippingAddress('');
      setNewEmail(''); setNewUsername('');
    } catch (err: any) {
      toast.error(err.message || 'Launch failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsMagicScanning(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const data = await scanChatScreenshot(base64);
        
        // Auto-fill form fields
        if (data.full_name) setFullName(data.full_name);
        if (data.instagram_handle) setInstaHandle(data.instagram_handle);
        if (data.followers) setFollowers(data.followers.toString());
        if (data.avg_views) setAvgViews(data.avg_views.toString());
        if (data.engagement_rate) setEngagement(data.engagement_rate.toString());
        if (data.category) setCategory(data.category);
        if (data.location) setLocation(data.location);
        if (data.payout_upi) setPayoutUpi(data.payout_upi);
        if (data.pincode) setPincode(data.pincode);
        if (data.shipping_address) setShippingAddress(data.shipping_address);
        if (data.base_rate) setBaseRate(data.base_rate.toString());
        if (data.past_brands) setPastBrands(Array.isArray(data.past_brands) ? data.past_brands.join(', ') : data.past_brands);
        if (data.audience_language) setLanguage(data.audience_language);
        if (data.audience_gender_split) setGenderSplit(data.audience_gender_split);
        if (data.audience_age_range) setAgeRange(data.audience_age_range);
        if (data.intro_line) setIntroLine(data.intro_line);
        if (data.vibes) setVibes(data.vibes);
        
        toast.success("Magic Scan complete! Form updated. ✨");
      } catch (error) {
        toast.error("Magic Scan failed. Please fill manually.");
      } finally {
        setIsMagicScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#020D0A] text-slate-200 p-6 md:p-12">
      <div className="max-w-[1600px] mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tight">Profile Quick-Launcher</h1>
              <p className="text-xs text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Manual Creator Onboarding Tool</p>
            </div>
          </div>
        </div>
        
        {/* Magic AI Scanner */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex flex-col items-center p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
              <Wand2 className={cn("w-8 h-8 text-emerald-400", isMagicScanning && "animate-pulse")} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white italic uppercase tracking-tight">AI Magic Scan</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Upload Insta DM Screenshot to Auto-Fill Form</p>
            </div>
            
            <label className="cursor-pointer">
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleMagicScan}
                disabled={isMagicScanning}
              />
              <div className={cn(
                "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3",
                isMagicScanning 
                  ? "bg-slate-800 text-slate-500" 
                  : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
              )}>
                {isMagicScanning ? (
                  <>Scanning... <Loader2 className="w-4 h-4 animate-spin" /></>
                ) : (
                  <>Upload Screenshot <ImageIcon className="w-4 h-4" /></>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Search or Create Toggle */}
        <div className="flex gap-4">
          <button 
            onClick={() => { setIsNewUserMode(false); setSelectedUser(null); }}
            className={cn(
              "flex-1 p-6 rounded-[2rem] border transition-all flex items-center justify-center gap-3",
              !isNewUserMode ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-slate-500"
            )}
          >
            <Search className="w-6 h-6" />
            <span className="font-black uppercase tracking-widest text-sm">Find Existing</span>
          </button>
          <button 
            onClick={() => { setIsNewUserMode(true); setSelectedUser(null); }}
            className={cn(
              "flex-1 p-6 rounded-[2rem] border transition-all flex items-center justify-center gap-3",
              isNewUserMode ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-slate-500"
            )}
          >
            <UserPlus className="w-6 h-6" />
            <span className="font-black uppercase tracking-widest text-sm">Create From Scratch</span>
          </button>
        </div>

        {/* User Selection UI */}
        {!isNewUserMode ? (
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500/5 blur-2xl group-focus-within:bg-emerald-500/10 transition-all rounded-[2rem]" />
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              <Input 
                placeholder="Search by username or email to begin setup..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-20 pl-16 pr-6 bg-white/5 border-white/10 rounded-[2rem] text-xl font-bold text-white focus:bg-white/10 focus:border-emerald-500/50 transition-all shadow-none outline-none"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchResults && searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-24 left-0 right-0 z-50 bg-slate-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
              >
                {(searchResults as any[])?.map((user: any) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full p-6 flex items-center gap-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-sm font-black">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold">@{user.username}</p>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <UserPlus className="ml-auto w-5 h-5 text-emerald-500" />
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ) : null}

        {/* Launch Form */}
        {(selectedUser || isNewUserMode) ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 space-y-12"
          >
            {/* Header Area */}
            <div className="flex items-center justify-between">
              {isNewUserMode ? (
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-blue-500/5 border border-blue-500/20 w-fit">
                  <UserPlus className="w-6 h-6 text-blue-400" />
                  <p className="text-blue-400 font-black italic uppercase tracking-widest text-sm">Building New Creator Identity</p>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/20 w-fit">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black">
                    {selectedUser.username?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-emerald-400 font-black italic uppercase tracking-widest text-sm">Configuring @{selectedUser.username}</p>
                </div>
              )}
            </div>

            <div className="space-y-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2 bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-sm">1</div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                      {isPhase1Complete ? "Phase 1 Ready! 🚀" : "Phase 1: Tiny Commitment"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 pl-11">
                    <div className={cn("px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all shadow-sm", profileTier.bg, profileTier.color, profileTier.border)}>
                      {profileTier.label}
                    </div>
                    <div className="flex-1 h-1.5 w-32 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${profileStrength}%` }}
                        className={cn("h-full transition-all duration-500", 
                          profileStrength > 80 ? "bg-amber-400" : 
                          profileStrength > 50 ? "bg-blue-400" : "bg-slate-500"
                        )}
                      />
                    </div>
                    <span className="text-[9px] font-black text-slate-500">{profileStrength}%</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    isPhase1Complete ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-white/5 border-white/10 text-slate-500"
                  )}>
                    {isPhase1Complete ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-slate-700" />}
                    Phase 1: Core
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] transition-all",
                    isPhase1Complete ? "bg-white/5 border-white/10 text-emerald-500" : "bg-white/5 border-white/10 text-slate-500"
                  )}>
                    <div className="w-2 h-2 rounded-full bg-current" />
                    Phase 2: Profile Polish
                  </div>
                </div>
              </div>

              {/* Phase 1: Quick Start Essentials Card */}
              <div className="p-10 rounded-[3rem] bg-white/[0.03] border border-white/10 shadow-2xl space-y-10">
                <div className="flex items-center gap-4">
                  <Rocket className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-xl font-black text-white italic uppercase tracking-widest">Quick Start Essentials</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Account Credentials (Only if New User) */}
                  {isNewUserMode && (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Assigned Email</Label>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Phase 1</span>
                        </div>
                        <Input 
                          value={newEmail}
                          onChange={e => setNewEmail(e.target.value)}
                          placeholder="creator@example.com"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-blue-400">Profile Username</Label>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">Phase 1</span>
                        </div>
                        <Input 
                          value={newUsername}
                          onChange={e => setNewUsername(e.target.value)}
                          placeholder="e.g. salmaan"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Insta @Handle</Label>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Phase 1</span>
                    </div>
                    <Input 
                      value={instaHandle}
                      onChange={e => setInstaHandle(e.target.value)}
                      placeholder="e.g. salmaan_official"
                      className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Reel Rate (₹)</Label>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Phase 1</span>
                    </div>
                    <Input 
                      type="number"
                      value={baseRate}
                      onChange={e => setBaseRate(e.target.value)}
                      placeholder="e.g. 15000"
                      className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Deal Preference</Label>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Phase 1</span>
                    </div>
                    <div className="flex gap-2 p-1 bg-black/20 border border-white/10 rounded-2xl h-14">
                      {[
                        { id: 'paid_only', label: 'Paid' },
                        { id: 'barter_only', label: 'Barter' },
                        { id: 'open_to_both', label: 'Both' }
                      ].map(option => (
                        <button
                          key={option.id}
                          onClick={() => setDealPref(option.id as any)}
                          className={cn(
                            "flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            dealPref === option.id ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-white"
                          )}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 px-2">
                <div className="h-px bg-white/10 flex-1" />
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 font-black text-xs border border-white/5">2</div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Phase 2: Optional Optimization</p>
                </div>
                <div className="h-px bg-white/10 flex-1" />
              </div>

              {/* AI Summary Preview Card */}
              <AnimatePresence>
                {instaHandle && category && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-6"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                      <Wand2 className="w-6 h-6 text-blue-400 animate-pulse" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/60">Live AI Hook</p>
                      <p className="text-sm font-bold text-blue-100 italic">"{aiSummary}"</p>
                    </div>
                    <div className="hidden md:block px-4 py-2 bg-blue-500/20 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-widest">
                      Auto-Generated
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start pb-32">
                {/* Left Column: Identity & Visuals */}
                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">Identity & Niche</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Creator Full Name</Label>
                        <Input 
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="e.g. Salmaan Khan"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white"
                        />
                      </div>
                      <div className="space-y-4 opacity-50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 italic">Insta @Handle (Moved Up)</Label>
                        <Input 
                          disabled
                          value={instaHandle}
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">WhatsApp Business</Label>
                        <Input 
                          value={whatsapp}
                          onChange={e => setWhatsapp(e.target.value)}
                          placeholder="+91 9988776655"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                          <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                            {CATEGORIES.map(cat => (
                              <SelectItem key={cat} value={cat} className="focus:bg-emerald-500/20 focus:text-white rounded-xl">
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Location (City, State)</Label>
                        <Input 
                          value={location}
                          onChange={e => setLocation(e.target.value)}
                          placeholder="Mumbai, Maharashtra"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white"
                        />
                      </div>
                      <div className="flex flex-col justify-center gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-emerald-500 ml-1">Verified Status</Label>
                        <button 
                          type="button"
                          onClick={() => setIsVerified(!isVerified)}
                          className={cn(
                            "h-14 rounded-2xl border transition-all font-black uppercase tracking-widest text-xs",
                            isVerified ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" : "bg-white/5 border-white/10 text-slate-600"
                          )}
                        >
                          {isVerified ? "✓ Verified Partner" : "Standard Profile"}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Profile Photo URL</Label>
                      <Input 
                        value={photoUrl}
                        onChange={e => setPhotoUrl(e.target.value)}
                        placeholder="https://.../photo.jpg"
                        className="h-14 bg-white/5 border-white/10 rounded-2xl text-white"
                      />
                    </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">Hero Visuals</p>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Professional Title (Hero Headline)</Label>
                      <Input 
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g. Minimalist Fashion Architect"
                        className="h-16 bg-white/5 border-white/10 rounded-2xl text-lg font-bold text-white focus:border-emerald-500/50"
                      />
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Discovery Reel (Direct Link)</Label>
                      <div className="relative">
                        <Video className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <Input 
                          value={videoUrl}
                          onChange={e => setVideoUrl(e.target.value)}
                          placeholder="https://.../reel.mp4"
                          className="h-16 pl-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-emerald-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle Column: Metrics & Audience */}
                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Followers</Label>
                        <Input 
                          type="number"
                          value={followers}
                          onChange={e => setFollowers(e.target.value)}
                          placeholder="25000"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold text-white"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Avg Views</Label>
                        <Input 
                          type="number"
                          value={avgViews}
                          onChange={e => setAvgViews(e.target.value)}
                          placeholder="45000"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold text-white"
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Eng. Rate (%)</Label>
                        <Input 
                          value={engagement}
                          onChange={e => setEngagement(e.target.value)}
                          placeholder="4.5"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Gender Split</Label>
                        <Select value={genderSplit} onValueChange={setGenderSplit}>
                          <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold text-white">
                            <SelectValue placeholder="Select Gender Split" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A1A16] border-white/10">
                            {GENDER_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt} className="text-white hover:bg-emerald-500 focus:bg-emerald-500">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Age Range</Label>
                        <Select value={ageRange} onValueChange={setAgeRange}>
                          <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold text-white">
                            <SelectValue placeholder="Select Age Range" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A1A16] border-white/10">
                            {AGE_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt} className="text-white hover:bg-emerald-500 focus:bg-emerald-500">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Audience Language</Label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold text-white">
                            <SelectValue placeholder="Select Language" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0A1A16] border-white/10">
                            {LANGUAGE_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt} className="text-white hover:bg-emerald-500 focus:bg-emerald-500">{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Top Cities (Comma Separated)</Label>
                        <Input 
                          value={topCities}
                          onChange={(e) => setTopCities(e.target.value)}
                          placeholder="Mumbai, Delhi, Bangalore"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-sm font-medium text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">Commercial Power</p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Past Brand Partners</Label>
                        <span className="text-[8px] font-bold text-slate-700 uppercase tracking-tighter">Comma Separated</span>
                      </div>
                      <Textarea 
                        value={pastBrands}
                        onChange={e => setPastBrands(e.target.value)}
                        placeholder="kbeauty, MARS, SWISS beauty, womancart, Mamaearth..."
                        className="min-h-[100px] bg-white/5 border-white/10 rounded-2xl text-white py-4 px-5 resize-none focus:border-emerald-500/30 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Turnaround (Days)</Label>
                        <Select value={turnaround} onValueChange={setTurnaround}>
                          <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white">
                            <SelectValue placeholder="Select Days" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                            {TURNAROUND_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt} className="focus:bg-emerald-500/20 focus:text-white rounded-xl">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Reliability (%)</Label>
                        <Select value={reliability} onValueChange={setReliability}>
                          <SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white">
                            <SelectValue placeholder="Select %" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 text-white rounded-2xl">
                            {RELIABILITY_OPTIONS.map(opt => (
                              <SelectItem key={opt} value={opt} className="focus:bg-emerald-500/20 focus:text-white rounded-xl">
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Brands Count</Label>
                        <Input 
                          type="number"
                          value={brandsCount}
                          onChange={e => setBrandsCount(e.target.value)}
                          placeholder="12"
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-lg font-bold text-white"
                        />
                      </div>
                      <div className="space-y-4 opacity-50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 italic">Reel Rate (Moved Up)</Label>
                        <Input 
                          disabled
                          value={baseRate}
                          className="h-14 bg-white/5 border-white/10 rounded-2xl text-white cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Elite Polish & Logistics (Sticky) */}
                  <div className="lg:sticky lg:top-8 space-y-8">
                    <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/50">Profile Polish & Control</p>
                      <div className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Intro / Hook Line</Label>
                          <Textarea 
                            value={introLine}
                            onChange={(e) => setIntroLine(e.target.value)}
                            placeholder="Lifestyle creator with clear package options for launches..."
                            className="h-20 bg-white/5 border-white/10 rounded-2xl text-sm font-medium text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Audience Fit Note</Label>
                            <Input 
                              value={fitNote}
                              onChange={(e) => setFitNote(e.target.value)}
                              placeholder="Works best for targeted..."
                              className="h-12 bg-white/5 border-white/10 rounded-xl text-xs font-medium text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Relevance Note</Label>
                            <Input 
                              value={relevanceNote}
                              onChange={(e) => setRelevanceNote(e.target.value)}
                              placeholder="Strong relevance for..."
                              className="h-12 bg-white/5 border-white/10 rounded-xl text-xs font-medium text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Portfolio Links (Comma Separated)</Label>
                            <Input 
                              value={portfolioLinks}
                              onChange={(e) => setPortfolioLinks(e.target.value)}
                              placeholder="https://instagram.com/reel/..."
                              className="h-12 bg-white/5 border-white/10 rounded-xl text-xs font-medium text-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Media Kit URL</Label>
                              <Input 
                                value={mediaKitUrl}
                                onChange={(e) => setMediaKitUrl(e.target.value)}
                                placeholder="https://canva.com/..."
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-xs font-medium text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Style Vibes</Label>
                              <Input 
                                value={vibes}
                                onChange={(e) => setVibes(e.target.value)}
                                placeholder="Aesthetic, Relatable, Fun"
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-xs font-medium text-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 opacity-50">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 italic">Deal Preference (Moved Up)</Label>
                      <Input 
                        disabled
                        value={dealPref}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl text-white cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Logistics & Payout</Label>
                      <div className="space-y-4 p-6 bg-white/5 border border-white/10 rounded-3xl">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">UPI ID for Payouts</Label>
                            <Input 
                              value={payoutUpi}
                              onChange={(e) => setPayoutUpi(e.target.value)}
                              placeholder="username@okaxis"
                              className="h-12 bg-white/5 border-white/10 rounded-xl text-xs font-medium text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Pincode</Label>
                            <Input 
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value)}
                              placeholder="400001"
                              className="h-12 bg-white/5 border-white/10 rounded-xl text-xs font-medium text-white"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Full Shipping Address</Label>
                          <Textarea 
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Flat, Building, Street, Area..."
                            className="h-20 bg-white/5 border-white/10 rounded-2xl text-sm font-medium text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Placeholder for spacing in the 3rd column */}
                    <div className="h-32" />
                  </div>
                


              </form>
            </div>

            {/* Floating Bottom Dock */}
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50"
            >
              <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.5)] flex items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <Search className="w-6 h-6" />
                </button>
                
                <Button 
                  onClick={handleLaunch}
                  disabled={isSubmitting}
                  className={cn(
                    "flex-1 h-16 rounded-2xl font-black italic text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center gap-4 border-none uppercase tracking-widest",
                    isPhase1Complete ? "bg-emerald-500 hover:bg-emerald-400 text-white" : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  )}
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      {isPhase1Complete ? "Launch Profile Page" : "Complete Phase 1"} <Sparkles className={cn("w-5 h-5", isPhase1Complete && "animate-pulse")} />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="py-12 space-y-12">
            {/* Quick Start Guide */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { 
                  step: "01", 
                  title: "Find or Create", 
                  desc: "Search for an existing user or build a new identity from scratch.",
                  icon: <Search className="w-5 h-5" />
                },
                { 
                  step: "02", 
                  title: "Configure Metrics", 
                  desc: "Enter verified engagement rates, views, and audience data.",
                  icon: <TrendingUp className="w-5 h-5" />
                },
                { 
                  step: "03", 
                  title: "Launch Storefront", 
                  desc: "One click to generate a premium, high-conversion profile page.",
                  icon: <Rocket className="w-5 h-5" />
                }
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col items-center text-center group hover:bg-white/[0.04] transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-[0.3em] mb-2">Step {item.step}</p>
                  <h3 className="text-sm font-black text-white uppercase tracking-widest mb-3">{item.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Elite Launch Tips */}
            <div className="max-w-2xl mx-auto p-10 rounded-[3rem] bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-4 mb-8 justify-center">
                <Sparkles className="w-6 h-6 text-emerald-500" />
                <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Launch Checklist</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {[
                  "Verify Instagram @handle accuracy",
                  "Include WhatsApp for direct brand access",
                  "Use high-quality Discovery Reel link",
                  "Double-check Engagement Rate (%)",
                  "List at least 3 premium past brands",
                  "Set realistic turnaround time"
                ].map((tip, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-slate-400">{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center pt-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Awaiting Command...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
