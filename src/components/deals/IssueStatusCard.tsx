import React from 'react';
import { AlertCircle, Clock, CheckCircle, HelpCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export interface IssueStatus {
  id: string;
  issueType: string;
  status: 'pending' | 'under_review' | 'resolved';
  assignedTeam?: 'legal' | 'ca' | 'support';
  lastUpdated: string;
  userLastMessage?: string;
  createdAt: string;
}

interface IssueStatusCardProps {
  issue: IssueStatus;
  onViewHistory?: () => void;
  onUpdateIssue?: () => void;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
  },
  under_review: {
    label: 'Under Review',
    icon: HelpCircle,
    color: 'text-info',
    bgColor: 'bg-info/20',
    borderColor: 'border-info/30',
  },
  resolved: {
    label: 'Resolved',
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
};

const teamConfig = {
  legal: { label: 'Legal Team', color: 'text-secondary' },
  ca: { label: 'CA Team', color: 'text-info' },
  support: { label: 'Support Team', color: 'text-green-300' },
};

export const IssueStatusCard: React.FC<IssueStatusCardProps> = ({
  issue,
  onViewHistory,
  onUpdateIssue,
}) => {
  const status = statusConfig[issue.status];
  const StatusIcon = status.icon;
  const team = issue.assignedTeam ? teamConfig[issue.assignedTeam] : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-800/30 via-purple-900/20 to-indigo-900/20 backdrop-blur-xl rounded-2xl p-5 border border-border shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${status.bgColor} rounded-lg`}>
            <AlertCircle className={`w-5 h-5 ${status.color}`} />
          </div>
          <div>
            <h3 className="text-foreground font-semibold">Issue Status</h3>
            <p className="text-xs text-secondary">ID: {issue.id}</p>
          </div>
        </div>
        <div
          className={`px-3 py-1.5 rounded-full border ${status.borderColor} ${status.bgColor} flex items-center gap-2`}
        >
          <StatusIcon className={`w-4 h-4 ${status.color}`} />
          <span className={`text-sm font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/60">Issue Type:</span>
          <span className="text-foreground font-medium capitalize">
            {issue.issueType.replace(/_/g, ' ')}
          </span>
        </div>

        {team && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Assigned Team:</span>
            <span className={`font-medium ${team.color}`}>{team.label}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-foreground/60">Last Updated:</span>
          <span className="text-foreground/80">{formatDate(issue.lastUpdated)}</span>
        </div>

        {issue.userLastMessage && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-secondary mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground/60 mb-1">Your Last Message:</p>
                <p className="text-sm text-foreground/80 line-clamp-2">
                  {issue.userLastMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border">
        {onViewHistory && (
          <button type="button"
            onClick={onViewHistory}
            className="flex-1 px-4 py-2.5 bg-card hover:bg-secondary/50 border border-border rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm text-foreground"
          >
            <ExternalLink className="w-4 h-4" />
            View History
          </button>
        )}
        {onUpdateIssue && (
          <button type="button"
            onClick={onUpdateIssue}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-foreground font-medium rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
          >
            <MessageSquare className="w-4 h-4" />
            Update Issue
          </button>
        )}
      </div>
    </motion.div>
  );
};

