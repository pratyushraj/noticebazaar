

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingDown, AlertCircle, Users, FileText, ChevronDown, X, Zap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Recommendation {
  id: string;
  text: string;
  type: 'improvement' | 'warning' | 'action' | 'info';
  icon?: React.ReactNode;
  actionLabel?: string;
  relatedActions?: string[];
}

const RecommendationsPills: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'all' | 'improvement' | 'warning' | 'action' | 'info'>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  const recommendations: Recommendation[] = [
    {
      id: '1',
      text: 'Improve profile completeness',
      type: 'improvement',
      icon: <TrendingDown className="h-3 w-3" />,
      actionLabel: 'Complete Profile',
      relatedActions: ['Add profile photo', 'Update bio', 'Add portfolio link'],
    },
    {
      id: '2',
      text: 'Client average ticket decreased',
      type: 'warning',
      icon: <TrendingDown className="h-3 w-3" />,
      actionLabel: 'Analyze Trend',
      relatedActions: ['Review deal history', 'Adjust pricing', 'Target premium brands'],
    },
    {
      id: '3',
      text: 'Missing KYC verification',
      type: 'action',
      icon: <FileText className="h-3 w-3" />,
      actionLabel: 'Complete KYC',
      relatedActions: ['Upload Aadhaar', 'Bank details', 'Tax documents'],
    },
    {
      id: '4',
      text: '3 clients waiting for updates',
      type: 'info',
      icon: <Users className="h-3 w-3" />,
      actionLabel: 'Send Updates',
      relatedActions: ['Brand A', 'Brand B', 'Brand C'],
    },
    {
      id: '5',
      text: 'Review contract terms',
      type: 'action',
      icon: <AlertCircle className="h-3 w-3" />,
      actionLabel: 'Review Contracts',
      relatedActions: ['Update rates', 'Add terms', 'Set availability'],
    },
    {
      id: '6',
      text: 'Engagement rate trending up',
      type: 'info',
      icon: <Zap className="h-3 w-3" />,
      actionLabel: 'View Analytics',
      relatedActions: ['Share milestone', 'Update portfolio'],
    },
  ];

  const typeConfig = {
    improvement: {
      label: 'Improvements',
      badge: 'bg-info/20 text-info border-info/30',
      icon: 'text-info',
      description: 'Enhance your profile and offerings',
    },
    warning: {
      label: 'Warnings',
      badge: 'bg-destructive/20 text-destructive border-destructive/30',
      icon: 'text-destructive',
      description: 'Issues that need attention',
    },
    action: {
      label: 'Actions Required',
      badge: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
      icon: 'text-yellow-500',
      description: 'Complete to unlock features',
    },
    info: {
      label: 'Insights',
      badge: 'bg-secondary/20 text-secondary border-purple-500/30',
      icon: 'text-secondary',
      description: 'Positive trends and opportunities',
    },
  };

  const filteredRecs = recommendations.filter(rec => {
    if (dismissedIds.has(rec.id)) return false;
    return selectedType === 'all' || rec.type === selectedType;
  });

  const displayedRecs = showMore ? filteredRecs : filteredRecs.slice(0, 4);

  const typeCounts = {
    all: recommendations.filter(r => !dismissedIds.has(r.id)).length,
    improvement: recommendations.filter(r => r.type === 'improvement' && !dismissedIds.has(r.id)).length,
    warning: recommendations.filter(r => r.type === 'warning' && !dismissedIds.has(r.id)).length,
    action: recommendations.filter(r => r.type === 'action' && !dismissedIds.has(r.id)).length,
    info: recommendations.filter(r => r.type === 'info' && !dismissedIds.has(r.id)).length,
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(new Set([...dismissedIds, id]));
  };

  if (typeCounts.all === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-br from-background/50 to-slate-800/30 backdrop-blur-xl border border-border rounded-2xl shadow-lg">
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-foreground">Recommendations</h3>
              <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-xs">
                {typeCounts.all} active
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Personalized insights to grow your creator business</p>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'improvement', 'warning', 'action', 'info'] as const).map((type) => (
                <motion.button
                  key={type}
                  onClick={() => {
                    setSelectedType(type);
                    setShowMore(false);
                  }}
                  variants={{
                    initial: { scale: 0.95, opacity: 0 },
                    animate: { scale: 1, opacity: 1 },
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5',
                    selectedType === type
                      ? type === 'warning'
                        ? 'bg-destructive text-foreground shadow-lg shadow-red-600/30'
                        : type === 'action'
                        ? 'bg-yellow-600 text-foreground shadow-lg shadow-yellow-600/30'
                        : type === 'improvement'
                        ? 'bg-info text-foreground shadow-lg shadow-blue-600/30'
                        : type === 'info'
                        ? 'bg-secondary text-foreground shadow-lg shadow-purple-600/30'
                        : 'bg-background text-foreground shadow-lg shadow-slate-600/30'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary/15'
                  )}
                >
                  {type === 'all' ? 'All' : typeConfig[type]?.label}
                  <span className="text-xs font-bold">({typeCounts[type]})</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Recommendations List */}
          <motion.div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {displayedRecs.map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, delay: idx * 0.05 }}
                  className={cn(
                    'group p-3 rounded-xl border transition-all duration-200 overflow-hidden',
                    expandedId === rec.id
                      ? 'bg-secondary/50 border-border'
                      : 'bg-card border-border hover:bg-secondary/8 hover:border-border'
                  )}
                >
                  {/* Collapsed State */}
                  <div
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={cn("flex-shrink-0 p-1.5 rounded-lg bg-card border border-border", typeConfig[rec.type].icon)}>
                        {rec.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{rec.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{typeConfig[rec.type].description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <Badge
                        variant="outline"
                        className={cn("text-xs font-semibold border", typeConfig[rec.type].badge)}
                      >
                        {typeConfig[rec.type].label}
                      </Badge>
                      <button type="button"
                        onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)}
                        className="p-1 hover:bg-secondary/50 rounded transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <ChevronDown
                          className={cn('w-4 h-4 transition-transform', expandedId === rec.id && 'rotate-180')}
                        />
                      </button>
                      <button type="button"
                        onClick={() => handleDismiss(rec.id)}
                        className="p-1 hover:bg-secondary/50 rounded transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded State */}
                  <AnimatePresence>
                    {expandedId === rec.id && rec.relatedActions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-border"
                      >
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Related actions</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.relatedActions.map((action, idx) => (
                            <motion.button
                              key={idx}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="px-2.5 py-1 text-xs rounded-full bg-secondary/50 hover:bg-secondary/15 text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-border"
                            >
                              {action}
                            </motion.button>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className={cn(
                            "w-full mt-3 font-semibold text-foreground transition-all",
                            rec.type === 'warning'
                              ? 'bg-destructive hover:bg-destructive shadow-lg shadow-red-600/20'
                              : rec.type === 'action'
                              ? 'bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-600/20'
                              : rec.type === 'improvement'
                              ? 'bg-info hover:bg-info shadow-lg shadow-blue-600/20'
                              : 'bg-secondary hover:bg-secondary shadow-lg shadow-purple-600/20'
                          )}
                        >
                          {rec.actionLabel || 'Take Action'}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Show More / Load More */}
          {filteredRecs.length > 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-border"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMore(!showMore)}
                className="w-full text-xs font-semibold border-border hover:bg-secondary/50"
              >
                {showMore ? '− Show Less' : `+ Show ${filteredRecs.length - 4} More`}
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RecommendationsPills;
