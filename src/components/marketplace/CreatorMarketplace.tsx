import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Briefcase,
  Clock,
  DollarSign,
  MapPin,
  Users,
  Star,
  Calendar,
  Filter,
  Search,
  Plus,
  Heart,
  Bookmark,
  Share2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { trackEvent } from '@/lib/utils/analytics';

// Marketplace data types
export interface MarketplaceProject {
  id: string;
  title: string;
  description: string;
  brand: {
    id: string;
    name: string;
    logo?: string;
    verified: boolean;
    rating: number;
    completedProjects: number;
  };
  requirements: {
    contentType: string[];
    platform: string[];
    niche: string[];
    followerRange: [number, number];
    engagementRate: number;
    location?: string;
  };
  compensation: {
    type: 'fixed' | 'range' | 'negotiable';
    amount?: number;
    minAmount?: number;
    maxAmount?: number;
    currency: 'INR' | 'USD';
    paymentTerms: string;
  };
  timeline: {
    startDate: string;
    deadline: string;
    duration: string;
  };
  status: 'open' | 'in_review' | 'awarded' | 'completed' | 'cancelled';
  applications: number;
  views: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  featured: boolean;
}

export interface ProjectApplication {
  id: string;
  projectId: string;
  creatorId: string;
  creator: {
    name: string;
    handle: string;
    avatar?: string;
    rating: number;
    completedProjects: number;
    followers: number;
  };
  proposal: string;
  budget: number;
  timeline: string;
  portfolio: string[];
  status: 'pending' | 'shortlisted' | 'accepted' | 'rejected';
  submittedAt: string;
  attachments?: string[];
}

