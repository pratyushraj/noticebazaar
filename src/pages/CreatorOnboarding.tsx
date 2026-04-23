"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  Check, 
  Instagram, 
  Link2, 
  Loader2, 
  Zap, 
  Sparkles, 
  IndianRupee, 
  Video, 
  Bell, 
  ArrowRight,
  Upload,
  Play,
  X,
  Users,
  ShieldCheck,
  MapPin,
  CreditCard,
  Target,
  PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { fetchInstagramStats } from '@/lib/utils/socialStats';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { OnboardingContainer } from '@/components/onboarding/OnboardingContainer';
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { CREATOR_ASSETS_BUCKET } from '@/lib/constants/storage';

type OnboardingStep = 'identity' | 'collab' | 'videoSuccess' | 'profile' | 'payout' | 'notifications' | 'finalizing';

const NICHES = [
  { id: 'beauty', label: 'Beauty', icon: '💄' },
  { id: 'fashion', label: 'Fashion', icon: '👗' },
  { id: 'lifestyle', label: 'Lifestyle', icon: '🏠' },
  { id: 'tech', label: 'Tech & Gadgets', icon: '💻' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'food', label: 'Food', icon: '🍳' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'education', label: 'Education', icon: '📚' }
];

const FOLLOWER_RANGES = [
  { id: '<1k', label: '<1k' },
  { id: '1k-10k', label: '1k–10k' },
  { id: '10k-50k', label: '10k–50k' },
  { id: '50k+', label: '50k+' }
];

const STEP_ORDER: OnboardingStep[] = ['identity', 'collab', 'profile', 'payout', 'notifications'];

