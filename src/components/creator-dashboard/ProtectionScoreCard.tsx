"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ShieldCheck, ArrowUp, ArrowDown, TrendingUp, FileText, AlertCircle, DollarSign, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProtectionScoreCardProps {
  score: number;
  changePercentage?: number;
  changeDirection?: 'up' | 'down' | 'neutral';
  statusDescription?: string;
  onUploadContract?: () => void;
  onResolveCopyright?: () => void;
  onSendPaymentReminder?: () => void;
}

interface ImprovementSuggestion {
  action: string;
  points: number;
  icon: React.ElementType;
  onClick?: () => void;
  link?: string;
}

const ProtectionScoreCard: React.FC<ProtectionScoreCardProps> = ({
  score,
  changePercentage = 3,
  changeDirection = 'up',
  statusDescription = 'Improving',
  onUploadContract,
  onResolveCopyright,
  onSendPaymentReminder,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Determine score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreBgGradient = (score: number) => {
    if (score >= 80) return 'from-green-500/20 to-emerald-500/10';
    if (score >= 60) return 'from-yellow-500/20 to-amber-500/10';
    if (score >= 40) return 'from-orange-500/20 to-red-500/10';
    return 'from-red-500/20 to-rose-500/10';
  };

  const scoreColor = getScoreColor(score);
  const bgGradient = getScoreBgGradient(score);
  const ChangeIcon = changeDirection === 'up' ? ArrowUp : changeDirection === 'down' ? ArrowDown : TrendingUp;
  const changeColor = changeDirection === 'up' ? 'text-green-500' : changeDirection === 'down' ? 'text-red-500' : 'text-muted-foreground';

  // Improvement suggestions
  const improvementSuggestions: ImprovementSuggestion[] = [
    {
      action: 'Upload 1 missing brand contract',
      points: 8,
      icon: FileText,
      onClick: onUploadContract,
    },
    {
      action: 'Resolve 1 copyright match on YouTube',
      points: 10,
      icon: AlertCircle,
      onClick: onResolveCopyright,
      link: '/creator-content-protection',
    },
    {
      action: 'Send payment reminder for overdue invoice',
      points: 5,
      icon: DollarSign,
      onClick: onSendPaymentReminder,
    },
  ];

  return (
    <>
      <Card 
        className={cn(
          "creator-card-base shadow-xl p-6 cursor-pointer hover:shadow-2xl transition-all duration-300 border-2",
          score >= 80 ? "border-green-500/30 hover:border-green-500/50" :
          score >= 60 ? "border-yellow-500/30 hover:border-yellow-500/50" :
          score >= 40 ? "border-orange-500/30 hover:border-orange-500/50" :
          "border-red-500/30 hover:border-red-500/50"
        )}
        onClick={() => setIsDialogOpen(true)}
      >
        <div className={cn("absolute inset-0 bg-gradient-to-br rounded-lg opacity-20", bgGradient)}></div>
        <div className="relative z-10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-0 pt-0">
            <CardTitle className="text-base font-semibold text-foreground">Your Protection Score</CardTitle>
            <div className="relative">
              <ShieldCheck className={cn("h-6 w-6", scoreColor)} />
              <span className={cn("absolute inset-0 rounded-full opacity-40 blur-md", scoreColor.replace('text-', 'bg-'))}></span>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className={cn("text-5xl font-extrabold mb-2", scoreColor)}>{score}%</div>
            <div className="flex items-center gap-2 text-sm">
              <ChangeIcon className={cn("h-4 w-4", changeColor)} />
              <span className={cn("font-semibold", changeColor)}>{statusDescription}</span>
              {changePercentage !== undefined && changePercentage > 0 && (
                <span className="text-muted-foreground">+{changePercentage}%</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 cursor-pointer hover:text-foreground transition-colors">
              Click to see how to improve →
            </p>
          </CardContent>
        </div>
      </Card>

      {/* Improvement Insights Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-card text-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <ShieldCheck className={cn("h-6 w-6", scoreColor)} />
              Your Protection Score: {score}%
            </DialogTitle>
            <DialogDescription className="text-base">
              <div className="flex items-center gap-2 mt-2">
                <ChangeIcon className={cn("h-5 w-5", changeColor)} />
                <span className={cn("font-semibold", changeColor)}>{statusDescription}</span>
                {changePercentage !== undefined && changePercentage > 0 && (
                  <span className="text-muted-foreground">+{changePercentage}% from last month</span>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Score Breakdown */}
            <div className="card p-4 rounded-lg border border-white/10">
              <h3 className="font-semibold text-lg mb-3">Score Breakdown</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contracts Uploaded</span>
                  <span className="font-semibold text-green-500">85%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Copyright Protection</span>
                  <span className="font-semibold text-yellow-500">70%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Recovery</span>
                  <span className="font-semibold text-orange-500">65%</span>
                </div>
              </div>
            </div>

            {/* How to Improve */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                How to improve next:
              </h3>
              <div className="space-y-3">
                {improvementSuggestions.map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <div
                      key={index}
                      className="card p-4 rounded-lg border border-white/10 hover:border-blue-500/30 transition-all cursor-pointer"
                      onClick={() => {
                        if (suggestion.onClick) {
                          suggestion.onClick();
                          setIsDialogOpen(false);
                        } else if (suggestion.link) {
                          window.location.href = suggestion.link;
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Icon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-foreground">{suggestion.action}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <span className="text-green-500 font-bold text-lg">+{suggestion.points}</span>
                          <span className="text-xs text-muted-foreground">points</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historical Trend */}
            <div className="card p-4 rounded-lg border border-white/10">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground">Recent Trend</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Last Month</p>
                  <p className="text-lg font-bold">69%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">This Month</p>
                  <p className={cn("text-lg font-bold", scoreColor)}>{score}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="text-lg font-bold text-green-500">85%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={() => {
                if (onUploadContract) {
                  onUploadContract();
                  setIsDialogOpen(false);
                }
              }}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Upload Contract
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                window.location.href = '/creator-content-protection';
              }}
              className="flex-1"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              View Copyright Matches
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProtectionScoreCard;