// Creator Marketplace Component
export const CreatorMarketplace: React.FC = () => {
  const { profile } = useSession();
  const [projects, setProjects] = useState<MarketplaceProject[]>([]);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [selectedProject, setSelectedProject] = useState<MarketplaceProject | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    budget: 'all',
    location: 'all',
    status: 'open',
    sortBy: 'newest'
  });
  const [showPostProject, setShowPostProject] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    const mockProjects: MarketplaceProject[] = [
      {
        id: 'proj-1',
        title: 'Summer Fashion Lookbook Content',
        description: 'Looking for fashion influencers to create authentic content showcasing our summer collection. Need creative storytelling with real-life scenarios.',
        brand: {
          id: 'brand-1',
          name: 'Fashion Forward',
          logo: '/brands/fashion-forward.png',
          verified: true,
          rating: 4.8,
          completedProjects: 127
        },
        requirements: {
          contentType: ['reel', 'post', 'story'],
          platform: ['instagram'],
          niche: ['fashion', 'lifestyle'],
          followerRange: [10000, 500000],
          engagementRate: 2.5,
          location: 'Delhi, Mumbai, Bangalore'
        },
        compensation: {
          type: 'range',
          minAmount: 15000,
          maxAmount: 45000,
          currency: 'INR',
          paymentTerms: '50% upfront, 50% after delivery'
        },
        timeline: {
          startDate: '2024-12-01',
          deadline: '2024-12-15',
          duration: '2 weeks'
        },
        status: 'open',
        applications: 23,
        views: 145,
        createdAt: '2024-11-15T10:00:00Z',
        updatedAt: '2024-11-15T10:00:00Z',
        tags: ['fashion', 'summer', 'lookbook', 'lifestyle'],
        featured: true
      },
      {
        id: 'proj-2',
        title: 'Tech Product Review & Unboxing',
        description: 'Need tech creators to review our latest smartphone. Focus on camera features, performance, and user experience.',
        brand: {
          id: 'brand-2',
          name: 'TechHub India',
          logo: '/brands/techhub.png',
          verified: true,
          rating: 4.6,
          completedProjects: 89
        },
        requirements: {
          contentType: ['reel', 'video', 'post'],
          platform: ['instagram', 'youtube'],
          niche: ['technology', 'gadgets', 'reviews'],
          followerRange: [25000, 1000000],
          engagementRate: 3.0
        },
        compensation: {
          type: 'fixed',
          amount: 35000,
          currency: 'INR',
          paymentTerms: '100% after delivery and approval'
        },
        timeline: {
          startDate: '2024-12-05',
          deadline: '2024-12-20',
          duration: '3 weeks'
        },
        status: 'open',
        applications: 45,
        views: 289,
        createdAt: '2024-11-20T14:30:00Z',
        updatedAt: '2024-11-20T14:30:00Z',
        tags: ['tech', 'review', 'unboxing', 'smartphone'],
        featured: false
      }
    ];

    setTimeout(() => {
      setProjects(mockProjects);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter(project => {
      if (filters.search && !project.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !project.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category !== 'all' && !project.tags.includes(filters.category)) {
        return false;
      }
      if (filters.budget !== 'all') {
        const budget = project.compensation;
        if (filters.budget === 'low' && budget.maxAmount && budget.maxAmount > 20000) return false;
        if (filters.budget === 'medium' && (!budget.maxAmount || budget.maxAmount < 20000 || budget.maxAmount > 100000)) return false;
        if (filters.budget === 'high' && budget.minAmount && budget.minAmount < 100000) return false;
      }
      if (filters.location !== 'all' && project.requirements.location &&
          !project.requirements.location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
      if (filters.status !== 'all' && project.status !== filters.status) return false;
      return true;
    });

    // Sort projects
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'budget_high':
          return (b.compensation.maxAmount || b.compensation.amount || 0) - (a.compensation.maxAmount || a.compensation.amount || 0);
        case 'budget_low':
          return (a.compensation.minAmount || a.compensation.amount || 0) - (b.compensation.minAmount || b.compensation.amount || 0);
        case 'applications':
          return b.applications - a.applications;
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, filters]);

  const handleApplyToProject = (project: MarketplaceProject) => {
    setSelectedProject(project);
    setShowApplicationDialog(true);
    trackEvent('marketplace_project_viewed', {
      project_id: project.id,
      brand_id: project.brand.id,
      creator_id: profile?.id
    });
  };

  const handleSubmitApplication = (applicationData: any) => {
    // Mock application submission
    const newApplication: ProjectApplication = {
      id: `app-${Date.now()}`,
      projectId: selectedProject!.id,
      creatorId: profile?.id || '',
      creator: {
        name: profile?.first_name + ' ' + profile?.last_name || 'Creator',
        handle: profile?.instagram_handle || 'creator',
        rating: 4.5,
        completedProjects: 15,
        followers: 25000
      },
      proposal: applicationData.proposal,
      budget: applicationData.budget,
      timeline: applicationData.timeline,
      portfolio: applicationData.portfolio || [],
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    setApplications(prev => [...prev, newApplication]);
    setShowApplicationDialog(false);

    trackEvent('marketplace_application_submitted', {
      project_id: selectedProject!.id,
      application_id: newApplication.id,
      creator_id: profile?.id
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Creator Marketplace</h1>
          <p className="text-muted-foreground">Find collaboration opportunities with top brands</p>
        </div>
        <Button onClick={() => setShowPostProject(true)} className="bg-info hover:bg-info">
          <Plus className="w-4 h-4 mr-2" />
          Post a Project
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search projects..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="tech">Technology</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="fitness">Fitness</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.budget} onValueChange={(value) => setFilters(prev => ({ ...prev, budget: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Budget" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budgets</SelectItem>
                <SelectItem value="low">Under ₹20K</SelectItem>
                <SelectItem value="medium">₹20K - ₹1L</SelectItem>
                <SelectItem value="high">Above ₹1L</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.location} onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Delhi">Delhi</SelectItem>
                <SelectItem value="Mumbai">Mumbai</SelectItem>
                <SelectItem value="Bangalore">Bangalore</SelectItem>
                <SelectItem value="Chennai">Chennai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="budget_high">Highest Budget</SelectItem>
                <SelectItem value="budget_low">Lowest Budget</SelectItem>
                <SelectItem value="applications">Most Applications</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your filters or check back later for new opportunities.
              </p>
              <Button variant="outline" onClick={() => setFilters({
                search: '',
                category: 'all',
                budget: 'all',
                location: 'all',
                status: 'open',
                sortBy: 'newest'
              })}>
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onApply={() => handleApplyToProject(project)}
              hasApplied={applications.some(app => app.projectId === project.id)}
            />
          ))
        )}
      </div>

      {/* Application Dialog */}
      <ApplicationDialog
        project={selectedProject}
        isOpen={showApplicationDialog}
        onClose={() => setShowApplicationDialog(false)}
        onSubmit={handleSubmitApplication}
      />

      {/* Post Project Dialog */}
      <PostProjectDialog
        isOpen={showPostProject}
        onClose={() => setShowPostProject(false)}
      />
    </div>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: MarketplaceProject;
  onApply: () => void;
  hasApplied: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onApply, hasApplied }) => {
  const formatBudget = () => {
    const comp = project.compensation;
    if (comp.type === 'fixed') {
      return `₹${comp.amount?.toLocaleString()}`;
    } else if (comp.type === 'range') {
      return `₹${comp.minAmount?.toLocaleString()} - ₹${comp.maxAmount?.toLocaleString()}`;
    }
    return 'Negotiable';
  };

  const getTimeLeft = () => {
    const deadline = new Date(project.timeline.deadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  return (
    <Card className={`hover:shadow-lg transition-shadow ${project.featured ? 'border-info bg-info/30' : ''}`}>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Brand Info */}
          <div className="flex items-start gap-3 lg:w-64">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              {project.brand.logo ? (
                <img src={project.brand.logo} alt={project.brand.name} className="w-8 h-8 rounded" />
              ) : (
                <div className="w-8 h-8 bg-info rounded text-foreground flex items-center justify-center font-bold text-sm">
                  {project.brand.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate">{project.brand.name}</h3>
                {project.brand.verified && <CheckCircle className="w-4 h-4 text-info flex-shrink-0" />}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-3 h-3 fill-current" />
                <span>{project.brand.rating}</span>
                <span>•</span>
                <span>{project.brand.completedProjects} projects</span>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h4 className="text-lg font-semibold">{project.title}</h4>
              {project.featured && (
                <Badge variant="secondary" className="bg-info text-info">
                  Featured
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground mb-3 line-clamp-2">{project.description}</p>

            <div className="flex flex-wrap gap-2 mb-3">
              {project.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Budget</div>
                <div className="font-semibold">{formatBudget()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Deadline</div>
                <div className="font-semibold">{getTimeLeft()}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Applications</div>
                <div className="font-semibold">{project.applications}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Platform</div>
                <div className="font-semibold capitalize">{project.requirements.platform.join(', ')}</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 lg:w-32">
            <Button
              onClick={onApply}
              disabled={hasApplied}
              className="w-full"
              variant={hasApplied ? "outline" : "default"}
            >
              {hasApplied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Applied
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Apply Now
                </>
              )}
            </Button>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Application Dialog Component
interface ApplicationDialogProps {
  project: MarketplaceProject | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ApplicationDialog: React.FC<ApplicationDialogProps> = ({
  project,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState({
    proposal: '',
    budget: '',
    timeline: '',
    portfolio: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Apply for: {project.title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Proposal</label>
            <Textarea
              placeholder="Explain why you're the right creator for this project..."
              value={formData.proposal}
              onChange={(e) => setFormData(prev => ({ ...prev, proposal: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Budget (₹)</label>
              <Input
                type="number"
                placeholder="Expected compensation"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Timeline</label>
              <Input
                placeholder="e.g., 2 weeks, 1 month"
                value={formData.timeline}
                onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Application
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Post Project Dialog Component
interface PostProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const PostProjectDialog: React.FC<PostProjectDialogProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    budget: '',
    deadline: '',
    requirements: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (import.meta.env.DEV) {
      console.log('Posting project:', formData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Post a New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Project Title</label>
            <Input
              placeholder="e.g., Summer Fashion Campaign"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              placeholder="Describe your project requirements..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="tech">Technology</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Budget (₹)</label>
              <Input
                type="number"
                placeholder="Project budget"
                value={formData.budget}
                onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Deadline</label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Requirements</label>
              <Input
                placeholder="e.g., Instagram, 10K+ followers"
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Post Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};