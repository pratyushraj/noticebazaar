"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Instagram, Youtube, Twitter, RefreshCw, Unlink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { DialogFooter } from '@/components/ui/dialog';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SocialAccount {
  id: string;
  platform: string;
  account_username: string;
  follower_count: number;
  profile_picture_url: string | null;
  last_synced_at: string | null;
}

interface SocialAccountLinkFormProps {
  initialData: any;
  onSaveSuccess: () => void;
  onClose: () => void;
}

const SocialAccountLinkForm = ({ initialData, onSaveSuccess, onClose }: SocialAccountLinkFormProps) => {
  const { profile } = useSession();
  const [linkedAccounts, setLinkedAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [linkingPlatform, setLinkingPlatform] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Fetch linked accounts on mount
  useEffect(() => {
    fetchLinkedAccounts();
    
    // Check for OAuth callback data
    const urlParams = new URLSearchParams(window.location.search);
    const socialSuccess = urlParams.get('social_success');
    const accountData = urlParams.get('account_data');
    const socialError = urlParams.get('social_error');
    
    if (socialSuccess && accountData) {
      try {
        const data = JSON.parse(decodeURIComponent(accountData));
        saveAccountData(data);
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);
      } catch (error) {
        console.error('Error parsing account data:', error);
        toast.error('Failed to process OAuth callback');
      }
    }
    
    if (socialError) {
      toast.error(`OAuth error: ${decodeURIComponent(socialError)}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchLinkedAccounts = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinkedAccounts(data || []);
    } catch (error: any) {
      console.error('Error fetching linked accounts:', error);
      toast.error('Failed to load linked accounts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkAccount = async (platform: string) => {
    if (!profile?.id) {
      toast.error('Please log in to link social accounts');
      return;
    }

    setLinkingPlatform(platform);
    try {
      const { data, error } = await supabase.functions.invoke('link-social-account', {
        body: { platform },
      });

      if (error) throw error;

      if (data?.oauth_url) {
        // Redirect to OAuth URL
        window.location.href = data.oauth_url;
      } else {
        throw new Error('No OAuth URL received');
      }
    } catch (error: any) {
      console.error('Error linking account:', error);
      toast.error(`Failed to start ${platform} linking: ${error.message}`);
      setLinkingPlatform(null);
    }
  };

  const saveAccountData = async (accountData: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('save-social-account', {
        body: accountData,
      });

      if (error) throw error;

      toast.success(`${accountData.platform} account linked successfully!`);
      fetchLinkedAccounts();
      onSaveSuccess();
    } catch (error: any) {
      console.error('Error saving account:', error);
      toast.error(`Failed to save ${accountData.platform} account: ${error.message}`);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-social-accounts');

      if (error) throw error;

      toast.success('Social accounts synced successfully!');
      fetchLinkedAccounts();
    } catch (error: any) {
      console.error('Error syncing accounts:', error);
      toast.error(`Failed to sync accounts: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleUnlink = async (platform: string) => {
    if (!confirm(`Are you sure you want to unlink your ${platform} account?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('unlink-social-account', {
        method: 'DELETE',
        body: { platform },
      });

      if (error) throw error;

      toast.success(`${platform} account unlinked successfully`);
      fetchLinkedAccounts();
      onSaveSuccess();
    } catch (error: any) {
      console.error('Error unlinking account:', error);
      toast.error(`Failed to unlink ${platform}: ${error.message}`);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'youtube': return <Youtube className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'tiktok': return <span className="text-lg font-bold">TT</span>;
      default: return null;
    }
  };

  const getPlatformName = (platform: string) => {
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  };

  const isLinked = (platform: string) => {
    return linkedAccounts.some(acc => acc.platform === platform);
  };

  const getLinkedAccount = (platform: string) => {
    return linkedAccounts.find(acc => acc.platform === platform);
  };

  const platforms = [
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'youtube', name: 'YouTube', icon: Youtube },
    { id: 'tiktok', name: 'TikTok', icon: null },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Link Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {platforms.map((platform) => {
          const linked = isLinked(platform.id);
          const account = getLinkedAccount(platform.id);
          const Icon = platform.icon;

          return (
            <Card key={platform.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5" />}
                    <CardTitle className="text-base">{platform.name}</CardTitle>
                  </div>
                  {linked && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Linked
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {linked && account ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">@{account.account_username}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.follower_count.toLocaleString()} followers
                    </p>
                    {account.last_synced_at && (
                      <p className="text-xs text-muted-foreground">
                        Last synced: {new Date(account.last_synced_at).toLocaleDateString()}
                      </p>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleUnlink(platform.id)}
                      className="w-full mt-2"
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Unlink
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => handleLinkAccount(platform.id)}
                    disabled={linkingPlatform === platform.id}
                    className="w-full"
                  >
                    {linkingPlatform === platform.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Linking...
                      </>
                    ) : (
                      <>
                        Link {platform.name}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sync Button */}
      {linkedAccounts.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="secondary"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </div>
  );
};

export default SocialAccountLinkForm;
