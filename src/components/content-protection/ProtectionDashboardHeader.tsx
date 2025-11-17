"use client";

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Search, CheckCircle, TrendingUp } from 'lucide-react';
import { OriginalContent, CopyrightMatch } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ProtectionDashboardHeaderProps {
  originalContent: OriginalContent[];
  matches: CopyrightMatch[];
  scansThisMonth?: number;
}

const ProtectionDashboardHeader: React.FC<ProtectionDashboardHeaderProps> = ({
  originalContent,
  matches,
  scansThisMonth = 0,
}) => {
  const stats = useMemo(() => {
    const protectedCount = originalContent.length;
    
    // Calculate successful takedowns (matches with takedown action)
    const successfulTakedowns = matches.filter(match => 
      match.copyright_actions?.some(action => action.action_type === 'takedown')
    ).length;

    // Calculate protection score based on:
    // - Number of protected pieces
    // - Number of matches found and acted upon
    // - Recent scans
    const baseScore = protectedCount > 0 ? 50 : 0;
    const takedownScore = Math.min(30, (successfulTakedowns / Math.max(1, matches.length)) * 30);
    const scanScore = Math.min(20, (scansThisMonth / 10) * 20);
    const protectionScore = Math.round(baseScore + takedownScore + scanScore);

    return {
      protectedCount,
      scansThisMonth,
      successfulTakedowns,
      protectionScore,
    };
  }, [originalContent, matches, scansThisMonth]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Your content is well protected';
    if (score >= 60) return 'Good protection, room for improvement';
    return 'Start protecting your content';
  };

  return (
    <div className="space-y-6 mb-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="w-7 h-7 text-purple-500" />
          Content Protection Center
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor, scan, and protect your original content from theft
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border border-purple-700/40 hover:border-purple-600/60 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-muted-foreground">Protected</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                {stats.protectedCount}
              </div>
              <div className="text-sm text-muted-foreground">pieces of content</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-blue-700/40 hover:border-blue-600/60 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-muted-foreground">Scans Run</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1 tabular-nums">
                {stats.scansThisMonth}
              </div>
              <div className="text-sm text-muted-foreground">this month</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border border-emerald-700/40 hover:border-emerald-600/60 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">Takedowns</span>
              </div>
              <div className="text-3xl font-bold text-emerald-500 mb-1 tabular-nums">
                {stats.successfulTakedowns}
              </div>
              <div className="text-sm text-muted-foreground">successful this month</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Protection Score */}
      {stats.protectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border border-purple-700/40">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-foreground">Protection Score</span>
                </div>
                <span className={cn("text-2xl font-bold", getScoreColor(stats.protectionScore))}>
                  {stats.protectionScore}%
                </span>
              </div>
              <div className="relative h-3 bg-gray-800/50 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.protectionScore}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={cn(
                    "absolute inset-y-0 left-0 rounded-full",
                    stats.protectionScore >= 80 ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
                    stats.protectionScore >= 60 ? "bg-gradient-to-r from-yellow-500 to-yellow-400" :
                    "bg-gradient-to-r from-red-500 to-red-400"
                  )}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </motion.div>
              </div>
              <div className={cn("text-sm", getScoreColor(stats.protectionScore))}>
                {getScoreMessage(stats.protectionScore)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ProtectionDashboardHeader;

