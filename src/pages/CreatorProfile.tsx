import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Camera, User, Mail, Phone, MapPin, Instagram, Youtube, Twitter, Globe, Edit, Bell, Lock, CreditCard, Shield, HelpCircle, FileText, LogOut, ChevronRight, Check, X, Download, Trash2, Star, TrendingUp, Award, MessageCircle, Loader2, Sparkles } from 'lucide-react';
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
  const [notificationsEnabled, setNotificationsEnabled] = useState({
    deals: true,
    payments: true,
    contracts: true,
    marketing: false
  });

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
    phone: "",
    location: "",
    bio: ""
  });

  // Load user data from session
  useEffect(() => {
    if (profile && user) {
      setFormData({
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator',
        displayName: profile.instagram_handle?.replace('@', '') || user.email?.split('@')[0] || 'creator',
        email: user.email || '',
        phone: profile.phone || '',
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
        title: "First Deal",
        icon: Star,
        earned: true,
        date: earnedDate || "Recently"
      });
    } else {
      achievementList.push({
        id: 1,
        title: "First Deal",
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
        title: "10 Deals",
        icon: TrendingUp,
        earned: true,
        date: earnedDate || "Recently"
      });
    } else {
      achievementList.push({
        id: 2,
        title: "10 Deals",
        icon: TrendingUp,
        earned: false,
        progress: Math.min(100, Math.round((totalDeals / 10) * 100))
      });
    }
    
    // ₹1M Earned achievement
    const oneMillion = 1000000;
    if (totalEarnings >= oneMillion) {
      achievementList.push({
        id: 3,
        title: "₹1M Earned",
        icon: Award,
        earned: true,
        date: "Recently"
      });
    } else {
      achievementList.push({
        id: 3,
        title: "₹1M Earned",
        icon: Award,
        earned: false,
        progress: Math.min(100, Math.round((totalEarnings / oneMillion) * 100))
      });
    }
    
    // 100% Protection achievement
    if (protectionScore >= 100) {
      achievementList.push({
        id: 4,
        title: "100% Protection",
        icon: Shield,
        earned: true,
        date: "Recently"
      });
    } else {
      achievementList.push({
        id: 4,
        title: "100% Protection",
        icon: Shield,
        earned: false,
        progress: protectionScore
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

      await updateProfileMutation.mutateAsync({
        id: profile.id,
        first_name: firstName,
        last_name: lastName,
        avatar_url: profile.avatar_url,
        instagram_handle: formData.displayName ? `@${formData.displayName.replace('@', '')}` : profile.instagram_handle,
        phone: formData.phone || null,
        location: formData.location || null,
        bio: formData.bio || null,
      });

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
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
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

      <div className="p-4 pb-24">
        {/* Profile Header Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative">
            {/* Avatar */}
            <div className="flex items-start gap-4 mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold">
                  {userData.avatar}
                </div>
                {editMode && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center border-2 border-purple-900">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
                {userData.verified && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center border-2 border-purple-900">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{userData.name}</h1>
                </div>
                <div className="text-purple-200 mb-2">@{userData.displayName}</div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full">
                    {userData.userType}
                  </span>
                  <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full flex items-center gap-1">
                    🔥 {userData.stats.streak} weeks
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {editMode ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                placeholder="Tell us about yourself..."
                maxLength={500}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-purple-400 outline-none resize-none transition-colors focus:border-purple-500 focus:bg-white/10 mb-4"
              />
            ) : (
              <p className="text-sm text-purple-200 leading-relaxed mb-4">
                {userData.bio || 'No bio yet. Tap Edit to add one!'}
              </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold mb-1">{userData.stats.totalDeals}</div>
                <div className="text-xs text-purple-300">Deals</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-1">₹{(userData.stats.totalEarnings / 1000).toFixed(0)}K</div>
                <div className="text-xs text-purple-300">Earned</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-1">{userData.stats.protectionScore}</div>
                <div className="text-xs text-purple-300">Protection</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-1">{userData.stats.activeDeals}</div>
                <div className="text-xs text-purple-300">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveSection('profile')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === 'profile'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/15'
            }`}
          >
            <User className="w-4 h-4 inline mr-1" />
            Profile
          </button>
          <button
            onClick={() => setActiveSection('account')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === 'account'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/15'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-1" />
            Account
          </button>
          <button
            onClick={() => setActiveSection('support')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeSection === 'support'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white/10 text-purple-200 hover:bg-white/15'
            }`}
          >
            <HelpCircle className="w-4 h-4 inline mr-1" />
            Support
          </button>
        </div>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-purple-300 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    disabled={!editMode}
                    placeholder="Enter your full name"
                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-purple-400 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                  />
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-1 block">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled={true}
                      title="Email cannot be changed"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white/60 placeholder-purple-400 outline-none cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-purple-400 mt-1">Email cannot be changed for security reasons</p>
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-1 block">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!editMode}
                      placeholder="+91 98765 43210"
                      className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-purple-400 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-1 block">Location</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      disabled={!editMode}
                      placeholder="City, Country"
                      className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-purple-400 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-purple-300 mb-1 block">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    disabled={!editMode}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-purple-400 outline-none resize-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                  />
                  {editMode && (
                    <p className="text-xs text-purple-400 mt-1 text-right">{formData.bio.length}/500 characters</p>
                  )}
                </div>
              </div>
            </div>

            {/* Social Platforms */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Social Platforms
              </h2>
              <div className="space-y-3">
                {userData.platforms.map(platform => (
                  <div key={platform.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center`}>
                        {platform.name === 'YouTube' && <Youtube className="w-5 h-5" />}
                        {platform.name === 'Instagram' && <Instagram className="w-5 h-5" />}
                        {platform.name === 'Twitter' && <Twitter className="w-5 h-5" />}
                        {platform.name === 'Website' && <Globe className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-medium">{platform.name}</div>
                        <div className="text-xs text-purple-300">{platform.handle} • {platform.followers}</div>
                      </div>
                    </div>
                    {platform.connected ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Connected
                        </span>
                        <button className="p-1 hover:bg-white/10 rounded transition-colors">
                          <X className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ) : (
                      <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors">
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Achievements
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {userData.achievements.map(achievement => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-xl border ${
                        achievement.earned
                          ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl ${
                        achievement.earned ? 'bg-yellow-500/30' : 'bg-white/10'
                      } flex items-center justify-center mb-3`}>
                        <Icon className={`w-6 h-6 ${achievement.earned ? 'text-yellow-400' : 'text-purple-400'}`} />
                      </div>
                      <div className="font-medium mb-1">{achievement.title}</div>
                      {achievement.earned ? (
                        <div className="text-xs text-yellow-400">Earned {achievement.date}</div>
                      ) : (
                        <div className="text-xs text-purple-300">{achievement.progress}% complete</div>
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
          <div className="space-y-4">
            {/* Notifications */}
            <NotificationPreferences />

            {/* Security */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security & Privacy
              </h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <div className="font-medium">Change Password</div>
                      <div className="text-xs text-purple-300">Last changed 2 months ago</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-xs text-green-400">Enabled</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <div className="font-medium">Download Your Data</div>
                      <div className="text-xs text-purple-300">Export all your information</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-red-500/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <div className="text-left">
                      <div className="font-medium text-red-400">Delete Account</div>
                      <div className="text-xs text-purple-300">Permanently remove your account</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-red-400" />
                </button>
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-gradient-to-br from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl p-5 border border-purple-400/30">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </h2>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold mb-1">{userData.subscription.plan} Plan</div>
                  <div className="text-sm text-purple-200">₹{userData.subscription.amount}/month</div>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                  Active
                </span>
              </div>
              <div className="text-sm text-purple-200 mb-4">
                Next billing: {userData.subscription.nextBilling}
              </div>
              <div className="flex gap-2">
                <button className="flex-1 bg-white/10 hover:bg-white/15 font-medium py-2.5 rounded-lg transition-colors">
                  Manage Plan
                </button>
                <button className="flex-1 bg-purple-600 hover:bg-purple-700 font-medium py-2.5 rounded-lg transition-colors">
                  Upgrade
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Support Section */}
        {activeSection === 'support' && (
          <div className="space-y-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-4">Help & Support</h2>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <div className="font-medium">Help Center</div>
                      <div className="text-xs text-purple-300">FAQs and guides</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <div className="font-medium">Contact Support</div>
                      <div className="text-xs text-purple-300">Chat with our team</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>

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
                  className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <div className="font-medium">Restart Dashboard Tutorial</div>
                      <div className="text-xs text-purple-300">Show the guided tour again</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <div className="font-medium">Terms of Service</div>
                      <div className="text-xs text-purple-300">Read our terms</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <div className="text-left">
                      <div className="font-medium">Privacy Policy</div>
                      <div className="text-xs text-purple-300">How we protect your data</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-purple-400" />
                </button>
              </div>
            </div>

            {/* App Info */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10">
              <h2 className="font-semibold text-lg mb-4">About</h2>
              <div className="text-center text-sm text-purple-200">
                <div className="font-semibold mb-2">NoticeBazaar</div>
                <div className="mb-1">Version 1.0.0</div>
                <div className="text-xs">© 2024 NoticeBazaar. All rights reserved.</div>
              </div>
            </div>

            {/* Logout Button - Prominent and Clear */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 backdrop-blur-md rounded-2xl p-5 border border-red-500/20">
              <button 
                onClick={() => {
                  // Haptic feedback on click
                  if (navigator.vibrate) {
                    navigator.vibrate(30);
                  }
                  setShowLogoutDialog(true);
                }}
                disabled={signOutMutation.isPending}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.97] shadow-lg hover:shadow-xl hover:shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] touch-manipulation"
                aria-label="Log out of your account"
                aria-describedby="logout-description"
              >
                {signOutMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-base">Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5" />
                    <span className="text-base">Log Out</span>
                  </>
                )}
              </button>
              <p id="logout-description" className="text-xs text-center text-red-300/60 mt-3">
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