export default function CreatorOnboarding() {
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const { enableNotifications } = useDealAlertNotifications();

  const [step, setStep] = useState<OnboardingStep>('identity');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
  const [instagramHandle, setInstagramHandle] = useState('');
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [followerCount, setFollowerCount] = useState<string>('');
  const [creatorTitle, setCreatorTitle] = useState('');
  const [topCities, setTopCities] = useState('');
  const [bio, setBio] = useState('');
  
  const [baseRate, setBaseRate] = useState<string>('');
  const [contentVibes, setContentVibes] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const [instagramLink, setInstagramLink] = useState('');
  
  const [upiId, setUpiId] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const videoInputRef = useRef<HTMLInputElement>(null);

  // Current Step Index for progress
  const currentStepIndex = useMemo(() => {
    const logicalStep = step === 'videoSuccess' ? 'collab' : step;
    const idx = STEP_ORDER.indexOf(logicalStep as any);
    return idx === -1 ? 0 : idx;
  }, [step]);

  // Auto-fill from profile/metadata
  useEffect(() => {
    if (profile?.instagram_handle && !instagramHandle) {
      setInstagramHandle(profile.instagram_handle.replace(/^@+/, ''));
    }
    if (profile?.content_niches?.length && selectedNiches.length === 0) {
      setSelectedNiches(profile.content_niches);
    }
    if (profile?.avg_rate_reel && !baseRate) {
      setBaseRate(profile.avg_rate_reel.toString());
    }
    if (profile?.bio && !bio) {
      setBio(profile.bio);
    }
    if (profile?.payout_upi && !upiId) {
      setUpiId(profile.payout_upi);
    }
    if (profile?.location && !shippingAddress) {
      const parts = profile.location.split(',').map(p => p.trim());
      const pincodeMatch = profile.location.match(/\b\d{6}\b/);
      if (pincodeMatch) {
        setPincode(pincodeMatch[0]);
        setShippingAddress(profile.location.replace(pincodeMatch[0], '').replace(/,\s*,/g, ',').replace(/^,\s*|,\s*$/g, '').trim());
      } else {
        setShippingAddress(profile.location);
      }
    }
  }, [profile, instagramHandle, selectedNiches, baseRate, bio, upiId, shippingAddress]);

  // Helper to map count to range ID
  const getFollowerRangeId = (count: number): string => {
    if (count < 1000) return '<1k';
    if (count < 10000) return '1k-10k';
    if (count < 50000) return '10k-50k';
    return '50k+';
  };

  // Auto-fetch followers when handle changes
  useEffect(() => {
    const cleanHandle = instagramHandle.replace(/^@+/, '').trim();
    if (!cleanHandle || cleanHandle.length < 3) return;
    
    const timer = setTimeout(async () => {
      try {
        setIsSyncing(true);
        const stats = await fetchInstagramStats(cleanHandle);
        if (stats.followers) {
          setFollowerCount(String(stats.followers));
        }
      } catch (err) {
        console.warn('Auto-fetch failed', err);
      } finally {
        setIsSyncing(false);
      }
    }, 1200); // 1.2s debounce
    
    return () => clearTimeout(timer);
  }, [instagramHandle]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!profile || profile.role !== 'creator') {
      navigate('/login', { replace: true });
      return;
    }
    if (profile.onboarding_complete) {
      navigate('/creator-dashboard', { replace: true });
      return;
    }
  }, [sessionLoading, profile, navigate]);

  const handleNext = async () => {
    if (step === 'identity') {
      if (instagramHandle.length < 3) {
        toast.error('Please enter your Instagram username');
        return;
      }
      if (!followerRange) {
        toast.error('Please select your follower count');
        return;
      }
      if (selectedNiches.length === 0) {
        toast.error('Please select at least one niche');
        return;
      }
      setStep('collab');
    } else if (step === 'collab') {
      if (!videoUrl) {
        toast.error('Please upload your discovery reel');
        return;
      }
      if (!baseRate || isNaN(Number(baseRate))) {
        toast.error('Please set your collab rate');
        return;
      }
      setStep('videoSuccess');
    } else if (step === 'profile') {
      setStep('payout');
    } else if (step === 'payout') {
      if (!upiId) {
        toast.error('Please enter your UPI ID for payments');
        return;
      }
      if (shippingAddress && !pincode) {
        toast.error('Please enter your pincode');
        return;
      }
      if (pincode && !/^\d{6}$/.test(pincode)) {
        toast.error('Please enter a valid 6-digit pincode');
        return;
      }
      setStep('notifications');
    }
  };

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please upload a video file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video too large. Please upload under 50MB');
      return;
    }

    setVideoFile(file);
    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(20);
      const fileExt = file.name.split('.').pop();
      const fileName = `portfolio-${Date.now()}.${fileExt}`;
      const filePath = `${profile?.id}/videos/${fileName}`;

      const { data, error } = await supabase.storage
        .from(CREATOR_ASSETS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(CREATOR_ASSETS_BUCKET)
        .getPublicUrl(filePath);

      setVideoUrl(publicUrl);
      setUploadProgress(100);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
      setVideoFile(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const cleanHandle = instagramHandle.replace(/^@+/, '').trim().toLowerCase();
      
      const portfolioItems: any[] = [];
      
      if (videoUrl) {
        portfolioItems.push({
          id: crypto.randomUUID(),
          sourceUrl: videoUrl,
          mediaType: 'video',
          title: 'Primary Reel',
          platform: 'internal'
        });
      }

      if (instagramLink) {
        portfolioItems.push({
          id: crypto.randomUUID(),
          sourceUrl: instagramLink,
          mediaType: 'link',
          title: 'Instagram Reference',
          platform: 'instagram'
        });
      }

      await updateProfileMutation.mutateAsync({
        id: profile!.id,
        instagram_handle: cleanHandle,
        username: cleanHandle,
        content_niches: selectedNiches,
        avg_rate_reel: Number(baseRate),
        reel_price: Number(baseRate),
        discovery_video_url: videoUrl,
        instagram_followers: Number(followerCount) || 0,
        follower_count_range: getFollowerRangeId(Number(followerCount)),
        bio: creatorTitle || null,
        collab_region_label: creatorTitle || null,
        top_cities: topCities.split(',').map(c => c.trim()).filter(Boolean),
        content_vibes: contentVibes,
        payout_upi: upiId || null,
        location: shippingAddress ? `${shippingAddress}${pincode ? ', ' + pincode : ''}` : null,
        collab_past_work_items: portfolioItems,
        onboarding_complete: true,
        open_to_collabs: true,
      } as any);

      await refetchProfile?.();
      toast.success('Onboarding complete!');
      navigate('/creator-link-ready', { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNiche = (id: string) => {
    setSelectedNiches(prev => {
      if (prev.includes(id)) return prev.filter(n => n !== id);
      if (prev.length >= 3) {
        toast.error('Please select up to 3 niches');
        return prev;
      }
      return [...prev, id];
    });
  };

  if (sessionLoading || !profile) {
    return (
      <OnboardingContainer theme="light">
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OnboardingContainer>
    );
  }

  return (
    <OnboardingContainer theme="light" allowScroll>
      <div className="mx-auto w-full max-w-xl flex-1 flex flex-col pt-6 pb-20 px-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === currentStepIndex ? "w-8 bg-primary" : (i < currentStepIndex ? "w-4 bg-primary/40" : "w-4 bg-slate-100")
                )} 
              />
            ))}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Step {currentStepIndex + 1} of 5</span>
        </div>

        <AnimatePresence mode="wait">
          {step === 'identity' && (
            <OnboardingSlide key="identity" slideKey="identity">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">💸 Start earning from brand deals</h1>
                <p className="text-emerald-600 font-bold text-xs bg-emerald-50 py-1.5 px-4 rounded-full inline-block tracking-tight">Top creators earned ₹31,000 this month</p>
              </div>

              <div className="w-full space-y-6 text-left">
                {/* Creator Title */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Professional Title</span>
                    <span className="text-primary tracking-normal">e.g. Travel Vlogger</span>
                  </Label>
                  <Input 
                    value={creatorTitle}
                    onChange={e => setCreatorTitle(e.target.value)}
                    placeholder="e.g. Tech Enthusiast & Reviewer"
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-lg font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                </div>

                {/* Instagram Field */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Instagram Username</span>
                    <span className="text-primary tracking-normal">Match with brands</span>
                  </Label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">@</div>
                    <Input 
                      value={instagramHandle}
                      onChange={e => setInstagramHandle(e.target.value)}
                      placeholder="e.g. wowvidushi"
                      className="h-14 pl-12 rounded-2xl border-2 border-slate-100 bg-slate-50 text-lg font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                    />
                  </div>
                </div>

                {/* Follower Count */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Number of Followers</span>
                    <span className="text-primary tracking-normal">Enter exact count</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">
                      <Users className="w-5 h-5" />
                    </div>
                    <Input 
                      type="number"
                      value={followerCount}
                      onChange={e => setFollowerCount(e.target.value)}
                      placeholder="e.g. 15400"
                      className="h-14 pl-12 rounded-2xl border-2 border-slate-100 bg-slate-50 text-lg font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                    />
                    {isSyncing && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">Syncing...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Niche Selection */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 flex justify-between">
                    <span>Choose your niche (max 3)</span>
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {NICHES.map(niche => (
                      <motion.button
                        key={niche.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleNiche(niche.id)}
                        className={cn(
                          "h-14 rounded-xl border-2 flex flex-col items-center justify-center transition-all text-[10px] font-black uppercase tracking-tighter",
                          selectedNiches.includes(niche.id) 
                            ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                            : "bg-white border-slate-100 text-slate-400"
                        )}
                      >
                        <span className="text-lg mb-0.5">{niche.icon}</span>
                        {niche.label}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Bio Field */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Content Vibe / Bio (One line)</Label>
                  <Input 
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="e.g. Creating viral lifestyle content for Gen-Z"
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                </div>

                {/* Top Cities */}
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Audience Top Cities (Comma separated)</Label>
                  <Input 
                    value={topCities}
                    onChange={e => setTopCities(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Bangalore"
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-sm font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                </div>
              </div>

              <div className="mt-auto pt-10 w-full space-y-4">
                <Button 
                  onClick={handleNext}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                >
                  Continue <span className="text-primary">→</span> Find brand deals
                </Button>
                <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  No spam • Only brand collaborations
                </div>
              </div>
            </OnboardingSlide>
          )}

          {step === 'collab' && (
            <OnboardingSlide key="collab" slideKey="collab">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">🚀 Build your Collab Page</h1>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Discovery video + Collaboration Rate</p>
              </div>

              <div className="w-full space-y-8">
                {/* Video Upload Section */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 block text-left">Primary Discovery Reel</Label>
                  <input 
                    type="file" 
                    ref={videoInputRef} 
                    onChange={handleVideoChange} 
                    accept="video/*" 
                    className="hidden" 
                  />
                  
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploading}
                    className={cn(
                      "w-full h-56 rounded-[2.5rem] border-4 border-dashed flex flex-col items-center justify-center gap-4 transition-all relative overflow-hidden",
                      isUploading ? "bg-slate-50 border-slate-200" : (videoUrl ? "border-emerald-500/20 bg-emerald-50/10" : "bg-primary/5 border-primary/20 hover:border-primary/40")
                    )}
                  >
                    {isUploading ? (
                      <div className="space-y-3 text-center z-10">
                        <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                        <p className="text-[10px] font-black italic text-slate-900 uppercase tracking-widest">Uploading...</p>
                      </div>
                    ) : videoUrl ? (
                      <div className="relative w-full h-full">
                        <video src={videoUrl} className="w-full h-full object-cover" muted playsInline />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest">Change Video</div>
                      </div>
                    ) : (
                      <>
                        <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                          <Upload className="w-7 h-7" />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-black italic text-slate-900 uppercase">Tap to upload reel</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">MP4 • Max 60sec • 50MB</p>
                        </div>
                      </>
                    )}
                  </button>
                </div>

                {/* Pricing Section */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 block text-left">Your Starting Rate (per Reel)</Label>
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black italic text-slate-400">₹</div>
                    <Input 
                      type="number"
                      value={baseRate}
                      onChange={e => setBaseRate(e.target.value)}
                      placeholder="5,000"
                      className="h-20 pl-14 text-3xl font-black italic bg-slate-50 border-2 border-slate-100 rounded-3xl text-slate-900 focus:bg-white focus:border-primary transition-all shadow-none"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {['2000', '5000', '10000'].map(val => (
                      <button
                        key={val}
                        onClick={() => setBaseRate(val)}
                        className={cn(
                          "h-10 rounded-xl border-2 font-black italic text-xs transition-all",
                          baseRate === val ? "bg-primary border-primary text-white" : "bg-white border-slate-100 text-slate-400"
                        )}
                      >
                        ₹{Number(val).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-10 w-full">
                <Button 
                  onClick={handleNext}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all"
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'videoSuccess' && (
            <OnboardingSlide key="videoSuccess" slideKey="videoSuccess">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 mx-auto">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                  <Check className="w-12 h-12 text-emerald-600" />
                </motion.div>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">🔥 Looks Great!</h1>
              <p className="text-slate-600 font-medium mb-10 text-sm">Your Collab Page is live in the discovery feed.</p>

              <div className="w-[200px] aspect-[9/16] mx-auto rounded-3xl bg-slate-100 overflow-hidden relative shadow-2xl border-4 border-white mb-10">
                {videoUrl && <video src={videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />}
              </div>

              <div className="mt-auto pt-10 w-full">
                <Button 
                  onClick={() => setStep('profile')}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all"
                >
                  Amazing, Next <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'profile' && (
            <OnboardingSlide key="profile" slideKey="profile">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                <PenTool className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">Complete your profile</h1>
              <p className="text-slate-600 font-medium mb-10 text-sm italic">Add links to boost your brand trust.</p>

              <div className="w-full space-y-6 text-left">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Top Audience Cities</Label>
                  <Input 
                    value={topCities}
                    onChange={e => setTopCities(e.target.value)}
                    placeholder="e.g. Mumbai, Delhi, Bangalore"
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-semibold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                  <p className="text-[10px] text-slate-400 px-1">Comma separated list of cities where your audience is from.</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Content Vibes (Max 3)</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Aesthetic', icon: '✨' },
                      { label: 'Relatable', icon: '🤝' },
                      { label: 'Informative', icon: '💡' },
                      { label: 'High Energy', icon: '⚡' },
                      { label: 'Minimalist', icon: '⚪' },
                      { label: 'Luxury', icon: '💎' }
                    ].map((vibe) => {
                      const isSelected = contentVibes.includes(vibe.label);
                      return (
                        <button
                          key={vibe.label}
                          type="button"
                          onClick={() => {
                            if (isSelected) setContentVibes(contentVibes.filter(v => v !== vibe.label));
                            else if (contentVibes.length < 3) setContentVibes([...contentVibes, vibe.label]);
                            else toast.error('Choose max 3 vibes');
                          }}
                          className={cn(
                            "px-4 py-2.5 rounded-xl text-[11px] font-black tracking-tight border flex items-center gap-2 transition-all",
                            isSelected 
                              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                              : "bg-white border-slate-100 text-slate-500"
                          )}
                        >
                          <span>{vibe.icon}</span>
                          {vibe.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2.5 pt-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Reference Reel/Post Link</Label>
                  <Input 
                    value={instagramLink}
                    onChange={e => setInstagramLink(e.target.value)}
                    placeholder="https://www.instagram.com/p/..."
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-semibold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                </div>
              </div>

              <div className="mt-auto pt-10 w-full space-y-4">
                <Button 
                  onClick={handleNext}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all"
                >
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <button onClick={() => setStep('payout')} className="w-full text-slate-400 font-black uppercase tracking-widest text-[10px] py-2">
                  Skip for now
                </button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'payout' && (
            <OnboardingSlide key="payout" slideKey="payout">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6 mx-auto">
                <CreditCard className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2 italic">Payment & Logistics</h1>
              <p className="text-slate-600 font-medium mb-10 text-sm italic">So brands can pay you and ship products.</p>

              <div className="w-full space-y-6 text-left">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Your UPI ID (For Earnings)</Label>
                  <div className="relative">
                    <Input 
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="e.g. name@okhdfcbank"
                      className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Delivery Address (For PR Packages)</Label>
                  <Textarea 
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Building, Street, Area..."
                    className="min-h-[80px] p-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-semibold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none resize-none"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Pincode</Label>
                  <Input 
                    value={pincode}
                    onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit Pincode"
                    className="h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-900 focus:border-primary focus:bg-white transition-all shadow-none"
                  />
                </div>
              </div>

              <div className="mt-auto pt-10 w-full">
                <Button 
                  onClick={handleNext}
                  className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black italic text-lg shadow-xl shadow-slate-200 active:scale-95 transition-all"
                >
                  Save & Continue <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </OnboardingSlide>
          )}

          {step === 'notifications' && (
            <OnboardingSlide key="notifications" slideKey="notifications">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-8 mx-auto">
                <Bell className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-4 italic">Never miss a deal</h1>
              <p className="text-slate-600 font-medium mb-12">Enable alerts to get notified instantly when a brand makes you an offer.</p>

              <div className="w-full p-6 rounded-3xl border-2 border-slate-100 bg-white shadow-sm text-left mb-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Preview Notification</p>
                    <p className="font-bold text-slate-900">New Offer from Mellow Prints! 🚀</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 font-medium">You have received a new collaboration request for ₹5,000.</p>
              </div>

              <div className="mt-auto pt-12 w-full space-y-4">
                <Button 
                  onClick={async () => {
                    await enableNotifications();
                    handleFinish();
                  }}
                  disabled={isSubmitting}
                  className="w-full h-16 rounded-2xl bg-primary text-white font-black italic text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Enable & Finish"}
                </Button>
                <button 
                  onClick={handleFinish}
                  disabled={isSubmitting}
                  className="w-full text-slate-400 font-bold text-sm py-2"
                >
                  Skip for now
                </button>
              </div>
            </OnboardingSlide>
          )}
        </AnimatePresence>
      </div>
    </OnboardingContainer>
  );
}
