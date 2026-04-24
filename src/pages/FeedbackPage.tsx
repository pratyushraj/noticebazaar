

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

import { cn } from '@/lib/utils';
import { gradients, typography } from '@/lib/design-system';

const FeedbackPage = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setError('Report ID is missing');
      setLoading(false);
      return;
    }

    const fetchReport = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('protection_reports')
          .select('*, analysis_json, contract_file_url, created_at')
          .eq('id', reportId)
          .single();

        if (fetchError) {
          console.error('[FeedbackPage] Fetch error:', fetchError);
          setError('Report not found or access denied');
          setLoading(false);
          return;
        }

        if (!data) {
          setError('Report not found');
          setLoading(false);
          return;
        }

        setReport(data);
      } catch (err: any) {
        console.error('[FeedbackPage] Exception:', err);
        setError('Failed to load report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className={cn("nb-screen-height flex items-center justify-center", gradients.page, "text-foreground")}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-secondary" />
          <p className="text-foreground/70">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={cn("nb-screen-height flex items-center justify-center p-4", gradients.page, "text-foreground")}>
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className={cn(typography.h2, "mb-2")}>Report Not Found</h1>
          <p className="text-foreground/70 mb-6">{error || 'The report you are looking for does not exist or has been removed.'}</p>
          <motion.button
            onClick={() => navigate('/creator-dashboard')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-3 bg-secondary hover:bg-secondary rounded-xl font-semibold transition-all"
          >
            <ArrowLeft className="w-4 h-4 inline mr-2" />
            Return to Dashboard
          </motion.button>
        </div>
      </div>
    );
  }

  const analysis = report.analysis_json || {};
  const score = analysis.protectionScore || analysis.score || 0;
  const issues = analysis.issues || [];
  const keyTerms = analysis.keyTerms || {};

  const getRiskColor = (score: number) => {
    if (score >= 71) return 'text-green-400';
    if (score >= 41) return 'text-warning';
    return 'text-destructive';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 71) return 'Low Risk';
    if (score >= 41) return 'Moderate Risk';
    return 'High Risk';
  };

  return (
    <div className={cn("nb-screen-height", gradients.page, "text-foreground pb-24")}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.button
            onClick={() => navigate(-1)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mb-4 flex items-center gap-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </motion.button>
          
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-secondary" />
            <h1 className={cn(typography.h1)}>Contract Analysis Report</h1>
          </div>
          <p className="text-foreground/60">
            Report ID: {reportId}
          </p>
        </div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-border shadow-lg mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={cn(typography.h3, "mb-2")}>Protection Score</h2>
              <p className={cn("text-5xl font-black", getRiskColor(score))}>
                {score}
              </p>
              <p className={cn("text-lg mt-2", getRiskColor(score))}>
                {getRiskLabel(score)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-foreground/60">Issues Found</p>
              <p className="text-3xl font-bold text-foreground">{issues.length}</p>
            </div>
          </div>
        </motion.div>

        {/* Key Terms */}
        {keyTerms && Object.keys(keyTerms).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-secondary/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-border shadow-lg mb-6"
          >
            <h2 className={cn(typography.h3, "mb-4")}>Key Terms</h2>
            <div className="space-y-3">
              {keyTerms.dealValue && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-foreground/70">Deal Value</span>
                  <span className="font-semibold">{keyTerms.dealValue}</span>
                </div>
              )}
              {keyTerms.deliverables && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-foreground/70">Deliverables</span>
                  <span className="font-semibold">{keyTerms.deliverables}</span>
                </div>
              )}
              {keyTerms.paymentSchedule && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-foreground/70">Payment Schedule</span>
                  <span className="font-semibold">{keyTerms.paymentSchedule}</span>
                </div>
              )}
              {keyTerms.duration && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-foreground/70">Duration</span>
                  <span className="font-semibold">{keyTerms.duration}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Issues */}
        {issues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-secondary/50 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-border shadow-lg mb-6"
          >
            <h2 className={cn(typography.h3, "mb-4")}>Issues Found</h2>
            <div className="space-y-4">
              {issues.map((issue: any, index: number) => (
                <div
                  key={index}
                  className={cn(
                    "p-4 rounded-xl border",
                    issue.severity === 'high' ? "bg-destructive/10 border-destructive/30" :
                    issue.severity === 'medium' ? "bg-warning/10 border-orange-500/30" :
                    "bg-yellow-500/10 border-yellow-500/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={cn(
                      "w-5 h-5 mt-0.5 flex-shrink-0",
                      issue.severity === 'high' ? "text-destructive" :
                      issue.severity === 'medium' ? "text-warning" :
                      "text-yellow-400"
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{issue.title}</h3>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          issue.severity === 'high' ? "bg-destructive/20 text-destructive" :
                          issue.severity === 'medium' ? "bg-warning/20 text-warning" :
                          "bg-yellow-500/20 text-yellow-300"
                        )}>
                          {issue.severity?.toUpperCase() || 'WARNING'}
                        </span>
                      </div>
                      {issue.description && (
                        <p className="text-foreground/70 text-sm mb-2">{issue.description}</p>
                      )}
                      {issue.recommendation && (
                        <div className="mt-2 p-2 bg-card rounded-lg">
                          <p className="text-xs text-foreground/60 mb-1">Recommendation:</p>
                          <p className="text-sm text-foreground/90">{issue.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Issues */}
        {issues.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-500/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-green-500/30 shadow-lg mb-6 text-center"
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h2 className={cn(typography.h3, "mb-2")}>No Issues Found</h2>
            <p className="text-foreground/70">This contract looks safe to sign!</p>
          </motion.div>
        )}

        {/* Footer Note */}
        <div className="text-center text-foreground/50 text-sm mt-8">
          <p>This is a read-only view of the contract analysis report.</p>
          <p className="mt-2">For questions or to request changes, please contact the creator.</p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
