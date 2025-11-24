"use client";

import React, { useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Search, CheckCircle, TrendingUp } from 'lucide-react';
import { OriginalContent, CopyrightMatch } from '@/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

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
    // For demo data (6 or fewer items), show enhanced demo stats
    const isDemoMode = originalContent.length <= 6 && originalContent.length > 0;
    const protectedCount = isDemoMode ? 18 : originalContent.length;
    
    // Calculate successful takedowns (matches with takedown action)
    const successfulTakedowns = matches.filter(match => 
      match.copyright_actions?.some(action => action.action_type === 'takedown')
    ).length;
    
    // For demo mode, show 7 takedowns (5 successful, 2 pending)
    const displayTakedowns = isDemoMode ? 7 : successfulTakedowns;

    // Calculate protection score based on:
    // - Number of protected pieces
    // - Number of matches found and acted upon
    // - Recent scans
    const baseScore = protectedCount > 0 ? 50 : 0;
    const takedownScore = Math.min(30, (displayTakedowns / Math.max(1, matches.length || 1)) * 30);
    const scanScore = Math.min(20, (scansThisMonth / 10) * 20);
    const protectionScore = Math.round(baseScore + takedownScore + scanScore);

    return {
      protectedCount,
      scansThisMonth,
      successfulTakedowns: displayTakedowns,
      protectionScore,
      isDemoMode,
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

  // Calculate protection streak
  const protectionStreak = useMemo(() => {
    // In real app, fetch from database - days with 100% score
    return stats.protectionScore === 100 ? 28 : 0;
  }, [stats.protectionScore]);

  // 100% Score Celebration
  useEffect(() => {
    if (stats.protectionScore === 100) {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#3B82F6', '#10B981', '#F59E0B'],
      });

      // Money-shield rain
      const duration = 3000;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          return;
        }
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#A855F7', '#F59E0B'],
          shapes: ['circle', 'square'],
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#A855F7', '#F59E0B'],
          shapes: ['circle', 'square'],
        });
      }, 200);
    }
  }, [stats.protectionScore]);

  return (
    <div className="space-y-6 mb-6">
      {/* Premium Icon Graphic */}
      <div className="flex justify-center mb-6 py-6 md:py-8 overflow-visible">
        <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse opacity-60"></div>
          
          {/* Icon Container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            {/* Premium Icon - Large Shield Icon with decorative elements */}
            <div className="relative">
              {/* Shield Box Icon */}
              <div className="w-32 h-32 md:w-40 md:h-40 bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 rounded-2xl shadow-2xl shadow-purple-500/40 flex items-center justify-center transform rotate-[-8deg] hover:rotate-[-5deg] transition-transform duration-300">
                <Shield className="w-16 h-16 md:w-20 md:h-20 text-white drop-shadow-lg" />
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl shadow-amber-500/50 flex items-center justify-center transform rotate-12 animate-bounce" style={{ animationDuration: '3s' }}>
                <span className="text-2xl md:text-3xl">🔒</span>
              </div>
              
              <div className="absolute -bottom-4 -left-4 w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-xl shadow-amber-500/50 flex items-center justify-center transform -rotate-12 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
                <span className="text-xl md:text-2xl">🛡️</span>
              </div>
              
              {/* Arrow pointing up */}
              <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 translate-x-4">
                <TrendingUp className="w-12 h-12 md:w-16 md:h-16 text-purple-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Shield className="w-7 h-7 text-purple-500" />
          Content Protection Center
        </h1>
        <p className="text-sm text-muted-foreground">
          NoticeBazaar scans major platforms automatically for stolen content using AI-powered visual + audio matching.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border border-white/5 hover:border-purple-600/60 transition-all">
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
          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-950/20 border border-white/5 hover:border-blue-600/60 transition-all">
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
          <Card className="bg-gradient-to-br from-emerald-900/20 to-emerald-950/20 border border-white/5 hover:border-emerald-600/60 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-medium text-muted-foreground">Takedowns</span>
              </div>
              <div className="text-3xl font-bold text-emerald-500 mb-1 tabular-nums">
                {stats.successfulTakedowns}
              </div>
              <div className="text-sm text-muted-foreground">
                {stats.isDemoMode ? 'processed this month (5 successful, 2 pending)' : 'successful this month'}
              </div>
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
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border border-white/5">
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-foreground">Protection Score</span>
                  </div>
                  <div className="relative">
                    {stats.protectionScore === 100 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute w-16 h-16 rounded-full border-2 border-purple-500/50 animate-ping" />
                        <div className="absolute w-16 h-16 rounded-full border-2 border-purple-400/30 animate-pulse" />
                      </div>
                    )}
                    <span className={cn("text-2xl font-bold relative z-10", getScoreColor(stats.protectionScore))}>
                      {stats.protectionScore}%
                    </span>
                    {/* Protection Streak Badge */}
                    {protectionStreak > 0 && (
                      <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-full text-xs font-semibold text-orange-400 backdrop-blur-sm z-20">
                        <span className="text-sm">🔥</span>
                        <span>{protectionStreak}-day streak</span>
                      </div>
                    )}
                  </div>
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
                    "bg-gradient-to-r from-red-600 to-red-800"
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

