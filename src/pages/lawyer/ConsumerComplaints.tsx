// Lawyer Complaint Dashboard - Manage consumer complaints
// Internal tool for lawyers/admins to review and process complaints

import { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Eye, CheckCircle, Upload, Download,
  Scale, Calendar, User, Building2, FileCheck, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Complaint {
  id: string;
  creator_id: string;
  category: string;
  category_name: string | null;
  company_name: string;
  issue_type: string;
  description: string;
  amount: number | null;
  proof_file_url: string | null;
  wants_lawyer_review: boolean;
  wants_notice_draft: boolean;
  status: 'draft_created' | 'lawyer_review_requested' | 'lawyer_review_completed' | 'notice_generated' | 'ready_to_file' | 'filed_by_user';
  severity: 'low' | 'medium' | 'high' | null;
  confidence_score: number | null;
  lawyer_reviewed_at: string | null;
  lawyer_reviewed_by: string | null;
  lawyer_review_notes: string | null;
  lawyer_review_suggestions: string | null;
  notice_draft_url: string | null;
  notice_generated_at: string | null;
  notice_generated_by: string | null;
  created_at: string;
  updated_at: string;
  // Extended fields
  creator?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; tooltip?: string }> = {
  draft_created: { label: 'Draft Created', color: 'text-gray-300', bgColor: 'bg-gray-500/20', tooltip: 'Complaint draft created, awaiting action' },
  lawyer_review_requested: { label: 'Review Requested', color: 'text-purple-300', bgColor: 'bg-purple-500/20', tooltip: 'User requested lawyer review before filing' },
  lawyer_review_completed: { label: 'Review Complete', color: 'text-blue-300', bgColor: 'bg-blue-500/20', tooltip: 'Lawyer review completed, ready for next step' },
  notice_generated: { label: 'Notice Generated', color: 'text-blue-300', bgColor: 'bg-blue-500/20', tooltip: 'Legal notice has been drafted and uploaded' },
  ready_to_file: { label: 'Ready to File', color: 'text-green-300', bgColor: 'bg-green-500/20', tooltip: 'Draft prepared, user can proceed independently' },
  filed_by_user: { label: 'Filed', color: 'text-emerald-300', bgColor: 'bg-emerald-500/20', tooltip: 'User has filed the complaint' },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: 'text-green-300', bgColor: 'bg-green-500/20' },
  medium: { label: 'Medium', color: 'text-amber-300', bgColor: 'bg-amber-500/20' },
  high: { label: 'High', color: 'text-red-300', bgColor: 'bg-red-500/20' },
};

type StatusFilter = 'all' | 'lawyer_review_requested' | 'notice_generated' | 'ready_to_file';


