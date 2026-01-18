"use client";

import React, { useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Search, UserPlus, TrendingUp, CheckCircle2, Clock, Target, Star, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Profile } from '@/types';
import { useInfluencerStats, useInfluencers } from '@/lib/hooks/useInfluencers';

const AdminDashboard = () => {
  const { session, loading, profile, isAdmin } = useSession();

  // Fetch influencer statistics
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useInfluencerStats();
  
  // Fetch high-fit influencers (fit_score >= 7)
  const { data: highFitData, isLoading: isLoadingHighFit } = useInfluencers({
    minFitScore: 7,
    limit: 5
  });
  
  // Fetch recent influencers
  const { data: recentData, isLoading: isLoadingRecent } = useInfluencers({
    limit: 5
  });

  useEffect(() => {
    if (statsError) {
      toast.error('Failed to load influencer statistics', { description: statsError.message });
    }
  }, [statsError]);

  const highFitInfluencers = highFitData?.influencers || [];
  const recentInfluencers = recentData?.influencers || [];

  return (
    <>
      <h1 className="text-3xl font-bold text-foreground mb-6">
        Influencer Dashboard, {profile?.first_name || 'Admin'}!
      </h1>

      {isLoadingStats ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="ml-3 text-lg text-muted-foreground">Loading influencer data...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Influencer Statistics Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Influencers</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Discovered influencers</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats?.new || 0}</div>
                <p className="text-xs text-muted-foreground">Ready to contact</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
                <Mail className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats?.contacted || 0}</div>
                <p className="text-xs text-muted-foreground">Outreach sent</p>
              </CardContent>
            </Card>
            <Card className="bg-card shadow-sm border border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.converted || 0}</div>
                <p className="text-xs text-muted-foreground">Successfully onboarded</p>
              </CardContent>
            </Card>
          </section>

          {/* High-Fit Influencers Widget */}
          {highFitInfluencers.length > 0 && (
            <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-foreground">High-Fit Influencers (7+ Score)</h2>
                </div>
                <Button variant="link" asChild>
                  <Link to="/admin-influencers?minFitScore=7" className="text-primary hover:text-primary/80">
                    View All
                  </Link>
                </Button>
              </div>
              {isLoadingHighFit ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {highFitInfluencers.slice(0, 5).map((influencer) => (
                    <div key={influencer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">@{influencer.instagram_handle}</p>
                          <p className="text-sm text-muted-foreground">
                            {influencer.followers.toLocaleString()} followers • {influencer.niche || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-yellow-600">
                          Score: {influencer.fit_score || 0}
                        </span>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin-influencers?handle=${influencer.instagram_handle}`}>
                            View
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Quick Actions */}
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-discovery">
                  <Search className="mr-2 h-5 w-5" /> Run Discovery Scan
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-influencers">
                  <Users className="mr-2 h-5 w-5" /> Manage Influencers
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-influencers?status=new">
                  <Target className="mr-2 h-5 w-5" /> New Influencers
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-influencers?status=contacted">
                  <Mail className="mr-2 h-5 w-5" /> Contacted
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-influencers?minFitScore=7">
                  <Star className="mr-2 h-5 w-5" /> High-Fit (7+)
                </Link>
              </Button>
              <Button asChild className="flex items-center justify-center p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground text-lg">
                <Link to="/admin-influencers?status=converted">
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Converted
                </Link>
              </Button>
            </div>
          </section>

          {/* Recent Influencers */}
          {recentInfluencers.length > 0 && (
            <section className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Recently Discovered</h2>
                <Button variant="link" asChild>
                  <Link to="/admin-influencers" className="text-primary hover:text-primary/80">
                    View All
                  </Link>
                </Button>
              </div>
              {isLoadingRecent ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {recentInfluencers.slice(0, 5).map((influencer) => (
                    <div key={influencer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {influencer.creator_name} (@{influencer.instagram_handle})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {influencer.followers.toLocaleString()} followers • 
                            {influencer.fit_score ? ` Score: ${influencer.fit_score}` : ' No score'} • 
                            {influencer.niche || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={influencer.profile_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View Profile
                        </a>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin-influencers?handle=${influencer.instagram_handle}`}>
                            Manage
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </>
  );
};

export default AdminDashboard;