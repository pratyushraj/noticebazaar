import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  Users, 
  IndianRupee, 
  Check,
  Loader2,
  Video,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface VerifiedSetupModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const VerifiedSetupModal: React.FC<VerifiedSetupModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for elite fields
  const [title, setTitle] = useState(user.bio || '');
  const [videoUrl, setVideoUrl] = useState(user.discovery_video_url || '');
  const [followers, setFollowers] = useState(user.instagram_followers?.toString() || '');
  const [avgViews, setAvgViews] = useState(user.performance_proof?.median_reel_views?.toString() || '');
  const [brandsCount, setBrandsCount] = useState(user.collab_brands_count_override?.toString() || '');
  const [baseRate, setBaseRate] = useState(user.avg_rate_reel?.toString() || '');
  const [dealPref, setDealPref] = useState<'paid_only' | 'barter_only' | 'open_to_both'>(user.collab_deal_preference || 'open_to_both');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const verifiedData = {
        bio: title,
        discovery_video_url: videoUrl,
        instagram_followers: parseInt(followers) || 0,
        performance_proof: {
          ...user.performance_proof,
          median_reel_views: parseInt(avgViews) || 0,
          captured_at: new Date().toISOString()
        },
        collab_brands_count_override: parseInt(brandsCount) || 0,
        avg_rate_reel: parseInt(baseRate) || 0,
        collab_deal_preference: dealPref,
        onboarding_complete: true // Mark as complete when admin sets it up
      };
      
      await onSave(verifiedData);
      toast.success('Profile Configured! ✨');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-[#020D0A] border border-white/10 rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Verified Profile Setup</h2>
              <p className="text-xs text-emerald-400/60 font-black uppercase tracking-widest mt-1">Configuring @{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar">
          <form id="verified-setup-form" onSubmit={handleSubmit} className="space-y-10">
            
            {/* Visual Identity Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/60">
                <Video className="w-3 h-3" /> Visual Identity
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 ml-1">Professional Title</Label>
                  <Input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Minimalist Fashion Architect"
                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 ml-1">Discovery Reel URL</Label>
                  <Input 
                    value={videoUrl}
                    onChange={e => setVideoUrl(e.target.value)}
                    placeholder="Direct MP4 link"
                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-emerald-500/50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Performance Metrics Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/60">
                <TrendingUp className="w-3 h-3" /> Performance Metrics
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 ml-1">Followers</Label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input 
                      type="number"
                      value={followers}
                      onChange={e => setFollowers(e.target.value)}
                      placeholder="25000"
                      className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 ml-1">Avg Views / Reel</Label>
                  <div className="relative">
                    <Play className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input 
                      type="number"
                      value={avgViews}
                      onChange={e => setAvgViews(e.target.value)}
                      placeholder="45000"
                      className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 ml-1">Brands Count</Label>
                  <div className="relative">
                    <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input 
                      type="number"
                      value={brandsCount}
                      onChange={e => setBrandsCount(e.target.value)}
                      placeholder="12"
                      className="h-14 pl-12 bg-white/5 border-white/10 rounded-2xl text-white focus:border-emerald-500/50 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Commercial Terms Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/60">
                <IndianRupee className="w-3 h-3" /> Commercial Terms
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 ml-1">Starting Rate (₹)</Label>
                  <Input 
                    type="number"
                    value={baseRate}
                    onChange={e => setBaseRate(e.target.value)}
                    placeholder="8500"
                    className="h-14 bg-white/5 border-white/10 rounded-2xl text-white focus:border-emerald-500/50 transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-slate-400 ml-1">Deal Preference</Label>
                  <div className="flex gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl">
                    {[
                      { id: 'paid_only', label: 'Paid' },
                      { id: 'barter_only', label: 'Barter' },
                      { id: 'open_to_both', label: 'Both' }
                    ].map(pref => (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setDealPref(pref.id as any)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          dealPref === pref.id 
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                            : "text-slate-500 hover:text-slate-300"
                        )}
                      >
                        {pref.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-end gap-4">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-2xl h-14 px-8 text-slate-400 hover:text-white font-bold"
          >
            Cancel
          </Button>
          <Button 
            form="verified-setup-form"
            disabled={isSubmitting}
            className="rounded-[1.5rem] h-14 px-10 bg-emerald-500 hover:bg-emerald-400 text-white font-black italic text-lg shadow-xl shadow-emerald-500/20"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Launch Verified Profile'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
