"use client";

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  Search, 
  ExternalLink, 
  Mail, 
  Globe,
  Filter,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Home
} from 'lucide-react';
import { useInfluencers, useUpdateInfluencerStatus, useInfluencerStats, Influencer } from '@/lib/hooks/useInfluencers';
import { formatDate } from '@/lib/utils/date';

const AdminInfluencers = () => {
  const { session, loading: sessionLoading, isAdmin } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [minFitScore, setMinFitScore] = useState<number | undefined>(undefined);

  // Fetch influencers
  const { data: influencersData, isLoading, error, refetch } = useInfluencers({
    status: statusFilter !== 'all' ? statusFilter as any : undefined,
    niche: nicheFilter !== 'all' ? nicheFilter : undefined,
    minFitScore,
    limit: 100,
  });

  // Fetch stats
  const { data: stats } = useInfluencerStats();

  // Update status mutation
  const updateStatusMutation = useUpdateInfluencerStatus();

  const influencers = influencersData?.influencers || [];
  const filteredInfluencers = influencers.filter((inf: Influencer) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        inf.creator_name?.toLowerCase().includes(query) ||
        inf.instagram_handle?.toLowerCase().includes(query) ||
        inf.bio?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleStatusUpdate = async (id: string, newStatus: Influencer['status']) => {
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus });
      toast.success('Status updated successfully');
    } catch (error: any) {
      toast.error('Failed to update status', { description: error.message });
    }
  };

  const getStatusBadge = (status: Influencer['status']) => {
    const variants: Record<Influencer['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
      new: { variant: 'default', icon: Clock },
      contacted: { variant: 'secondary', icon: UserCheck },
      replied: { variant: 'outline', icon: CheckCircle2 },
      not_interested: { variant: 'destructive', icon: XCircle },
      converted: { variant: 'default', icon: CheckCircle2 },
    };
    return variants[status] || variants.new;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Instagram Handle', 'Followers', 'Niche', 'Fit Score', 'Status', 'Email', 'Website', 'Profile Link'];
    const rows = filteredInfluencers.map((inf: Influencer) => [
      inf.creator_name,
      inf.instagram_handle,
      inf.followers,
      inf.niche || '',
      inf.fit_score || '',
      inf.status,
      inf.email || '',
      inf.website || '',
      inf.profile_link,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `influencers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  if (sessionLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Button
            asChild
            variant="outline"
            size="default"
            className="gap-2"
          >
            <Link to="/admin-dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Influencer Management</h1>
        </div>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Link to="/admin-dashboard">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Influencers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">New</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.contacted}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.converted}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search influencers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={nicheFilter} onValueChange={setNicheFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Niche" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Niches</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="tech">Tech</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
                <SelectItem value="ugc">UGC</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Min Fit Score"
              value={minFitScore || ''}
              onChange={(e) => setMinFitScore(e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Influencers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Influencers ({filteredInfluencers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading influencers: {error.message}</p>
            </div>
          ) : filteredInfluencers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No influencers found. Run a discovery scan to find influencers.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Instagram</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Fit Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInfluencers.map((influencer: Influencer) => {
                    const statusBadge = getStatusBadge(influencer.status);
                    const StatusIcon = statusBadge.icon;
                    return (
                      <TableRow key={influencer.id}>
                        <TableCell className="font-medium">{influencer.creator_name}</TableCell>
                        <TableCell>
                          <a
                            href={influencer.profile_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            @{influencer.instagram_handle}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </TableCell>
                        <TableCell>{influencer.followers.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{influencer.niche || 'Unknown'}</Badge>
                        </TableCell>
                        <TableCell>
                          {influencer.fit_score ? (
                            <Badge variant={influencer.fit_score >= 7 ? 'default' : 'secondary'}>
                              {influencer.fit_score}/10
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadge.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {influencer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {influencer.email && (
                              <a href={`mailto:${influencer.email}`} className="text-primary hover:underline">
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            {influencer.website && (
                              <a href={influencer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                <Globe className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={influencer.status}
                            onValueChange={(value) => handleStatusUpdate(influencer.id, value as Influencer['status'])}
                            disabled={updateStatusMutation.isPending}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="replied">Replied</SelectItem>
                              <SelectItem value="not_interested">Not Interested</SelectItem>
                              <SelectItem value="converted">Converted</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInfluencers;

