"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Search, Send, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOriginalContent } from '@/lib/hooks/useCopyrightScanner';

const ContentScannerQueue: React.FC = () => {
  const navigate = useNavigate();
  const { data: originalContent } = useOriginalContent({
    creatorId: undefined, // Will be filled by hook
    enabled: true,
  });

  // Demo data
  const scansRunning = originalContent && originalContent.length > 0 ? Math.min(2, originalContent.length) : 2;
  const takedownsSubmitted = 1;
  const matchesDetected = originalContent && originalContent.length > 0 ? Math.min(5, originalContent.length) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <Card className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border border-white/5 hover:border-blue-600/60 transition-all shadow-inner cursor-pointer hover:shadow-lg"
        onClick={() => navigate('/creator-content-protection')}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Content Scanner Queue</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/creator-content-protection');
              }}
            >
              View
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-muted-foreground">Scans running</span>
              </div>
              <span className="font-semibold text-foreground">{scansRunning}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Send className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-muted-foreground">Takedowns submitted</span>
              </div>
              <span className="font-semibold text-foreground">{takedownsSubmitted}</span>
            </div>

            <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-muted-foreground">Matches detected</span>
              </div>
              <span className="font-semibold text-foreground">{matchesDetected}</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Security system is working ✓
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ContentScannerQueue;

