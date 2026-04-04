import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Target,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Settings,
  BarChart3,
  MessageSquare,
  Eye,
  Heart,
  Share2,
  Zap,
  Award,
  XCircle
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { trackEvent } from '@/lib/utils/analytics';

// Campaign management data types
export interface Campaign {
  id: string;
  name: string;
  description: string;
  brandId: string;
  brand: {
    name: string;
    logo?: string;
    industry: string;
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
  objective: 'awareness' | 'engagement' | 'conversions' | 'sales' | 'traffic';
  budget: {
    total: number;
    spent: number;
    currency: 'INR' | 'USD';
    perCreator: number;
  };
  timeline: {
    startDate: string;
    endDate: string;
    duration: number; // days
  };
  targetAudience: {
    ageRange: string;
    gender: string[];
    interests: string[];
    locations: string[];
    followerRange: [number, number];
  };
  requirements: {
    contentTypes: string[];
    platforms: string[];
    deliverables: string[];
    guidelines: string;
    dosAndDonts: string[];
  };
  creators: CampaignCreator[];
  performance: CampaignPerformance;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignCreator {
  id: string;
  creator: {
    id: string;
    name: string;
    handle: string;
    avatar?: string;
    followers: number;
    engagementRate: number;
    niche: string[];
    location: string;
    rating: number;
  };
  status: 'invited' | 'accepted' | 'content_submitted' | 'approved' | 'published' | 'completed' | 'rejected';
  compensation: number;
  deliverables: {
    id: string;
    type: string;
    status: 'pending' | 'submitted' | 'approved' | 'rejected';
    submittedAt?: string;
    approvedAt?: string;
    feedback?: string;
    urls?: string[];
  }[];
  performance: {
    reach: number;
    engagement: number;
    clicks: number;
    conversions: number;
  };
  messages: CampaignMessage[];
  joinedAt: string;
}

export interface CampaignMessage {
  id: string;
  from: 'brand' | 'creator';
  fromId: string;
  fromName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

export interface CampaignPerformance {
  overview: {
    totalReach: number;
    totalEngagement: number;
    totalConversions: number;
    roi: number;
    costPerAcquisition: number;
  };
  byCreator: Array<{
    creatorId: string;
    creatorName: string;
    reach: number;
    engagement: number;
    conversions: number;
    roi: number;
  }>;
  timeline: Array<{
    date: string;
    reach: number;
    engagement: number;
    conversions: number;
  }>;
  content: Array<{
    creatorId: string;
    contentType: string;
    url: string;
    postedAt: string;
    reach: number;
    engagement: number;
    conversions: number;
  }>;
}

// Brand Campaign Manager Component
export const BrandCampaignManager: React.FC = () => {
  const { profile } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockCampaigns: Campaign[] = [
      {
        id: 'camp-1',
        name: 'Summer Fashion Collection Launch',
        description: 'Launch campaign for our new summer fashion collection targeting young professionals in metro cities.',
        brandId: profile?.id || 'brand-1',
        brand: {
          name: 'Fashion Forward',
          logo: '/brands/fashion-forward.png',
          industry: 'Fashion'
        },
        status: 'active',
        objective: 'engagement',
        budget: {
          total: 500000,
          spent: 125000,
          currency: 'INR',
          perCreator: 25000
        },
        timeline: {
          startDate: '2024-11-15',
          endDate: '2024-12-15',
          duration: 30
        },
        targetAudience: {
          ageRange: '18-35',
          gender: ['female', 'male'],
          interests: ['fashion', 'shopping', 'lifestyle'],
          locations: ['Delhi', 'Mumbai', 'Bangalore'],
          followerRange: [10000, 500000]
        },
        requirements: {
          contentTypes: ['reel', 'post', 'story'],
          platforms: ['instagram'],
          deliverables: ['3 Reels', '5 Posts', '10 Stories'],
          guidelines: 'Focus on authentic usage, show real-life scenarios, use brand colors',
          dosAndDonts: [
            'Do: Show genuine reactions and styling tips',
            'Do: Use location tags for brand visibility',
            'Don\'t: Use heavily edited/filtered photos',
            'Don\'t: Compare with other brands'
          ]
        },
        creators: [
          {
            id: 'creator-1',
            creator: {
              id: 'creator-1',
              name: 'Priya Sharma',
              handle: 'priya.reels',
              avatar: '/creators/priya.jpg',
              followers: 125000,
              engagementRate: 4.2,
              niche: ['fashion', 'lifestyle'],
              location: 'Delhi',
              rating: 4.8
            },
            status: 'content_submitted',
            compensation: 25000,
            deliverables: [
              {
                id: 'del-1',
                type: 'reel',
                status: 'approved',
                submittedAt: '2024-11-20T10:00:00Z',
                approvedAt: '2024-11-21T14:00:00Z',
                urls: ['https://instagram.com/p/abc123']
              }
            ],
            performance: {
              reach: 45000,
              engagement: 3200,
              clicks: 890,
              conversions: 23
            },
            messages: [
              {
                id: 'msg-1',
                from: 'creator',
                fromId: 'creator-1',
                fromName: 'Priya Sharma',
                message: 'Content submitted! Let me know if you need any changes.',
                timestamp: '2024-11-20T10:00:00Z'
              }
            ],
            joinedAt: '2024-11-16T09:00:00Z'
          }
        ],
        performance: {
          overview: {
            totalReach: 125000,
            totalEngagement: 8900,
            totalConversions: 67,
            roi: 2.8,
            costPerAcquisition: 1865
          },
          byCreator: [
            {
              creatorId: 'creator-1',
              creatorName: 'Priya Sharma',
              reach: 45000,
              engagement: 3200,
              conversions: 23,
              roi: 3.2
            }
          ],
          timeline: [
            { date: '2024-11-15', reach: 15000, engagement: 1200, conversions: 8 },
            { date: '2024-11-16', reach: 28000, engagement: 2100, conversions: 15 },
            { date: '2024-11-17', reach: 42000, engagement: 3200, conversions: 22 },
            { date: '2024-11-18', reach: 52000, engagement: 4100, conversions: 35 },
            { date: '2024-11-19', reach: 68000, engagement: 5400, conversions: 48 },
            { date: '2024-11-20', reach: 78000, engagement: 6300, conversions: 58 },
            { date: '2024-11-21', reach: 92000, engagement: 7200, conversions: 62 },
            { date: '2024-11-22', reach: 125000, engagement: 8900, conversions: 67 }
          ],
          content: [
            {
              creatorId: 'creator-1',
              contentType: 'reel',
              url: 'https://instagram.com/p/abc123',
              postedAt: '2024-11-20T10:00:00Z',
              reach: 45000,
              engagement: 3200,
              conversions: 23
            }
          ]
        },
        createdAt: '2024-11-15T08:00:00Z',
        updatedAt: '2024-11-22T16:00:00Z'
      }
    ];

    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setLoading(false);
    }, 1000);
  }, [profile?.id]);

  const campaignStats = useMemo(() => {
    const active = campaigns.filter(c => c.status === 'active').length;
    const completed = campaigns.filter(c => c.status === 'completed').length;
    const totalBudget = campaigns.reduce((sum, c) => sum + c.budget.total, 0);
    const totalSpent = campaigns.reduce((sum, c) => sum + c.budget.spent, 0);
    const totalReach = campaigns.reduce((sum, c) => sum + c.performance.overview.totalReach, 0);
    const totalEngagement = campaigns.reduce((sum, c) => sum + c.performance.overview.totalEngagement, 0);

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: active,
      completedCampaigns: completed,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      totalReach,
      totalEngagement,
      avgROI: campaigns.reduce((sum, c) => sum + c.performance.overview.roi, 0) / campaigns.length || 0
    };
  }, [campaigns]);

  const handleCreateCampaign = () => {
    setShowCreateCampaign(true);
    trackEvent('campaign_creation_started', { brand_id: profile?.id });
  };

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setActiveTab('campaign-detail');
    trackEvent('campaign_viewed', {
      campaign_id: campaign.id,
      brand_id: profile?.id
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-64"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Campaign Manager</h1>
          <p className="text-muted-foreground">Manage your brand collaborations and track performance</p>
        </div>
        <Button onClick={handleCreateCampaign} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Campaigns"
          value={campaignStats.activeCampaigns.toString()}
          icon={<Target className="h-5 w-5 text-blue-500" />}
          subtitle={`${campaignStats.totalCampaigns} total`}
        />
        <MetricCard
          title="Budget Spent"
          value={`₹${campaignStats.totalSpent.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-green-500" />}
          subtitle={`${campaignStats.budgetUtilization.toFixed(1)}% utilized`}
        />
        <MetricCard
          title="Total Reach"
          value={formatNumber(campaignStats.totalReach)}
          icon={<Eye className="h-5 w-5 text-purple-500" />}
          subtitle="Across all campaigns"
        />
        <MetricCard
          title="Average ROI"
          value={`${campaignStats.avgROI.toFixed(1)}x`}
          icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
          subtitle="Return on investment"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Campaign Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['active', 'completed', 'draft', 'paused'].map((status) => {
                    const count = campaigns.filter(c => c.status === status).length;
                    const percentage = campaigns.length > 0 ? (count / campaigns.length) * 100 : 0;

                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'active' ? 'bg-green-500' :
                            status === 'completed' ? 'bg-blue-500' :
                            status === 'draft' ? 'bg-gray-500' : 'bg-yellow-500'
                          }`} />
                          <span className="capitalize text-sm font-medium">{status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className={`w-2 h-2 rounded-full ${
                        campaign.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.creators.length} creators • ₹{campaign.budget.spent.toLocaleString()} spent
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCampaignSelect(campaign)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onSelect={() => handleCampaignSelect(campaign)}
            />
          ))}

          {campaigns.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first campaign to start collaborating with creators.
                </p>
                <Button onClick={handleCreateCampaign}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Campaign Detail Tab */}
        <TabsContent value="campaign-detail" className="space-y-6">
          {selectedCampaign && (
            <CampaignDetailView
              campaign={selectedCampaign}
              onBack={() => setActiveTab('campaigns')}
            />
          )}
        </TabsContent>

        {/* Creators Tab */}
        <TabsContent value="creators" className="space-y-4">
          <CampaignCreatorsView campaigns={campaigns} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <CampaignAnalyticsView campaigns={campaigns} />
        </TabsContent>
      </Tabs>

      {/* Create Campaign Dialog */}
      <CreateCampaignDialog
        isOpen={showCreateCampaign}
        onClose={() => setShowCreateCampaign(false)}
        onCreate={(campaignData) => {
          // Handle campaign creation
          console.log('Creating campaign:', campaignData);
          setShowCreateCampaign(false);
        }}
      />
    </div>
  );
};

// Campaign Card Component
interface CampaignCardProps {
  campaign: Campaign;
  onSelect: () => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign, onSelect }) => {
  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'paused': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
    }
  };

  const progress = (campaign.budget.spent / campaign.budget.total) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{campaign.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
          </div>
          <Badge className={getStatusColor(campaign.status)}>
            {campaign.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Creators</p>
            <p className="text-lg font-semibold">{campaign.creators.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Budget Spent</p>
            <p className="text-lg font-semibold">₹{campaign.budget.spent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Reach</p>
            <p className="text-lg font-semibold">{formatNumber(campaign.performance.overview.totalReach)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className="text-lg font-semibold">{campaign.performance.overview.roi.toFixed(1)}x</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Budget Progress</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-muted-foreground">
            {new Date(campaign.timeline.startDate).toLocaleDateString()} - {new Date(campaign.timeline.endDate).toLocaleDateString()}
          </span>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Campaign Detail View Component
interface CampaignDetailViewProps {
  campaign: Campaign;
  onBack: () => void;
}

const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({ campaign, onBack }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ← Back to Campaigns
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{campaign.name}</h2>
          <p className="text-muted-foreground">{campaign.description}</p>
        </div>
      </div>

      {/* Campaign Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{campaign.creators.length}</p>
                <p className="text-sm text-muted-foreground">Active Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">₹{campaign.budget.spent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Budget Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{campaign.performance.overview.roi.toFixed(1)}x</p>
                <p className="text-sm text-muted-foreground">ROI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Creator Management */}
      <Card>
        <CardHeader>
          <CardTitle>Creator Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaign.creators.map((creator) => (
              <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={creator.creator.avatar}
                    alt={creator.creator.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{creator.creator.name}</p>
                    <p className="text-sm text-muted-foreground">@{creator.creator.handle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{creator.compensation.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Compensation</p>
                  </div>

                  <Badge variant={
                    creator.status === 'completed' ? 'default' :
                    creator.status === 'approved' ? 'secondary' :
                    creator.status === 'submitted' ? 'outline' : 'destructive'
                  }>
                    {creator.status.replace('_', ' ')}
                  </Badge>

                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(campaign.performance.overview.totalReach)}
              </p>
              <p className="text-sm text-muted-foreground">Total Reach</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatNumber(campaign.performance.overview.totalEngagement)}
              </p>
              <p className="text-sm text-muted-foreground">Total Engagement</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {campaign.performance.overview.totalConversions}
              </p>
              <p className="text-sm text-muted-foreground">Conversions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                ₹{campaign.performance.overview.costPerAcquisition}
              </p>
              <p className="text-sm text-muted-foreground">Cost per Acquisition</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Campaign Creators View Component
const CampaignCreatorsView: React.FC<{ campaigns: Campaign[] }> = ({ campaigns }) => {
  const allCreators = campaigns.flatMap(campaign =>
    campaign.creators.map(creator => ({
      ...creator,
      campaignName: campaign.name,
      campaignId: campaign.id
    }))
  );

  return (
    <div className="space-y-4">
      {allCreators.map((creator) => (
        <Card key={`${creator.campaignId}-${creator.id}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={creator.creator.avatar}
                  alt={creator.creator.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-medium">{creator.creator.name}</p>
                  <p className="text-sm text-muted-foreground">@{creator.creator.handle}</p>
                  <p className="text-xs text-muted-foreground">{creator.campaignName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">₹{creator.compensation.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Compensation</p>
                </div>

                <div className="text-right">
                  <p className="font-medium">{formatNumber(creator.performance.reach)}</p>
                  <p className="text-xs text-muted-foreground">Reach</p>
                </div>

                <Badge variant={
                  creator.status === 'completed' ? 'default' :
                  creator.status === 'approved' ? 'secondary' :
                  creator.status === 'submitted' ? 'outline' : 'destructive'
                }>
                  {creator.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Campaign Analytics View Component
const CampaignAnalyticsView: React.FC<{ campaigns: Campaign[] }> = ({ campaigns }) => {
  const totalMetrics = campaigns.reduce((acc, campaign) => ({
    reach: acc.reach + campaign.performance.overview.totalReach,
    engagement: acc.engagement + campaign.performance.overview.totalEngagement,
    conversions: acc.conversions + campaign.performance.overview.totalConversions,
    spent: acc.spent + campaign.budget.spent,
    roi: acc.roi + campaign.performance.overview.roi
  }), { reach: 0, engagement: 0, conversions: 0, spent: 0, roi: 0 });

  const avgROI = totalMetrics.roi / campaigns.length || 0;

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{formatNumber(totalMetrics.reach)}</p>
                <p className="text-sm text-muted-foreground">Total Reach</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-xl font-bold">{formatNumber(totalMetrics.engagement)}</p>
                <p className="text-sm text-muted-foreground">Total Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-xl font-bold">{avgROI.toFixed(1)}x</p>
                <p className="text-sm text-muted-foreground">Average ROI</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-xl font-bold">₹{totalMetrics.spent.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{campaign.name}</h4>
                  <p className="text-sm text-muted-foreground">{campaign.creators.length} creators</p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{formatNumber(campaign.performance.overview.totalReach)}</p>
                    <p className="text-xs text-muted-foreground">Reach</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{campaign.performance.overview.roi.toFixed(1)}x</p>
                    <p className="text-xs text-muted-foreground">ROI</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">₹{campaign.budget.spent.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Spent</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Create Campaign Dialog Component
interface CreateCampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (campaignData: any) => void;
}

const CreateCampaignDialog: React.FC<CreateCampaignDialogProps> = ({ isOpen, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: 'engagement',
    budget: '',
    startDate: '',
    endDate: '',
    targetAudience: {
      ageRange: '18-35',
      gender: ['female', 'male'],
      interests: [],
      locations: []
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Campaign</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              placeholder="e.g., Summer Collection Launch"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              rows={3}
              placeholder="Describe your campaign goals and requirements"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Objective</label>
              <Select value={formData.objective} onValueChange={(value) => setFormData(prev => ({ ...prev, objective: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="awareness">Brand Awareness</SelectItem>
                  <SelectItem value="engagement">Audience Engagement</SelectItem>
                  <SelectItem value="conversions">Drive Conversions</SelectItem>
                  <SelectItem value="sales">Increase Sales</SelectItem>
                  <SelectItem value="traffic">Drive Website Traffic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Total Budget (₹)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                placeholder="50000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Helper function
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, subtitle }) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="p-3 rounded-xl bg-muted">
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);