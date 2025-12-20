import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Instagram, Youtube, Twitter, Globe, Edit, Lock, CreditCard, Shield, HelpCircle, FileText, LogOut, ChevronRight, Check, X, Download, Trash2, Star, TrendingUp, Award, MessageCircle, Loader2, Sparkles } from 'lucide-react';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useSignOut } from '@/lib/hooks/useAuth';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils/avatar';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const updateProfileMutation = useUpdateProfile();
  const signOutMutation = useSignOut();
  const [activeSection, setActiveSection] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Fetch real data for stats
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  const { data: partnerStats } = usePartnerStats(profile?.id);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    email: "",
    phone: "+91 ",
    location: "",
    bio: ""
  });

  // Load user data from session
  useEffect(() => {
    if (profile && user) {
      // Ensure phone starts with +91
      let phoneValue = profile.phone || '';
      if (phoneValue && !phoneValue.startsWith('+91')) {
        // If phone exists but doesn't start with +91, prepend it
        phoneValue = phoneValue.startsWith('+') ? phoneValue : `+91 ${phoneValue}`;
      } else if (!phoneValue) {
        phoneValue = '+91 ';
      }
      
      setFormData({
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator',
        displayName: profile.instagram_handle?.replace('@', '') || user.email?.split('@')[0] || 'creator',
        email: user.email || '',
        phone: phoneValue,
        location: profile.location || '',
        bio: profile.bio || ''
      });
    }
  }, [profile, user]);

  // Calculate real stats from brand deals
  const calculatedStats = useMemo(() => {
    const totalDeals = brandDeals.length;
    const totalEarnings = brandDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    const activeDeals = brandDeals.filter(deal => 
      deal.status !== 'Completed' && deal.status !== 'Drafting'
    ).length;
    const protectionScore = 85; // TODO: Calculate from content protection data
      const streak = (partnerStats as any)?.streak_days ? Math.floor((partnerStats as any).streak_days / 7) : 0;

    return {
      totalDeals,
      totalEarnings,
      activeDeals,
      protectionScore,
      streak
    };
  }, [brandDeals, partnerStats]);

  // Build platforms array from actual profile data
  const platforms = useMemo(() => {
    const platformList = [];
    
    if (profile?.youtube_channel_id) {
      const followers = profile.youtube_subs || 0;
      platformList.push({
        name: "YouTube",
        handle: profile.youtube_channel_id,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: true,
        color: "bg-red-500"
      });
    }
    
    if (profile?.instagram_handle) {
      const followers = profile.instagram_followers || 0;
      platformList.push({
        name: "Instagram",
        handle: profile.instagram_handle,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: true,
        color: "bg-pink-500"
      });
    }
    
    if (profile?.twitter_handle) {
      const followers = profile.twitter_followers || 0;
      platformList.push({
        name: "Twitter",
        handle: profile.twitter_handle,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: false,
        color: "bg-blue-400"
      });
    }
    
    if (profile?.tiktok_handle) {
      const followers = profile.tiktok_followers || 0;
      platformList.push({
        name: "TikTok",
        handle: profile.tiktok_handle,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: false,
        color: "bg-black"
      });
    }
    
    if (profile?.facebook_profile_url) {
      const followers = profile.facebook_followers || 0;
      platformList.push({
        name: "Facebook",
        handle: profile.facebook_profile_url,
        followers: followers >= 1000 ? `${(followers / 1000).toFixed(0)}K` : followers.toString(),
        connected: false,
        color: "bg-blue-600"
      });
    }
    
    return platformList;
  }, [profile]);

  // Build achievements array from actual brand deals data
  const achievements = useMemo(() => {
    const achievementList = [];
    const totalDeals = brandDeals.length;
    const totalEarnings = brandDeals
      .filter(deal => deal.status === 'Completed' && deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    const protectionScore = calculatedStats.protectionScore;
    
    // First Deal achievement
    if (totalDeals >= 1) {
      const firstDeal = brandDeals
        .filter(deal => deal.status === 'Completed')
        .sort((a, b) => {
          const dateA = a.payment_received_date ? new Date(a.payment_received_date).getTime() : 0;
          const dateB = b.payment_received_date ? new Date(b.payment_received_date).getTime() : 0;
          return dateA - dateB;
        })[0];
      
      const earnedDate = firstDeal?.payment_received_date 
        ? new Date(firstDeal.payment_received_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : profile?.updated_at 
          ? new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          : null;
      
      achievementList.push({
        id: 1,
        title: "First Deal Monitored",
        icon: Star,
        earned: true,
        date: earnedDate || "Recently"
      });
    } else {
      achievementList.push({
        id: 1,
        title: "First Deal Monitored",
        icon: Star,
        earned: false,
        progress: 0
      });
    }
    
    // 10 Deals achievement
    if (totalDeals >= 10) {
      const tenthDeal = brandDeals
        .filter(deal => deal.status === 'Completed')
        .sort((a, b) => {
          const dateA = a.payment_received_date ? new Date(a.payment_received_date).getTime() : 0;
          const dateB = b.payment_received_date ? new Date(b.payment_received_date).getTime() : 0;
          return dateA - dateB;
        })[9];
      
      const earnedDate = tenthDeal?.payment_received_date 
        ? new Date(tenthDeal.payment_received_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : null;
      
      achievementList.push({
        id: 2,
        title: "10 Deals Monitored",
        icon: TrendingUp,
        earned: true,
        date: earnedDate || "Recently"
      });
    } else {
      achievementList.push({
        id: 2,
        title: "10 Deals Monitored",
        icon: TrendingUp,
        earned: false,
        progress: Math.min(100, Math.round((totalDeals / 10) * 100))
      });
    }
    
    // ₹1M Under Watch achievement
    const oneMillion = 1000000;
    const totalUnderWatch = brandDeals
      .filter(deal => deal.status !== 'Completed' || !deal.payment_received_date)
      .reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);
    
    if (totalUnderWatch >= oneMillion) {
      achievementList.push({
        id: 3,
        title: "₹1M Under Watch",
        icon: Award,
        earned: true,
        date: "Recently"
      });
    } else {
      achievementList.push({
        id: 3,
        title: "₹1M Under Watch",
        icon: Award,
        earned: false,
        progress: Math.min(100, Math.round((totalUnderWatch / oneMillion) * 100))
      });
    }
    
    return achievementList;
  }, [brandDeals, calculatedStats.protectionScore, profile?.updated_at]);

  const userData = {
    name: formData.name,
    displayName: formData.displayName,
    email: formData.email,
    phone: formData.phone,
    location: formData.location,
    bio: formData.bio,
    userType: "Content Creator",
    memberSince: profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Recently",
    avatar: getInitials(profile?.first_name || null, profile?.last_name || null),
    verified: true,
    stats: calculatedStats,
    platforms: platforms,
    achievements: achievements,
    subscription: {
      plan: "Pro",
      status: "active",
      nextBilling: "Dec 26, 2024",
      amount: 999
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (formData.phone && !/^[\d\s\+\-\(\)]+$/.test(formData.phone)) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!editMode || !profile) return;
    
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    logger.info('Saving profile updates', { profileId: profile.id });

    try {
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      // Build update payload with only essential fields
      // Skip instagram_handle and other optional columns that may not exist
      // Clean phone number - remove +91 if it's just the default
      let phoneValue: string | null = formData.phone.trim();
      if (phoneValue === '+91' || phoneValue === '+91 ' || phoneValue === '') {
        phoneValue = null; // Save as null if empty or just the prefix
      } else if (!phoneValue.startsWith('+91')) {
        // If user typed a number without +91, add it
        phoneValue = '+91 ' + phoneValue.replace(/^\+91\s*/, '');
      }
      
      const updatePayload: any = {
        id: profile.id,
        first_name: firstName,
        last_name: lastName,
      };
      
      // Only include phone if it has a value (null is valid to clear)
      if (phoneValue !== null) {
        updatePayload.phone = phoneValue;
      } else {
        // Explicitly set to null to clear the field
        updatePayload.phone = null;
      }
      
      // Only include optional fields if they're provided and likely exist
      if (profile.avatar_url) {
        updatePayload.avatar_url = profile.avatar_url;
      }
      if (formData.location) {
        updatePayload.location = formData.location;
      }
      if (formData.bio) {
        updatePayload.bio = formData.bio;
      }
      
      // Note: instagram_handle is skipped to avoid schema errors
      // If needed, add a migration to create the column first
      
      await updateProfileMutation.mutateAsync(updatePayload);

      await refetchProfile();
      toast.success('Profile updated successfully!');
      setEditMode(false);
      logger.success('Profile updated', { profileId: profile.id });
    } catch (error: any) {
      logger.error('Failed to update profile', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout with confirmation
  const handleLogout = async () => {
    try {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      
      // Analytics tracking
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'logout', {
          event_category: 'engagement',
          event_label: 'user_logout',
          method: 'profile_settings'
        });
      }
      
      logger.info('User logging out');
      await signOutMutation.mutateAsync();
    } catch (error: any) {
      logger.error('Logout failed', error);
      toast.error('Failed to log out');
    }
  };

  // Loading state
  if (sessionLoading) {
    return (
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-400" />
          <p className="text-purple-200">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Not logged in or not a creator
  if (!profile || profile.role !== 'creator') {
    navigate('/');
    return null;
  }

  return (
    <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate('/creator-dashboard')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-lg font-semibold">Profile & Settings</div>
          
          <button 
            onClick={() => {
              if (editMode) {
                handleSave();
              } else {
                setEditMode(true);
              }
            }}
            disabled={isSaving}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            ) : editMode ? (
              <Check className="w-6 h-6 text-green-400" />
            ) : (
              <Edit className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Sticky Segmented Control */}
      <div className="sticky top-[57px] z-40 bg-purple-900/95 backdrop-blur-lg border-b border-white/10 px-4 py-3">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 border border-white/10 max-w-2xl mx-auto">
          <button
            onClick={() => setActiveSection('profile')}
            className={cn(
              "flex-1 min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5",
              activeSection === 'profile'
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/60 hover:text-white/80"
            )}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveSection('account')}
            className={cn(
              "flex-1 min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5",
              activeSection === 'account'
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/60 hover:text-white/80"
            )}
          >
            <Lock className="w-4 h-4" />
            <span>Account</span>
          </button>
          <button
            onClick={() => setActiveSection('support')}
            className={cn(
              "flex-1 min-h-[44px] px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 text-center flex items-center justify-center gap-1.5",
              activeSection === 'support'
                ? "bg-white/10 text-white shadow-sm"
                : "text-white/60 hover:text-white/80"
            )}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Support</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3" style={{ paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))' }}>
        {/* Profile Summary - Reduced height and visual dominance */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar - Smaller */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center text-xl font-bold">
                {userData.avatar}
              </div>
              {userData.verified && (
                <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white/10">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            
            {/* Name and Role */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{userData.name}</h1>
              <div className="mt-1">
                <p className="text-xs text-white/60">
                  Verified Creator Profile • Protection Active
                </p>
              </div>
            </div>

            {/* View Stats Button - Right aligned, secondary style */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white/70 hover:text-white/90 transition-colors flex-shrink-0"
            >
              {showStats ? 'Hide Stats' : 'View Stats'}
            </button>
          </div>

          {/* Stats Grid - Hidden by default, shown on "View Stats" click */}
          {showStats && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">{userData.stats.totalDeals}</div>
                  <div className="text-xs text-white/60">Deals Monitored</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">₹{(userData.stats.totalEarnings / 1000).toFixed(0)}K</div>
                  <div className="text-xs text-white/60">Amount Recovered</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">{userData.stats.protectionScore}</div>
                  <div className="text-xs text-white/60">Amount Under Watch</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold mb-1">{userData.stats.activeDeals}</div>
                  <div className="text-xs text-white/60">Active Cases</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="space-y-3">
            {/* Basic Information */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Basic Information
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter your full name"
                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-white/50 flex-shrink-0" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled={true}
                      title="Email cannot be changed"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/60 placeholder-white/40 outline-none cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-1">Email cannot be changed for security reasons</p>
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-white/50 flex-shrink-0" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Ensure +91 prefix is always present
                        if (!value.startsWith('+91')) {
                          // If user tries to delete +91, restore it
                          if (value.length < 3) {
                            value = '+91 ';
                          } else {
                            // If user pastes or types a number without +91, add it
                            value = '+91 ' + value.replace(/^\+91\s*/, '');
                          }
                        }
                        setFormData(prev => ({ ...prev, phone: value }));
                      }}
                      disabled={!editMode}
                      placeholder="+91 98765 43210"
                      className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Milestones */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Account Milestones
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {userData.achievements.map(achievement => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border ${
                        achievement.earned
                          ? 'bg-yellow-500/10 border-yellow-500/20'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg ${
                        achievement.earned ? 'bg-yellow-500/20' : 'bg-white/10'
                      } flex items-center justify-center mb-2`}>
                        <Icon className={`w-5 h-5 ${achievement.earned ? 'text-yellow-400' : 'text-white/60'}`} />
                      </div>
                      <div className="font-medium text-sm mb-1">{achievement.title}</div>
                      {achievement.earned ? (
                        <div className="text-xs text-yellow-400/80">Earned {achievement.date}</div>
                      ) : (
                        <div className="text-xs text-white/50">{achievement.progress}% complete</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Account Section */}
        {activeSection === 'account' && (
          <div className="space-y-3">
            {/* Notifications */}
            <NotificationPreferences />

            {/* Subscription - Utility Emphasis */}
            <div className="bg-white/5 rounded-lg p-3.5 border border-white/10">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Subscription
              </h2>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xl font-bold mb-1">{userData.subscription.plan} Plan</div>
                  <div className="text-sm text-white/70">₹{userData.subscription.amount}/month</div>
                </div>
                <span className="px-2.5 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>
              <div className="text-xs text-white/60 mb-3">
                Next billing: {userData.subscription.nextBilling}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-white/10 hover:bg-white/15 font-medium py-2 rounded-lg transition-colors text-sm">
                  Manage Plan
                </button>
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 font-medium py-2 rounded-lg transition-colors text-sm">
                  Upgrade
                </button>
              </div>
            </div>

            {/* Security & Privacy - Utility Emphasis */}
            <div className="bg-white/5 rounded-lg p-3.5 border border-white/10">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-white/60" />
                Security & Privacy
              </h2>
              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-white/50" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Change Password</div>
                      <div className="text-xs text-white/50">Last changed 2 months ago</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>

                <button className="w-full flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-white/50" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Two-Factor Authentication</div>
                      <div className="text-xs text-green-400/70">Enabled</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>

                <button className="w-full flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-white/50" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Download Your Data</div>
                      <div className="text-xs text-white/50">Export all your information</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>

                <button className="w-full flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/10 hover:bg-red-500/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4 text-red-400/70" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-red-400/80">Delete Account</div>
                      <div className="text-xs text-white/50">Permanently remove your account</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400/70" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Support Section */}
        {activeSection === 'support' && (
          <div className="space-y-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h2 className="font-semibold text-base mb-3">Help & Support</h2>
              <div className="space-y-2">
                {/* Contact Support - Primary */}
                <button className="w-full flex items-center justify-between min-h-[44px] p-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-lg border border-purple-500/30 hover:from-purple-600/30 hover:to-indigo-600/30 transition-all backdrop-blur-sm">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="w-4 h-4 text-purple-300" />
                    <div className="text-left">
                      <div className="font-semibold text-sm text-white">Contact Support</div>
                      <div className="text-xs text-white/60">Chat with our team</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-purple-300" />
                </button>

                {/* Help Center - Secondary */}
                <button className="w-full flex items-center justify-between min-h-[44px] p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-3.5 h-3.5 text-white/50" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Help Center</div>
                      <div className="text-xs text-white/60">FAQs and guides</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>

                {/* Restart Tutorial - Secondary */}
                <button 
                  onClick={() => {
                    if (profile?.id) {
                      // Clear tutorial state
                      localStorage.removeItem(`dashboard-tutorial-completed-${profile.id}`);
                      localStorage.removeItem(`dashboard-tutorial-dismissed-${profile.id}`);
                      toast.success('Tutorial has been reset! It will appear on your next dashboard visit.');
                      // Navigate to dashboard to trigger tutorial
                      setTimeout(() => {
                        navigate('/creator-dashboard');
                      }, 1000);
                    }
                  }}
                  className="w-full flex items-center justify-between min-h-[44px] p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-white/50" />
                    <div className="text-left">
                      <div className="font-medium text-sm">Restart Dashboard Tutorial</div>
                      <div className="text-xs text-white/60">Show the guided tour again</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/50" />
                </button>
              </div>
            </div>

            {/* Legal Subsection - Muted */}
            <div className="bg-white/3 rounded-lg p-3 border border-white/8">
              <h3 className="text-xs font-medium text-white/50 mb-2 uppercase tracking-wide">Legal</h3>
              <div className="space-y-1.5">
                <button className="w-full flex items-center justify-between min-h-[44px] p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-3.5 h-3.5 text-white/40" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-white/80">Terms of Service</div>
                      <div className="text-xs text-white/60">Read our terms</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>

                <button className="w-full flex items-center justify-between min-h-[44px] p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-3.5 h-3.5 text-white/40" />
                    <div className="text-left">
                      <div className="font-medium text-sm text-white/80">Privacy Policy</div>
                      <div className="text-xs text-white/60">How we protect your data</div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/40" />
                </button>
              </div>
            </div>

            {/* Divider before About */}
            <div className="border-t border-white/10 my-4"></div>

            {/* App Info - Muted and Centered */}
            <div className="bg-white/3 rounded-lg p-3 border border-white/8">
              <div className="text-center text-sm text-white/50">
                <div className="font-medium mb-0.5">CreatorArmour</div>
                <div className="text-xs mb-1">Version 1.0.0</div>
                <div className="text-xs text-white/40">© 2024 CreatorArmour. All rights reserved.</div>
              </div>
            </div>

            {/* Logout Button - Danger Zone Card */}
            <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
              <button 
                onClick={() => {
                  // Haptic feedback on click
                  if (navigator.vibrate) {
                    navigator.vibrate(30);
                  }
                  setShowLogoutDialog(true);
                }}
                disabled={signOutMutation.isPending}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
                aria-label="Log out of your account"
                aria-describedby="logout-description"
              >
                {signOutMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </>
                )}
              </button>
              <p id="logout-description" className="text-xs text-center text-white/40 mt-2">
                You'll be signed out of your account
              </p>
            </div>

            {/* Logout Confirmation Dialog */}
            <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
              <AlertDialogContent className="bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-indigo-900/95 backdrop-blur-xl border border-white/10 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white text-xl flex items-center gap-2">
                    <LogOut className="w-5 h-5 text-red-400" />
                    Confirm Logout
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-purple-200">
                    Are you sure you want to log out? You'll need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                  <AlertDialogCancel 
                    onClick={() => {
                      if (navigator.vibrate) {
                        navigator.vibrate(30);
                      }
                    }}
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 focus:ring-2 focus:ring-purple-400/50"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLogout}
                    disabled={signOutMutation.isPending}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 focus:ring-2 focus:ring-red-400/50 disabled:opacity-50"
                  >
                    {signOutMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Logging out...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Log Out
                      </>
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
