import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, Instagram, Edit, Lock, CreditCard, Shield, HelpCircle, FileText, LogOut, ChevronRight, ChevronDown, Check, Download, Trash2, Star, TrendingUp, Award, MessageCircle, Loader2, Sparkles, Camera, Link2, Copy, ExternalLink, AlertCircle, Eye } from 'lucide-react';
import NotificationPreferences from '@/components/notifications/NotificationPreferences';
import AvatarUploader from '@/components/profile/AvatarUploader';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useUpdateProfile } from '@/lib/hooks/useProfiles';
import { useSignOut } from '@/lib/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useBrandDeals } from '@/lib/hooks/useBrandDeals';
import { usePartnerStats } from '@/lib/hooks/usePartnerProgram';
import { toast } from 'sonner';
import { getInitials } from '@/lib/utils/avatar';
import { logger } from '@/lib/utils/logger';
import { cn } from '@/lib/utils';
import { fetchPincodeData, parseLocationString, formatLocationString } from '@/lib/utils/pincodeLookup';
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
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState<{
    weeklyViews: number;
    totalViews: number;
    submissions: number;
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Fetch real data for stats
  const { data: brandDeals = [] } = useBrandDeals({
    creatorId: profile?.id,
    enabled: !!profile?.id,
  });

  const { data: partnerStats } = usePartnerStats(profile?.id);

  // Fetch collab link analytics summary
  useEffect(() => {
    const fetchAnalytics = async () => {
      // Use Instagram handle as username, fallback to username field
      const usernameForAnalytics = profile?.instagram_handle || profile?.username;
      if (!usernameForAnalytics || !user) {
        setAnalyticsLoading(false);
        return;
      }

      try {
        // Get current session (don't refresh unless needed - Supabase auto-refreshes)
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !sessionData.session) {
          console.error('[CreatorProfile] No session:', sessionError);
          setAnalyticsLoading(false);
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab-analytics/summary`,
          {
            headers: {
              'Authorization': `Bearer ${sessionData.session.access_token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 401) {
          console.error('[CreatorProfile] Unauthorized - token may be invalid');
          setAnalyticsLoading(false);
          return;
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAnalyticsSummary({
              weeklyViews: data.weeklyViews || 0,
              totalViews: data.totalViews || 0,
              submissions: data.submissions || 0,
            });
          }
        }
      } catch (error) {
        console.error('[CreatorProfile] Error fetching analytics:', error);
        // Don't show error to user, just use fallback
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [profile?.instagram_handle, profile?.username, user]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    email: "",
    phone: "+91 ",
    location: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    bio: "",
    instagramHandle: "",
    username: ""
  });

  // Pincode lookup state
  const [isLookingUpPincode, setIsLookingUpPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);

  // Load user data from session (only on initial load)
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    if (profile && user && !hasInitialized) {
      // Ensure phone starts with +91
      let phoneValue = profile.phone || '';
      if (phoneValue && !phoneValue.startsWith('+91')) {
        // If phone exists but doesn't start with +91, prepend it
        phoneValue = phoneValue.startsWith('+') ? phoneValue : `+91 ${phoneValue}`;
      } else if (!phoneValue) {
        phoneValue = '+91 ';
      }
      
      // Parse existing location to extract address components
      const location = profile.location || '';
      const parsedLocation = parseLocationString(location);
      
      console.log('[CreatorProfile] Initializing formData from profile:', {
        location,
        parsedLocation,
        profileLocation: profile.location
      });
      
      setFormData({
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Creator',
        displayName: profile.instagram_handle?.replace('@', '') || user.email?.split('@')[0] || 'creator',
        email: user.email || '',
        phone: phoneValue,
        location: location,
        addressLine: parsedLocation.addressLine,
        city: parsedLocation.city,
        state: parsedLocation.state,
        pincode: parsedLocation.pincode,
        bio: profile.bio || '',
        instagramHandle: profile.instagram_handle || '',
        username: profile.instagram_handle || profile.username || '' // Use Instagram handle as username
      });
      
      setHasInitialized(true);
    }
  }, [profile, user, hasInitialized]);

  // Handle pincode lookup
  const handlePincodeChange = async (pincode: string) => {
    // Update pincode in form
    setFormData(prev => ({ ...prev, pincode }));
    setPincodeError(null);

    // Only lookup if pincode is 6 digits
    const cleanPincode = pincode.replace(/\D/g, '');
    if (cleanPincode.length === 6) {
      setIsLookingUpPincode(true);
      try {
        const pincodeData = await fetchPincodeData(cleanPincode);
        if (pincodeData) {
          console.log('[CreatorProfile] Pincode lookup result:', {
            pincode: cleanPincode,
            city: pincodeData.city,
            state: pincodeData.state,
            district: pincodeData.district
          });
          
          setFormData(prev => {
            // Ensure we use the city from API if available, otherwise keep existing
            const newCity = pincodeData.city && pincodeData.city.trim() 
              ? pincodeData.city.trim() 
              : (prev.city || '');
            const newState = pincodeData.state && pincodeData.state.trim()
              ? pincodeData.state.trim()
              : (prev.state || '');
            
            const updated = {
              ...prev,
              city: newCity,
              state: newState,
            };
            
            console.log('[CreatorProfile] Updated formData:', {
              oldCity: prev.city,
              newCity: updated.city,
              cityFromAPI: pincodeData.city,
              cityTrimmed: pincodeData.city?.trim(),
              oldState: prev.state,
              newState: updated.state,
              stateFromAPI: pincodeData.state,
              stateTrimmed: pincodeData.state?.trim(),
              fullFormData: updated
            });
            
            // If city is still empty after update, log a warning
            if (!updated.city || !updated.city.trim()) {
              if (pincodeData.city && pincodeData.city.trim()) {
                console.error('[CreatorProfile] ERROR: City not set despite API returning:', pincodeData.city);
              } else {
                console.warn('[CreatorProfile] WARNING: City is empty. API returned:', pincodeData.city);
              }
            } else {
              console.log('[CreatorProfile] SUCCESS: City set to:', updated.city);
            }
            
            return updated;
          });
          setPincodeError(null);
        } else {
          setPincodeError('Pincode not found. Please enter manually.');
        }
      } catch (error) {
        console.error('[CreatorProfile] Pincode lookup error:', error);
        setPincodeError('Failed to fetch pincode data. Please enter manually.');
      } finally {
        setIsLookingUpPincode(false);
      }
    } else if (cleanPincode.length > 0 && cleanPincode.length < 6) {
      // Clear city/state if pincode is incomplete
      setFormData(prev => ({ ...prev, city: '', state: '' }));
    }
  };

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
    // Username validation - use Instagram handle if available
    const usernameToValidate = formData.instagramHandle || formData.username;
    if (!usernameToValidate || !usernameToValidate.trim()) {
      toast.error('Please enter an Instagram username (used for collaboration link)');
      return false;
    }
    if (usernameToValidate.trim().length < 3) {
      toast.error('Instagram username must be at least 3 characters');
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
    // Validate address is required (marked with * in UI)
    // Check if we have address components or the combined location
    const hasAddressComponents = formData.addressLine.trim() || formData.city.trim() || formData.state.trim() || formData.pincode.trim();
    const hasLocation = formData.location.trim();
    
    if (!hasAddressComponents && !hasLocation) {
      toast.error('Please enter your address (required for generating legal contracts)');
      return false;
    }
    
    // Validate that we have at least city and state (minimum requirement)
    if (!formData.city.trim() && !formData.state.trim() && !hasLocation) {
      toast.error('Please enter at least city and state, or use pincode to auto-fill');
      return false;
    }
    
    // Validate city specifically (required for contracts)
    if (!formData.city.trim() && !hasLocation) {
      toast.error('City is required. Enter pincode to auto-fill or enter manually.');
      return false;
    }
    
    // Validate state specifically (required for contracts)
    if (!formData.state.trim() && !hasLocation) {
      toast.error('State is required. Enter pincode to auto-fill or enter manually.');
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
    logger.info('Saving profile updates', { profileId: profile.id, location: formData.location });

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
      
      // Build location string from address components (always use components if available)
      let locationValue = '';
      
      // Clean addressLine to remove any city/state/pincode that might have been added previously
      let cleanAddressLine = formData.addressLine.trim();
      if (cleanAddressLine && (formData.city || formData.state || formData.pincode)) {
        // Remove city, state, and pincode from addressLine if they're already there
        // Use word boundaries to avoid partial matches
        if (formData.city && formData.city.trim()) {
          const cityRegex = new RegExp(`\\b${formData.city.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          cleanAddressLine = cleanAddressLine.replace(cityRegex, '').trim();
        }
        if (formData.state && formData.state.trim()) {
          const stateRegex = new RegExp(`\\b${formData.state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
          cleanAddressLine = cleanAddressLine.replace(stateRegex, '').trim();
        }
        if (formData.pincode && formData.pincode.trim()) {
          const pincodeRegex = new RegExp(`\\b${formData.pincode.trim()}\\b`, 'g');
          cleanAddressLine = cleanAddressLine.replace(pincodeRegex, '').trim();
        }
        // Clean up extra commas and spaces - more aggressive cleaning
        cleanAddressLine = cleanAddressLine
          .replace(/,\s*,+/g, '') // Remove multiple commas (including single comma if followed by another)
          .replace(/,\s*$/g, '') // Remove trailing comma
          .replace(/^\s*,/g, '') // Remove leading comma
          .replace(/,\s*$/g, '') // Remove trailing comma again (in case first pass missed it)
          .replace(/\s+/g, ' ') // Multiple spaces become one
          .replace(/,\s*$/g, '') // Final trailing comma removal
          .trim();
      }
      
      console.log('[CreatorProfile] Building location from formData:', {
        originalAddressLine: formData.addressLine,
        cleanAddressLine,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        hasComponents: !!(cleanAddressLine || formData.city || formData.state || formData.pincode)
      });
      
      if (cleanAddressLine || formData.city || formData.state || formData.pincode) {
        locationValue = formatLocationString(
          cleanAddressLine,
          formData.city,
          formData.state,
          formData.pincode
        );
        console.log('[CreatorProfile] Built locationValue:', locationValue);
      } else {
        // Fallback to existing location if no components are filled
        locationValue = formData.location.trim();
        console.log('[CreatorProfile] Using existing location:', locationValue);
      }
      
      // Validate that we have city and state before saving (both are required)
      if (!formData.city || !formData.city.trim()) {
        toast.error('City is required. Please enter pincode to auto-fill or enter manually.');
        setIsSaving(false);
        return;
      }
      if (!formData.state || !formData.state.trim()) {
        toast.error('State is required. Please enter pincode to auto-fill or enter manually.');
        setIsSaving(false);
        return;
      }
      
      // CRITICAL: Always rebuild locationValue to ensure city and state are included
      // This ensures the saved location always has city and state, even if addressLine is empty
      const finalCity = formData.city.trim();
      const finalState = formData.state.trim();
      const finalPincode = formData.pincode.trim();
      
      // Rebuild locationValue with guaranteed city and state
      locationValue = formatLocationString(
        cleanAddressLine,
        finalCity,
        finalState,
        finalPincode
      );
      
      console.log('[CreatorProfile] Final locationValue (guaranteed city/state):', {
        locationValue,
        city: finalCity,
        state: finalState,
        pincode: finalPincode,
        addressLine: cleanAddressLine,
        includesCity: locationValue.includes(finalCity),
        includesState: locationValue.includes(finalState)
      });
      
      // Double-check that city and state are in the location string
      if (!locationValue.includes(finalCity) || !locationValue.includes(finalState)) {
        console.error('[CreatorProfile] ERROR: City or state missing from locationValue!', {
          locationValue,
          city: finalCity,
          state: finalState
        });
        toast.error('Error: City and state must be included in address. Please try again.');
        setIsSaving(false);
        return;
      }
      
      // Ensure locationValue is not empty before saving
      if (!locationValue || !locationValue.trim()) {
        toast.error('Address is required. Please enter your address with city and state.');
        setIsSaving(false);
        return;
      }
      
      const updatePayload: any = {
        id: profile.id,
        first_name: firstName,
        last_name: lastName,
        // Always include location (address) - required for contracts
        // Save trimmed value
        location: locationValue.trim(),
      };
      
      console.log('[CreatorProfile] Saving profile with location:', {
        locationValue: updatePayload.location,
        locationLength: updatePayload.location.length,
        includesCity: updatePayload.location.includes(finalCity),
        includesState: updatePayload.location.includes(finalState),
      });
      
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
      if (formData.bio) {
        updatePayload.bio = formData.bio;
      }
      
      // Handle Instagram handle - normalize and save
      // NOTE: Instagram handle is NEVER used for username generation
      // Username is only auto-generated from first_name + last_name (or email) via database trigger
      if (formData.instagramHandle) {
        // Strip @, spaces, and convert to lowercase
        const normalizedHandle = formData.instagramHandle
          .replace(/@/g, '')
          .replace(/\s/g, '')
          .toLowerCase()
          .trim();
        updatePayload.instagram_handle = normalizedHandle || null;
      } else {
        updatePayload.instagram_handle = null;
      }
      
      // Handle username - sync with Instagram handle
      // Username is used in collaboration link URL: /{username} (Instagram-style)
      // Use Instagram handle as username (normalized)
      if (formData.instagramHandle && formData.instagramHandle.trim()) {
        // Normalize Instagram handle to use as username: lowercase, alphanumeric and hyphens/underscores only
        const normalizedUsername = formData.instagramHandle
          .replace(/@/g, '')
          .replace(/\s/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '')
          .trim();
        
        if (normalizedUsername.length >= 3) {
          updatePayload.username = normalizedUsername;
        } else {
          toast.error('Instagram username must be at least 3 characters');
          setIsSaving(false);
          return;
        }
      }
      
      logger.info('Update payload', { 
        updatePayload, 
        locationValue: updatePayload.location,
        locationLength: updatePayload.location?.length || 0,
        formDataLocation: formData.location,
        instagramHandle: updatePayload.instagram_handle
      });
      
      await updateProfileMutation.mutateAsync(updatePayload);

      // Update formData immediately with saved values to ensure UI reflects the change
      // Parse the saved location back to individual components to keep formData in sync
      const savedParsedLocation = parseLocationString(locationValue);
      setFormData(prev => ({
        ...prev,
        location: locationValue,
        addressLine: savedParsedLocation.addressLine || prev.addressLine,
        city: savedParsedLocation.city || finalCity || prev.city, // Ensure city is preserved
        state: savedParsedLocation.state || finalState || prev.state, // Ensure state is preserved
        pincode: savedParsedLocation.pincode || finalPincode || prev.pincode
      }));
      
      console.log('[CreatorProfile] Updated formData after save:', {
        locationValue,
        parsedLocation: savedParsedLocation,
        finalCity,
        finalState,
        finalPincode
      });
      
      // Refetch profile to get updated username (if it was auto-generated by database trigger)
      await refetchProfile();
      
      // Small delay to ensure profile state updates before showing success
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.success('Profile updated successfully!');
      setEditMode(false);
      logger.success('Profile updated', { 
        profileId: profile.id, 
        location: updatePayload.location,
        locationValue: locationValue
      });
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
      // Close dialog first
      setShowLogoutDialog(false);
      // Then sign out
      await signOutMutation.mutateAsync();
    } catch (error: any) {
      logger.error('Logout failed', error);
      toast.error('Failed to log out');
      // Reopen dialog if logout failed
      setShowLogoutDialog(true);
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
        {/* Profile Summary - Mobile Optimized */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar - Editable - Centered on mobile */}
            <div className="relative flex-shrink-0">
              {profile?.id ? (
                <div className="relative">
                  <div 
                    className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-purple-600 flex items-center justify-center text-2xl sm:text-xl font-bold overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.onchange = async (e: any) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Validate file type
                        if (!file.type.startsWith('image/')) {
                          toast.error('Please select an image file');
                          return;
                        }
                        
                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image size must be less than 5MB');
                          return;
                        }
                        
                        try {
                          // Upload to Supabase Storage
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${profile.id}/avatar.${fileExt}`;
                          const { error: uploadError } = await supabase.storage
                            .from('creator-assets')
                            .upload(fileName, file, {
                              cacheControl: '3600',
                              upsert: true,
                            });
                          
                          if (uploadError) throw uploadError;
                          
                          // Get public URL
                          const { data: { publicUrl } } = supabase.storage
                            .from('creator-assets')
                            .getPublicUrl(fileName);
                          
                          // Update profile
                          await updateProfileMutation.mutateAsync({
                            id: profile.id,
                            avatar_url: publicUrl,
                          });
                          
                          if (refetchProfile) {
                            await refetchProfile();
                          }
                          
                          toast.success('Profile photo updated!');
                        } catch (error: any) {
                          console.error('Error uploading avatar:', error);
                          toast.error('Failed to upload photo. Please try again.');
                        }
                      };
                      fileInput.click();
                    }}
                  >
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={userData.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{userData.avatar}</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-5 sm:h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-white/10 cursor-pointer hover:bg-purple-400 transition-colors">
                    <Camera className="w-3 h-3 sm:w-2.5 sm:h-2.5 text-white" />
                  </div>
                  {userData.verified && (
                    <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white/10 z-10">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-purple-600 flex items-center justify-center text-2xl sm:text-xl font-bold">
                  {userData.avatar}
                </div>
              )}
            </div>
            
            {/* Name and Role - Centered on mobile */}
            <div className="flex-1 min-w-0 text-center sm:text-left w-full sm:w-auto">
              <h1 className="text-xl sm:text-lg font-semibold">{userData.name}</h1>
              <div className="mt-1">
                <p className="text-xs text-white/60">
                  Verified Creator Profile • Protection Active
                </p>
              </div>
              <p className="text-[10px] text-white/40 mt-1 sm:hidden">Tap camera icon to change photo</p>
            </div>

            {/* View Stats Button - Full width on mobile */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full sm:w-auto px-4 py-2 sm:px-3 sm:py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white/70 hover:text-white/90 transition-colors"
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
                {/* Address Line */}
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">Address Line *</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-white/50 flex-shrink-0" />
                    <input
                      type="text"
                      value={formData.addressLine}
                      onChange={(e) => setFormData(prev => ({ ...prev, addressLine: e.target.value }))}
                      disabled={!editMode}
                      placeholder="House/Flat No., Building, Street"
                      className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                    />
                  </div>
                </div>

                {/* Pincode with auto-fetch */}
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">Pincode *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        handlePincodeChange(value);
                      }}
                      disabled={!editMode}
                      placeholder="6-digit pincode"
                      maxLength={6}
                      className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                    />
                    {isLookingUpPincode && (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400 flex-shrink-0" />
                    )}
                  </div>
                  {pincodeError && (
                    <p className="text-xs text-yellow-400 mt-1">{pincodeError}</p>
                  )}
                  {formData.pincode.length === 6 && !isLookingUpPincode && !pincodeError && (
                    <p className="text-xs text-green-400 mt-1">✓ City and State auto-filled</p>
                  )}
                  <p className="text-xs text-white/50 mt-1">Enter 6-digit pincode to auto-fill city and state</p>
                </div>

                {/* City */}
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">City *</label>
                  <input
                    type="text"
                    value={formData.city || ''}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      console.log('[CreatorProfile] City input changed:', newCity);
                      setFormData(prev => {
                        const updated = { ...prev, city: newCity };
                        console.log('[CreatorProfile] City updated in formData:', updated.city);
                        return updated;
                      });
                    }}
                    disabled={!editMode || isLookingUpPincode}
                    placeholder="City"
                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'} ${isLookingUpPincode ? 'opacity-50' : ''}`}
                  />
                  {/* Debug: Show current city value */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="text-xs text-white/40 mt-1">
                      Debug: city = "{formData.city || '(empty)'}"
                    </div>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    disabled={!editMode || isLookingUpPincode}
                    placeholder="State"
                    className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'} ${isLookingUpPincode ? 'opacity-50' : ''}`}
                  />
                </div>
              </div>
            </div>

            {/* Social Profiles Section */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Social Profiles
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block">Instagram Username</label>
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-white/50 flex-shrink-0" />
                    <input
                      type="text"
                      value={formData.instagramHandle}
                      onChange={(e) => {
                        // Strip @ symbol and convert to lowercase, remove spaces
                        let value = e.target.value
                          .replace(/@/g, '')
                          .replace(/\s/g, '')
                          .toLowerCase();
                        // Sync username with Instagram handle
                        setFormData(prev => ({ 
                          ...prev, 
                          instagramHandle: value,
                          username: value // Use same value for collab link username
                        }));
                      }}
                      disabled={!editMode}
                      placeholder="rahul_creates"
                      className={`flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none transition-colors ${editMode ? 'focus:border-purple-500 focus:bg-white/10' : 'cursor-not-allowed'}`}
                    />
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    This will be shown to brands on your collaboration page and used in your collaboration link: /{formData.instagramHandle || 'username'}
                  </p>
                  {formData.instagramHandle && (
                    <p className="text-xs text-purple-300 mt-1">
                      Link: {window.location.origin}/{formData.instagramHandle}
                    </p>
                  )}
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

            {/* Collaboration Link */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h2 className="font-semibold text-base mb-1 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Your Official Collaboration Link
              </h2>
              <p className="text-xs text-white/60 mb-4">
                Use this link instead of DMs for paid collaborations & contracts
              </p>
              <div className="space-y-4">
                {(() => {
                  // Use Instagram handle from formData (current input) or profile, fallback to username field
                  const usernameForLink = formData.instagramHandle || profile?.instagram_handle || profile?.username;
                  const hasUsername = usernameForLink && usernameForLink.trim() !== '';
                  // New Instagram-style link format: creatorarmour.com/username
                  const collabLink = hasUsername ? `${window.location.origin}/${usernameForLink}` : '';
                  // Display shortened link format: creatorarmour.com/username
                  const shortLink = hasUsername ? `creatorarmour.com/${usernameForLink}` : '';
                  
                  // Debug: Log the values being used (dev only)
                  if (import.meta.env.DEV && hasUsername) {
                    console.log('[CreatorProfile] Collab link values:', {
                      formDataInstagramHandle: formData.instagramHandle,
                      profileInstagramHandle: profile?.instagram_handle,
                      profileUsername: profile?.username,
                      finalUsername: usernameForLink,
                      collabLink
                    });
                  }
                  
                  return hasUsername ? (
                  <>
                      {/* Link Display */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                        <div className="mb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                            <code className="text-sm text-purple-200 break-all flex-1 font-medium">
                              {shortLink}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(collabLink);
                                  setCopiedLink(true);
                                  toast.success('Collab link copied');
                                  setTimeout(() => setCopiedLink(false), 2000);
                                } catch (error) {
                                  toast.error('Failed to copy link');
                                }
                          }}
                              className="h-8 w-8 p-0 text-purple-300 hover:text-white flex-shrink-0 transition-all"
                              aria-label="Copy collaboration link"
                        >
                              {copiedLink ? (
                                <Check className="h-4 w-4 text-green-400 animate-in fade-in duration-200" />
                              ) : (
                          <Copy className="h-4 w-4" />
                              )}
                        </Button>
                      </div>
                          {/* Trust Layer */}
                          <p className="text-xs text-purple-300/70 ml-1 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Powered by Creator Armour • Legal & payment protection enabled</span>
                          </p>
                        </div>

                        {/* Benefit Line */}
                        <p className="text-xs text-purple-200 text-center mb-3 font-medium">
                          No DMs. No confusion. Everything in one place.
                        </p>

                        {/* Instagram Bio Helper Text */}
                        <p className="text-xs text-white/50 mb-3 text-center">
                          💡 Looks like an Instagram handle — perfect for your bio
                        </p>
                        <p className="text-xs text-white/50 mb-3 text-center">
                          Add this link to your Instagram bio and reply to brand DMs with it.
                        </p>

                        {/* Share Buttons */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                            onClick={() => {
                              const message = encodeURIComponent(`Hey! For collaborations, please submit details here so everything is clear and protected:\n\n${collabLink}`);
                              window.open(`https://wa.me/?text=${message}`, '_blank');
                              toast.success('Opening WhatsApp...');
                            }}
                            className="bg-purple-500/20 border-purple-400/50 text-purple-200 hover:bg-purple-500/30 hover:border-purple-400/70 text-xs backdrop-blur-sm"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                            WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const subject = encodeURIComponent('Collaboration request');
                              const body = encodeURIComponent(`Hi,\n\nFor collaborations, please submit details here so everything is clear and protected:\n\n${collabLink}\n\nThanks!`);
                              window.location.href = `mailto:?subject=${subject}&body=${body}`;
                              toast.success('Opening email client...');
                            }}
                            className="bg-purple-500/20 border-purple-400/50 text-purple-200 hover:bg-purple-500/30 hover:border-purple-400/70 text-xs backdrop-blur-sm"
                          >
                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                            Email
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(collabLink);
                                toast.success('Link copied. Paste in bio or DM.');
                              } catch (error) {
                                toast.error('Failed to copy link');
                              }
                            }}
                            className="bg-purple-500/20 border-purple-400/50 text-purple-200 hover:bg-purple-500/30 hover:border-purple-400/70 text-xs backdrop-blur-sm"
                          >
                            <Instagram className="h-3.5 w-3.5 mr-1.5" />
                            Instagram
                          </Button>
                        </div>

                        {/* Preview Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const usernameForLink = formData.instagramHandle || profile?.instagram_handle || profile?.username;
                            if (usernameForLink) {
                              window.open(`/${usernameForLink}`, '_blank');
                            } else {
                              toast.error('Please set your Instagram username first');
                            }
                          }}
                          className="w-full bg-purple-500/20 border-purple-400/50 text-purple-200 hover:bg-purple-500/30 hover:border-purple-400/70 backdrop-blur-sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                          View Public Collab Page
                      </Button>
                    </div>

                      {/* How it works - Collapsible */}
                      <Collapsible open={showHowItWorks} onOpenChange={setShowHowItWorks}>
                        <CollapsibleTrigger className="w-full">
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center justify-between hover:bg-white/10 transition-colors">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-purple-300" />
                              <span className="text-sm text-white/90 font-medium">How it works</span>
                            </div>
                            <ChevronDown className={cn("h-4 w-4 text-white/50 transition-transform duration-200", showHowItWorks && "rotate-180")} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="bg-white/5 border border-white/10 rounded-lg p-3 mt-2 border-t-0 rounded-t-none">
                            <ol className="space-y-2 text-xs text-white/70">
                              <li className="flex items-start gap-2">
                                <span className="text-purple-300 font-semibold flex-shrink-0">1.</span>
                                <span>Brand submits details via this link</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-300 font-semibold flex-shrink-0">2.</span>
                                <span>You review the request inside Creator Armour</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-300 font-semibold flex-shrink-0">3.</span>
                                <span>Accept, counter, or decline</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-300 font-semibold flex-shrink-0">4.</span>
                                <span>Contract is generated automatically</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-300 font-semibold flex-shrink-0">5.</span>
                                <span>Payments & deadlines are tracked</span>
                              </li>
                            </ol>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {/* Trust Badge */}
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-start gap-2">
                        <Lock className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-200">
                          Requests through this link are logged & protected by Creator Armour
                        </p>
                      </div>

                      {/* Analytics Teaser */}
                      <div className="bg-purple-500/5 border border-purple-500/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="h-4 w-4 text-purple-300 flex-shrink-0" />
                          {analyticsLoading ? (
                            <div className="flex items-center gap-2 flex-1">
                              <Loader2 className="h-3 w-3 animate-spin text-purple-300" />
                              <p className="text-xs text-purple-200">Loading analytics...</p>
                            </div>
                          ) : analyticsSummary ? (
                            <p className="text-xs text-purple-200">
                              {analyticsSummary.weeklyViews === 0 ? (
                                <>👀 No brand views yet — share your link to get started</>
                              ) : (
                                <>👀 {analyticsSummary.weeklyViews} {analyticsSummary.weeklyViews === 1 ? 'brand' : 'brands'} viewed your collab link this week</>
                              )}
                            </p>
                          ) : (
                            <p className="text-xs text-purple-200">
                              👀 No brand views yet — share your link to get started
                            </p>
                          )}
                        </div>
                        {analyticsSummary && analyticsSummary.weeklyViews === 0 && !analyticsLoading && (
                          <p className="text-xs text-purple-300/70 mt-2 ml-6">
                            Tip: Add this link to your Instagram bio or pin it in DMs
                          </p>
                        )}
                      </div>

                      {/* Mental Model Copy - DM Replacement */}
                      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-4">
                        <p className="text-sm text-white font-semibold text-center mb-2">
                          This link replaces DMs and protects you legally.
                        </p>
                        <p className="text-xs text-white/60 text-center">
                          Deals done outside Creator Armour are not protected.
                        </p>
                    </div>
                  </>
                ) : (
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-purple-300 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-purple-200 mb-1">
                            Complete your profile to activate your collab link
                          </p>
                          <p className="text-xs text-purple-300/70">
                            Your collab link will be generated automatically after you save your profile.
                    </p>
                  </div>
                      </div>
                      {process.env.NODE_ENV === 'development' && (
                        <p className="text-xs text-purple-300/50 mt-2 ml-6">
                          Debug: profile exists: {profile ? 'yes' : 'no'}, username: {profile?.username || 'null/undefined'}
                        </p>
                )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Logout Button - At Bottom of Profile Section */}
            <div className="mt-6 mb-4">
              <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Haptic feedback on click
                    if (navigator.vibrate) {
                      navigator.vibrate(30);
                    }
                    console.log('[CreatorProfile] Logout button clicked, opening dialog');
                    setShowLogoutDialog(true);
                  }}
                  disabled={signOutMutation.isPending}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
                  aria-label="Log out of your account"
                  aria-describedby="logout-description"
                  type="button"
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

            {/* Logout Button - At Bottom */}
            <div className="mt-6 mb-4">
              <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/20">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Haptic feedback on click
                    if (navigator.vibrate) {
                      navigator.vibrate(30);
                    }
                    console.log('[CreatorProfile] Logout button clicked, opening dialog');
                    setShowLogoutDialog(true);
                  }}
                  disabled={signOutMutation.isPending}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-medium py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px]"
                  aria-label="Log out of your account"
                  aria-describedby="logout-description"
                  type="button"
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
            </div>

          </div>
        )}
      </div>

      {/* Logout Confirmation Dialog - Always rendered outside conditionals */}
      <AlertDialog open={showLogoutDialog} onOpenChange={(open) => {
        console.log('[CreatorProfile] Dialog open state changed:', open);
        setShowLogoutDialog(open);
      }}>
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
  );
};

export default ProfileSettings;
