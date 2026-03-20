"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  FileText,
  Download,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';

interface Complaint {
  id: string;
  category: string;
  category_name: string | null;
  company_name: string;
  issue_type: string;
  description: string;
  amount: number | null;
  status: 'draft_created' | 'lawyer_review_requested' | 'lawyer_review_completed' | 'notice_generated' | 'ready_to_file' | 'filed_by_user';
  notice_draft_url: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  draft_created: {
    label: 'Draft Created',
    color: 'text-gray-300',
    bgColor: 'bg-gray-500/20',
    icon: FileText
  },
  lawyer_review_requested: {
    label: 'Under Review',
    color: 'text-blue-300',
    bgColor: 'bg-blue-500/20',
    icon: Clock
  },
  lawyer_review_completed: {
    label: 'Review Completed',
    color: 'text-purple-300',
    bgColor: 'bg-purple-500/20',
    icon: CheckCircle2
  },
  notice_generated: {
    label: 'Notice Ready',
    color: 'text-green-300',
    bgColor: 'bg-green-500/20',
    icon: FileText
  },
  ready_to_file: {
    label: 'Ready to File',
    color: 'text-yellow-300',
    bgColor: 'bg-yellow-500/20',
    icon: AlertCircle
  },
  filed_by_user: {
    label: 'Filed',
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-500/20',
    icon: CheckCircle2
  },
};


const MyConsumerComplaintsPage: React.FC = () => {
  const { profile, user } = useSession();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const fetchComplaints = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch(`${apiBaseUrl}/api/complaints`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      const data = await response.json();
      setComplaints(data.complaints || []);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadNotice = (url: string) => {
    window.open(url, '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!profile) {
    return (
      <div className="nb-screen-height flex items-center justify-center">
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <div className="nb-screen-height bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-purple-400" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                My Complaints
              </h1>
            </div>
            <p className="text-white/70 text-lg mt-2">
              Track and manage your consumer complaints.
            </p>
          </div>

          {/* Complaints List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white/60">Loading complaints...</div>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <p className="text-white/60 text-lg mb-4">No complaints yet</p>
              <Button
                onClick={() => navigate('/lifestyle/consumer-complaints')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                Raise Your First Complaint
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {complaints.map((complaint) => {
                const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.draft_created;
                const StatusIcon = statusConfig.icon;

                return (
                  <Card
                    key={complaint.id}
                    variant="tertiary"
                    className="group hover:scale-[1.02] transition-transform duration-200 bg-white/5 border-white/10"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="w-4 h-4 text-white/60" />
                              <h3 className="text-lg font-semibold text-white truncate">
                                {complaint.company_name}
                              </h3>
                            </div>
                            <p className="text-sm text-white/60">
                              {complaint.category_name || complaint.category}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5",
                            statusConfig.bgColor,
                            statusConfig.color
                          )}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </div>
                        </div>

                        {/* Issue Type */}
                        <div>
                          <p className="text-xs text-white/40 mb-1">Issue Type</p>
                          <p className="text-sm text-white/80">{complaint.issue_type}</p>
                        </div>

                        {/* Amount */}
                        {complaint.amount && (
                          <div>
                            <p className="text-xs text-white/40 mb-1">Amount</p>
                            <p className="text-sm text-white/80">₹{complaint.amount.toLocaleString('en-IN')}</p>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <Calendar className="w-3 h-3" />
                          <span>Created {formatDate(complaint.created_at)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-white/10">
                          <Button
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setShowDetails(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-white/20 text-white/80 hover:bg-white/10"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          {complaint.notice_draft_url && (
                            <Button
                              onClick={() => handleDownloadNotice(complaint.notice_draft_url!)}
                              size="sm"
                              className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/30 text-purple-200 hover:text-purple-100"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Complaint Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(false)}
                  className="text-white/60 hover:text-white"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/60 mb-1">Company</p>
                  <p className="text-white">{selectedComplaint.company_name}</p>
                </div>

                <div>
                  <p className="text-sm text-white/60 mb-1">Category</p>
                  <p className="text-white">{selectedComplaint.category_name || selectedComplaint.category}</p>
                </div>

                <div>
                  <p className="text-sm text-white/60 mb-1">Issue Type</p>
                  <p className="text-white">{selectedComplaint.issue_type}</p>
                </div>

                <div>
                  <p className="text-sm text-white/60 mb-1">Description</p>
                  <p className="text-white/90">{selectedComplaint.description}</p>
                </div>

                {selectedComplaint.amount && (
                  <div>
                    <p className="text-sm text-white/60 mb-1">Amount</p>
                    <p className="text-white">₹{selectedComplaint.amount.toLocaleString('en-IN')}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-white/60 mb-1">Status</p>
                  <div className="flex items-center gap-2 mb-4">
                    {(() => {
                      const statusConfig = STATUS_CONFIG[selectedComplaint.status] || STATUS_CONFIG.draft_created;
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div className={cn(
                          "px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2",
                          statusConfig.bgColor,
                          statusConfig.color
                        )}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig.label}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Status Timeline */}
                  <div>
                    <p className="text-sm text-white/60 mb-3">Status Timeline</p>
                    <div className="space-y-2">
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg",
                        selectedComplaint.status !== 'draft_created' ? "bg-green-500/10 border border-green-500/20" : "bg-gray-500/10 border border-gray-500/20"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          selectedComplaint.status !== 'draft_created' ? "bg-green-400" : "bg-gray-400"
                        )} />
                        <span className={cn(
                          "text-sm",
                          selectedComplaint.status !== 'draft_created' ? "text-green-300" : "text-gray-400"
                        )}>Draft Created</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg",
                        ['lawyer_review_requested', 'lawyer_review_completed', 'notice_generated', 'ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-gray-500/10 border border-gray-500/20"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          ['lawyer_review_requested', 'lawyer_review_completed', 'notice_generated', 'ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                            ? "bg-green-400"
                            : "bg-gray-400"
                        )} />
                        <span className={cn(
                          "text-sm",
                          ['lawyer_review_requested', 'lawyer_review_completed', 'notice_generated', 'ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                            ? "text-green-300"
                            : "text-gray-400"
                        )}>Lawyer Review Requested</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg",
                        ['notice_generated', 'ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-gray-500/10 border border-gray-500/20"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          ['notice_generated', 'ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                            ? "bg-green-400"
                            : "bg-gray-400"
                        )} />
                        <span className={cn(
                          "text-sm",
                          ['notice_generated', 'ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                            ? "text-green-300"
                            : "text-gray-400"
                        )}>Notice Generated</span>
                      </div>
                      <div className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg",
                        ['ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                          ? "bg-green-500/10 border border-green-500/20"
                          : "bg-gray-500/10 border border-gray-500/20"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          ['ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                            ? "bg-green-400"
                            : "bg-gray-400"
                        )} />
                        <span className={cn(
                          "text-sm",
                          ['ready_to_file', 'filed_by_user'].includes(selectedComplaint.status)
                            ? "text-green-300"
                            : "text-gray-400"
                        )}>Ready to File</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/60 mb-1">Created</p>
                    <p className="text-white/90">{formatDate(selectedComplaint.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 mb-1">Last Updated</p>
                    <p className="text-white/90">{formatDate(selectedComplaint.updated_at)}</p>
                  </div>
                </div>

                {selectedComplaint.notice_draft_url && (
                  <div className="pt-4 border-t border-white/10">
                    <Button
                      onClick={() => handleDownloadNotice(selectedComplaint.notice_draft_url!)}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Legal Notice
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default MyConsumerComplaintsPage;

