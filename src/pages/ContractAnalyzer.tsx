"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Download,
  Copy,
  Shield,
  DollarSign,
  Clock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AnalysisResult {
  overallScore: number;
  redFlags: Array<{ severity: 'high' | 'medium' | 'low'; issue: string; recommendation: string }>;
  greenFlags: string[];
  paymentTerms: {
    amount: string;
    paymentSchedule: string;
    lateFees: string;
  };
  deliverables: string[];
  exclusivity: string;
  termination: string;
  summary: string;
}

const ContractAnalyzer = () => {
  const [contractText, setContractText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (!contractText.trim()) {
      toast.error('Please paste or upload a contract to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    // Simulate AI analysis
    setTimeout(() => {
      // Mock analysis result
      const mockResult: AnalysisResult = {
        overallScore: 72,
        redFlags: [
          {
            severity: 'high',
            issue: 'Exclusivity clause too broad - covers all platforms indefinitely',
            recommendation: 'Negotiate platform-specific exclusivity or time-limited terms',
          },
          {
            severity: 'medium',
            issue: 'Payment terms unclear - no specific due dates mentioned',
            recommendation: 'Request clear payment schedule with specific dates',
          },
          {
            severity: 'low',
            issue: 'Termination clause favors brand - 30 days notice required from creator',
            recommendation: 'Negotiate mutual termination terms or shorter notice period',
          },
        ],
        greenFlags: [
          'Clear deliverables and deadlines specified',
          'Payment amount clearly stated',
          'Intellectual property rights properly defined',
          'Dispute resolution clause included',
        ],
        paymentTerms: {
          amount: '₹50,000 per campaign',
          paymentSchedule: '50% upfront, 50% on delivery (within 30 days)',
          lateFees: 'No late fees specified',
        },
        deliverables: [
          '1 Instagram Reel (60-90 seconds)',
          '2 Instagram Stories',
          '1 YouTube Short (60 seconds)',
          'Analytics report within 7 days of posting',
        ],
        exclusivity: 'Exclusive to brand for 90 days on Instagram and YouTube',
        termination: 'Either party can terminate with 30 days written notice',
        summary: 'This contract has some concerning terms, particularly around exclusivity and payment clarity. Recommend negotiating these points before signing.',
      };

      setAnalysisResult(mockResult);
      setIsAnalyzing(false);
      toast.success('Contract analysis complete!');
    }, 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.startsWith('text/')) {
      toast.error('Please upload a PDF or text file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContractText(text);
      toast.success('Contract loaded successfully');
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContractText(text);
        toast.success('Contract loaded successfully');
      };
      reader.readAsText(file);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden pb-[80px] px-4 md:px-6 antialiased">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <FileText className="w-7 h-7 text-purple-500" />
          Contract Analyzer
        </h1>
        <p className="text-sm text-muted-foreground">
          AI-powered contract analysis to protect your interests
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="bg-card border-border/40">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Upload or Paste Contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center transition-all",
                isDragging
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-border hover:border-purple-500/50 bg-muted/20"
              )}
            >
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag & drop your contract here
              </p>
              <p className="text-xs text-muted-foreground mb-4">or</p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="mb-2"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Supports PDF, DOC, DOCX, TXT
              </p>
            </div>

            {/* Text Input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Or paste contract text:
              </label>
              <Textarea
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                placeholder="Paste your contract text here..."
                className="min-h-[300px] bg-background border-border/40"
              />
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !contractText.trim()}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Contract...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Analyze Contract
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          <AnimatePresence>
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Overall Score */}
                <Card className="bg-gradient-to-br from-purple-900/20 to-purple-950/20 border-purple-700/40">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Overall Score</h3>
                      <Badge
                        variant="default"
                        className={cn(
                          "text-2xl font-bold px-4 py-2",
                          getScoreColor(analysisResult.overallScore)
                        )}
                      >
                        {analysisResult.overallScore}/100
                      </Badge>
                    </div>
                    <div className="relative h-3 bg-gray-800/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${analysisResult.overallScore}%` }}
                        transition={{ duration: 1 }}
                        className={cn(
                          "absolute inset-y-0 left-0 rounded-full",
                          analysisResult.overallScore >= 80 ? "bg-green-500" :
                          analysisResult.overallScore >= 60 ? "bg-yellow-500" :
                          "bg-red-500"
                        )}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      {analysisResult.summary}
                    </p>
                  </CardContent>
                </Card>

                {/* Red Flags */}
                {analysisResult.redFlags.length > 0 && (
                  <Card className="bg-card border-border/40">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Red Flags ({analysisResult.redFlags.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {analysisResult.redFlags.map((flag, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={cn(
                            "p-4 rounded-lg border",
                            getSeverityColor(flag.severity)
                          )}
                        >
                          <div className="flex items-start gap-2 mb-2">
                            <Badge
                              variant="destructive"
                              className={cn(
                                "text-xs",
                                flag.severity === 'high' && "bg-red-500",
                                flag.severity === 'medium' && "bg-yellow-500",
                                flag.severity === 'low' && "bg-blue-500"
                              )}
                            >
                              {flag.severity.toUpperCase()}
                            </Badge>
                            <p className="text-sm font-medium text-foreground flex-1">
                              {flag.issue}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            💡 <strong>Recommendation:</strong> {flag.recommendation}
                          </p>
                        </motion.div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Green Flags */}
                {analysisResult.greenFlags.length > 0 && (
                  <Card className="bg-card border-border/40">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Green Flags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysisResult.greenFlags.map((flag, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-foreground">{flag}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Payment Terms */}
                <Card className="bg-card border-border/40">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-500" />
                      Payment Terms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Amount</p>
                      <p className="text-sm font-semibold text-foreground">
                        {analysisResult.paymentTerms.amount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Payment Schedule</p>
                      <p className="text-sm text-foreground">
                        {analysisResult.paymentTerms.paymentSchedule}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Late Fees</p>
                      <p className="text-sm text-foreground">
                        {analysisResult.paymentTerms.lateFees}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Deliverables */}
                <Card className="bg-card border-border/40">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Deliverables
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.deliverables.map((deliverable, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          <span className="text-foreground">{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Key Terms */}
                <Card className="bg-card border-border/40">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Key Terms</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Exclusivity</p>
                      <p className="text-sm text-foreground">{analysisResult.exclusivity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Termination</p>
                      <p className="text-sm text-foreground">{analysisResult.termination}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Summary
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!analysisResult && !isAnalyzing && (
            <Card className="bg-card border-border/40">
              <CardContent className="p-12 text-center">
                <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-sm text-muted-foreground">
                  Upload or paste your contract to get AI-powered analysis
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContractAnalyzer;

