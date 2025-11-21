"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ScanHistoryItem {
  id: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  matchesFound: number;
  platform: string;
  contentUrl: string;
}

interface ScanHistoryProps {
  scans: ScanHistoryItem[];
}

const ScanHistory: React.FC<ScanHistoryProps> = ({ scans }) => {
  if (scans.length === 0) return null;

  const getStatusIcon = (status: ScanHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ScanHistoryItem['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">Completed</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <Card className="bg-white/[0.06] backdrop-blur-[40px] border-white/10 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-purple-400" />
            Recent Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 bg-white/5 rounded-2xl p-2 border border-white/5">
            {scans.slice(0, 5).map((scan, index) => (
              <motion.div
                key={scan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all",
                  index < scans.slice(0, 5).length - 1 && "border-b border-white/5",
                  "hover:bg-white/5"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(scan.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">
                        {scan.platform} Scan
                      </span>
                      {getStatusBadge(scan.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(scan.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {scan.status === 'completed' && (
                    <div className="flex items-center gap-1">
                      {scan.matchesFound > 0 ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-500">
                            {scan.matchesFound}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-500">No matches</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {scans.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all {scans.length} scans
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ScanHistory;

