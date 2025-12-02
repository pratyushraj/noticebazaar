import React from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  CheckCircle,
  FileText,
  DollarSign,
  AlertCircle,
  MessageSquare,
  Calendar,
  Clock,
} from 'lucide-react';

export interface ActionLogEntry {
  id: string;
  action: string;
  type: 'upload' | 'complete' | 'invoice' | 'payment' | 'issue' | 'update' | 'other';
  timestamp: string;
  user?: string;
  metadata?: Record<string, any>;
}

interface ActionLogProps {
  entries: ActionLogEntry[];
}

const actionConfig: Record<
  ActionLogEntry['type'],
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  upload: {
    icon: Upload,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
  },
  complete: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
  },
  invoice: {
    icon: FileText,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
  },
  payment: {
    icon: DollarSign,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
  },
  issue: {
    icon: AlertCircle,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
  },
  update: {
    icon: MessageSquare,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
  },
  other: {
    icon: Clock,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
  },
};

export const ActionLog: React.FC<ActionLogProps> = ({ entries }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/30 via-purple-400/20 to-transparent" />

      {/* Entries */}
      <div className="space-y-4">
        {entries.map((entry, index) => {
          const config = actionConfig[entry.type] || actionConfig.other;
          const Icon = config.icon;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex items-start gap-4"
            >
              {/* Timeline marker */}
              <div className={`relative z-10 p-2 ${config.bgColor} rounded-full border-2 border-purple-900/50`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-white font-medium text-sm">{entry.action}</h4>
                  <span className="text-xs text-white/50 flex-shrink-0">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>

                {entry.user && (
                  <p className="text-xs text-purple-300 mb-2">by {entry.user}</p>
                )}

                {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(entry.metadata).map(([key, value]) => (
                        <span
                          key={key}
                          className="text-xs px-2 py-1 bg-white/5 rounded-lg text-white/70"
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

