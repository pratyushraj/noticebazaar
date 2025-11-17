"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyrightMatch } from '@/types';
import { ExternalLink, AlertTriangle, CheckCircle, XCircle, Send, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ScanResultsPreviewProps {
  matches: CopyrightMatch[];
  onTakeAction: (match: CopyrightMatch) => void;
  onViewDetails: (match: CopyrightMatch) => void;
}

const ScanResultsPreview: React.FC<ScanResultsPreviewProps> = ({
  matches,
  onTakeAction,
  onViewDetails,
}) => {
  if (matches.length === 0) return null;

  const getSimilarityColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-500/10 border-red-500/20';
    if (score >= 60) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower.includes('instagram')) return '📷';
    if (platformLower.includes('youtube')) return '▶️';
    if (platformLower.includes('tiktok')) return '🎵';
    if (platformLower.includes('facebook')) return '👤';
    if (platformLower.includes('twitter')) return '🐦';
    return '🌐';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="bg-card border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Scan Results
            </CardTitle>
            <Badge variant="destructive" className="text-sm">
              {matches.length} match{matches.length !== 1 ? 'es' : ''} found
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matches.slice(0, 5).map((match, index) => {
              const similarityScore = Math.round(match.similarity_score * 100);
              const hasAction = match.copyright_actions && match.copyright_actions.length > 0;
              const lastAction = match.copyright_actions?.[0];
              const isIgnored = lastAction?.action_type === 'ignored';
              const isTakedownSent = lastAction?.action_type === 'takedown';

              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-4 rounded-lg border transition-all",
                    similarityScore >= 80
                      ? "bg-red-500/10 border-red-500/30"
                      : similarityScore >= 60
                      ? "bg-orange-500/10 border-orange-500/30"
                      : "bg-yellow-500/10 border-yellow-500/30"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Screenshot/Thumbnail */}
                    {match.screenshot_url ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-border/40 flex-shrink-0">
                        <img
                          src={match.screenshot_url}
                          alt="Match preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full bg-muted flex items-center justify-center text-2xl">' + getPlatformIcon(match.platform) + '</div>';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-2xl flex-shrink-0">
                        {getPlatformIcon(match.platform)}
                      </div>
                    )}

                    {/* Match Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">
                              {match.platform}
                            </span>
                            <Badge
                              variant={similarityScore >= 80 ? 'destructive' : 'default'}
                              className={cn("text-xs", getSimilarityColor(similarityScore))}
                            >
                              {similarityScore}% similar
                            </Badge>
                          </div>
                          <a
                            href={match.matched_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1 truncate"
                          >
                            {match.matched_url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Action Status */}
                      {hasAction && (
                        <div className="flex items-center gap-2 mt-2">
                          {isTakedownSent ? (
                            <div className="flex items-center gap-1 text-xs text-green-500">
                              <CheckCircle className="w-3 h-3" />
                              <span>Takedown notice sent</span>
                            </div>
                          ) : isIgnored ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <XCircle className="w-3 h-3" />
                              <span>Ignored</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-blue-500">
                              <Send className="w-3 h-3" />
                              <span>Action taken</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-3">
                        {!hasAction && (
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onTakeAction(match)}
                            className="bg-red-500 hover:bg-red-600 text-white text-xs"
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Take Action
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewDetails(match)}
                          className="text-xs"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {matches.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all {matches.length} matches
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScanResultsPreview;