export default function ConsumerComplaints() {
  const { user } = useSession();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploadingNotice, setUploadingNotice] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [internalNotes, setInternalNotes] = useState('');

  // Fetch complaints
  useEffect(() => {
    fetchComplaints();
  }, []);

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
      const complaintsList: Complaint[] = data.complaints || [];

      // Fetch creator details for each complaint
      const creatorIds = [...new Set(complaintsList.map(c => c.creator_id))];
      const { data: profiles, error: profilesError } = await (supabase
        .from('profiles' as any)
        .select('id, first_name, last_name')
        .in('id', creatorIds as any) as any);

      // Fetch emails using RPC function (if available) or fallback
      let emailMap = new Map<string, string | null>();
      try {
        const { data: emails, error: emailsError } = await (supabase.rpc('get_user_emails', {
          user_ids: creatorIds,
        } as any) as any);
        if (!emailsError && emails && Array.isArray(emails)) {
          emailMap = new Map(emails.map((e: any) => [e.user_id, e.email]));
        }
      } catch (error) {
        console.warn('Could not fetch emails via RPC, continuing without emails');
      }

      // Map creator details to complaints
      const complaintsWithCreators = complaintsList.map(complaint => {
        const profilesArray = profiles && !profilesError && Array.isArray(profiles) ? profiles : [];
        const creatorProfile = profilesArray.find((p: any) => p && p.id === complaint.creator_id);
        const email = emailMap.get(complaint.creator_id) || null;
        return {
          ...complaint,
          creator: {
            first_name: creatorProfile?.first_name || null,
            last_name: creatorProfile?.last_name || null,
            email,
          },
        };
      });

      setComplaints(complaintsWithCreators);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleViewComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string, noticeDraftUrl?: string) => {
    if (!selectedComplaint || !user) return;

    setIsUpdating(true);
    try {
      const apiBaseUrl = getApiBaseUrl();
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const body: any = { status: newStatus };
      if (noticeDraftUrl) {
        body.notice_draft_url = noticeDraftUrl;
      }
      if (internalNotes.trim()) {
        body.lawyer_review_notes = internalNotes.trim();
      }

      const response = await fetch(`${apiBaseUrl}/api/complaints/${selectedComplaint.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to update complaint status');
      }

      const data = await response.json();
      setSelectedComplaint(data.complaint);

      // Clear internal notes after successful update
      setInternalNotes('');

      // Refresh list
      await fetchComplaints();

      toast.success('Complaint status updated');
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update complaint status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUploadNotice = async (file: File) => {
    if (!selectedComplaint || !user) return;

    setUploadingNotice(true);
    try {
      // Upload to complaint-proofs bucket
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedComplaint.id}/notice-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('complaint-proofs')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('complaint-proofs')
        .getPublicUrl(fileName);

      // Update complaint status
      await handleUpdateStatus('notice_generated', urlData.publicUrl);

      toast.success('Notice uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading notice:', error);
      toast.error('Failed to upload notice');
    } finally {
      setUploadingNotice(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getCreatorDisplayName = (complaint: Complaint) => {
    if (complaint.creator?.email) return complaint.creator.email;
    if (complaint.creator?.first_name || complaint.creator?.last_name) {
      return [complaint.creator.first_name, complaint.creator.last_name].filter(Boolean).join(' ');
    }
    return 'Unknown User';
  };

  // Filter complaints by status
  const filteredComplaints = useMemo(() => {
    if (statusFilter === 'all') return complaints;
    return complaints.filter(c => c.status === statusFilter);
  }, [complaints, statusFilter]);

  // Load internal notes when complaint is selected
  useEffect(() => {
    if (selectedComplaint) {
      setInternalNotes(selectedComplaint.lawyer_review_notes || '');
    }
  }, [selectedComplaint]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="text-white/60">Loading complaints...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Consumer Complaints</h1>
          <p className="text-white/60">Review and manage consumer complaints submitted by users</p>
        </div>

        {/* Status Filter Bar */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Filter className="w-5 h-5 text-white/60 mt-1.5" />
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              statusFilter === 'all'
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('lawyer_review_requested')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              statusFilter === 'lawyer_review_requested'
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            Review Requested
          </button>
          <button
            onClick={() => setStatusFilter('notice_generated')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              statusFilter === 'notice_generated'
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            Notice Drafted
          </button>
          <button
            onClick={() => setStatusFilter('ready_to_file')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              statusFilter === 'ready_to_file'
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            Ready to File
          </button>
        </div>

        {/* Complaints List */}
        {filteredComplaints.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center border border-white/10">
            <FileText className="w-16 h-16 mx-auto mb-4 text-white/40" />
            <p className="text-white/60 text-lg">
              {statusFilter === 'all' ? 'No complaints found' : `No complaints with status "${STATUS_CONFIG[statusFilter]?.label || statusFilter}"`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => {
              const statusConfig = STATUS_CONFIG[complaint.status] || STATUS_CONFIG.draft_created;
              return (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Building2 className="w-5 h-5 text-white/60 flex-shrink-0" />
                        <h3 className="font-semibold text-white truncate">{complaint.company_name}</h3>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={cn(
                                "px-2.5 py-1 rounded-full text-xs font-medium cursor-help",
                                statusConfig.color,
                                statusConfig.bgColor
                              )}>
                                {statusConfig.label}
                              </span>
                            </TooltipTrigger>
                            {statusConfig.tooltip && (
                              <TooltipContent className="bg-gray-900 border-gray-700 text-white max-w-xs">
                                <p>{statusConfig.tooltip}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                        {/* Severity Badge (AI-classified) */}
                        {complaint.severity && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className={cn(
                                  "px-2.5 py-1 rounded-full text-xs font-medium cursor-help",
                                  SEVERITY_CONFIG[complaint.severity].color,
                                  SEVERITY_CONFIG[complaint.severity].bgColor
                                )}>
                                  {SEVERITY_CONFIG[complaint.severity].label}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="bg-gray-900 border-gray-700 text-white max-w-xs">
                                <p>AI-classified severity{complaint.confidence_score ? ` (${Math.round(complaint.confidence_score * 100)}% confidence)` : ''}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      <div className="space-y-1 text-sm text-white/70 ml-8">
                        <div className="flex items-center gap-2">
                          <span className="text-white/50">Issue:</span>
                          <span>{complaint.issue_type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-white/50" />
                          <span>{getCreatorDisplayName(complaint)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-white/50" />
                          <span>{formatDate(complaint.created_at)}</span>
                        </div>
                        {complaint.proof_file_url && (
                          <div className="flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Proof uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleViewComplaint(complaint)}
                      className="bg-purple-600 hover:bg-purple-500 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Legal Disclaimer Footer */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-white/40 text-center">
            Drafting and review support only. Filing and legal action are outside platform scope.
          </p>
        </div>
      </div>

      {/* Complaint Detail Modal */}
      <AnimatePresence>
        {isDetailOpen && selectedComplaint && (
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="sm:max-w-3xl bg-gray-900 border-gray-800 text-white max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Complaint Details</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Review complaint information and take action
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Company & Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-white/60">Company Name</label>
                    <p className="text-white font-medium">{selectedComplaint.company_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Category</label>
                    <p className="text-white font-medium">{selectedComplaint.category_name || selectedComplaint.category}</p>
                  </div>
                  <div>
                    <label className="text-sm text-white/60">Issue Type</label>
                    <p className="text-white font-medium">{selectedComplaint.issue_type}</p>
                  </div>
                  {selectedComplaint.amount && (
                    <div>
                      <label className="text-sm text-white/60">Amount</label>
                      <p className="text-white font-medium">₹{selectedComplaint.amount.toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm text-white/60">Description</label>
                  <p className="text-white mt-1 whitespace-pre-wrap">{selectedComplaint.description}</p>
                </div>

                {/* Submitted By */}
                <div>
                  <label className="text-sm text-white/60">Submitted By</label>
                  <p className="text-white font-medium">{getCreatorDisplayName(selectedComplaint)}</p>
                  <p className="text-xs text-white/50 mt-1">{formatDate(selectedComplaint.created_at)}</p>
                </div>

                {/* AI Severity Classification (Lawyers only) */}
                {selectedComplaint.severity && (
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">AI Severity Classification</label>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium",
                        SEVERITY_CONFIG[selectedComplaint.severity].color,
                        SEVERITY_CONFIG[selectedComplaint.severity].bgColor
                      )}>
                        {SEVERITY_CONFIG[selectedComplaint.severity].label}
                      </span>
                      {selectedComplaint.confidence_score !== null && (
                        <span className="text-xs text-white/50">
                          ({Math.round(selectedComplaint.confidence_score * 100)}% confidence)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-1">For internal triage only</p>
                  </div>
                )}

                {/* Status Timeline */}
                <div>
                  <label className="text-sm text-white/60 mb-3 block">Status Timeline</label>
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

                {/* Toggle Indicators */}
                <div className="flex gap-4">
                  {selectedComplaint.wants_lawyer_review && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 rounded-lg border border-purple-400/30">
                      <Scale className="w-4 h-4 text-purple-300" />
                      <span className="text-sm text-purple-300">Lawyer Review Requested</span>
                    </div>
                  )}
                  {selectedComplaint.wants_notice_draft && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 rounded-lg border border-blue-400/30">
                      <FileText className="w-4 h-4 text-blue-300" />
                      <span className="text-sm text-blue-300">Notice Drafting Requested</span>
                    </div>
                  )}
                </div>

                {/* Proof Files */}
                {selectedComplaint.proof_file_url && (
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Proof File</label>
                    <a
                      href={selectedComplaint.proof_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Proof</span>
                    </a>
                  </div>
                )}

                {/* Drafted Notice */}
                {selectedComplaint.notice_draft_url && (
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">Drafted Notice</label>
                    <a
                      href={selectedComplaint.notice_draft_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Notice</span>
                    </a>
                  </div>
                )}

                {/* Internal Notes */}
                <div className="pt-4 border-t border-white/10">
                  <Label htmlFor="internal-notes" className="text-white/60 text-sm mb-2 block">
                    Internal notes (not visible to user)
                  </Label>
                  <Textarea
                    id="internal-notes"
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Add private notes for internal reference..."
                    rows={3}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 resize-none"
                  />
                  <p className="text-xs text-white/40 mt-1">These notes are only visible to lawyers and admins</p>
                </div>

                {/* Lawyer Actions */}
                <div className="pt-4 border-t border-white/10">
                  <h3 className="font-semibold text-white mb-3">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedComplaint.status === 'lawyer_review_requested' && (
                      <Button
                        onClick={() => handleUpdateStatus('lawyer_review_completed')}
                        disabled={isUpdating}
                        className="bg-purple-600 hover:bg-purple-500"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Review Complete
                      </Button>
                    )}

                    {selectedComplaint.wants_notice_draft && !selectedComplaint.notice_draft_url && (
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-4 h-4" />
                        <span>Upload Drafted Notice</span>
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUploadNotice(file);
                          }}
                          disabled={uploadingNotice}
                        />
                      </label>
                    )}

                    {selectedComplaint.status !== 'ready_to_file' && selectedComplaint.status !== 'filed_by_user' && (
                      <Button
                        onClick={() => handleUpdateStatus('ready_to_file')}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-500"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Ready to File
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

