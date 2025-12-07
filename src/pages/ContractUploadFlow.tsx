import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, XCircle, Loader, Sparkles, Shield, Eye, Download, IndianRupee, Calendar, Loader2, Copy, Wrench, Send, FileCheck, X, Wand2, Lock, Info, MessageSquare, Mail, ChevronDown, ChevronUp, TrendingUp, DollarSign, FileCode, Ban, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { ContextualTipsProvider } from '@/components/contextual-tips/ContextualTipsProvider';
import { useSession } from '@/contexts/SessionContext';
import { useAddBrandDeal } from '@/lib/hooks/useBrandDeals';
import { toast } from 'sonner';
import { validateContractFile } from '@/lib/utils/contractValidation';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/services/fileService';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

type RiskLevel = 'low' | 'medium' | 'high';

const ContractUploadFlow = () => {
  const navigate = useNavigate();
  const { profile, session } = useSession();
  const addDealMutation = useAddBrandDeal();
  const [step, setStep] = useState('upload'); // upload, uploading, scanning, analyzing, results, upload-error, review-error, validation-error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contractUrl, setContractUrl] = useState<string | null>(null);
  const [pdfReportUrl, setPdfReportUrl] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [originalContractPath, setOriginalContractPath] = useState<string | null>(null);
  const [negotiationMessage, setNegotiationMessage] = useState<string | null>(null);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [brandEmail, setBrandEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Helper function to format negotiation message with dynamic fields
  const formatNegotiationMessage = (baseMessage: string): string => {
    // Extract creator name with fallback chain
    const creatorName =
      (profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : null) ||
      profile?.first_name ||
      session?.user?.email?.split('@')[0] ||
      'Creator';

    // Extract and sanitize deal value
    let dealValue = analysisResults?.keyTerms?.dealValue || 'the agreed amount';
    if (dealValue && dealValue !== 'the agreed amount') {
      // Ensure ₹ symbol is present
      if (!dealValue.includes('₹')) {
        dealValue = `₹${dealValue.trim()}`;
      }
      // Clean up any double symbols
      dealValue = dealValue.replace(/₹+/g, '₹').trim();
    }
    if (dealValue === '₹' || dealValue.trim() === '' || dealValue === '₹undefined') {
      dealValue = 'the agreed amount';
    }

    // Extract duration (optional)
    const duration = analysisResults?.keyTerms?.duration || null;

    // Brand name (could be extracted from contract, for now use placeholder)
    const brandName = 'Brand Team';

    // Extract the core issues content from the AI message (skip greeting if present)
    let issuesContent = baseMessage;
    // Remove common greetings if they exist
    const greetingPatterns = [
      /^Dear\s+[^,]+,\s*/i,
      /^Hello\s+[^,]+,\s*/i,
      /^Hi\s+[^,]+,\s*/i,
    ];
    for (const pattern of greetingPatterns) {
      issuesContent = issuesContent.replace(pattern, '');
    }
    issuesContent = issuesContent.trim();

    // Format the message with dynamic fields using the specified template
    let formattedMessage = `Dear ${brandName},

Thank you for sharing the contract for the collaboration valued at ${dealValue}. I have reviewed the agreement and would like to request a few small revisions to ensure clarity and a smooth working relationship for both sides.

${issuesContent}`;

    // Add duration if available
    if (duration) {
      formattedMessage += `\n\nThis collaboration is planned for a duration of ${duration}.`;
    }

    formattedMessage += `\n\nThese changes will help protect both parties and ensure long-term clarity and flexibility.

Kindly share a revised version of the contract incorporating these changes at your convenience.

Warm regards,
${creatorName}`;

    return formattedMessage;
  };

  const [analysisResults, setAnalysisResults] = useState<{
    overallRisk: RiskLevel;
    score: number;
    negotiationPowerScore?: number;
    issues: Array<{
      id: number;
      severity: 'high' | 'medium' | 'low' | 'warning';
      category: string;
      title: string;
      description: string;
      clause?: string;
      recommendation: string;
    }>;
    verified: Array<{
      id: number;
      category: string;
      title: string;
      description: string;
      clause?: string;
    }>;
    keyTerms: {
      dealValue?: string;
      duration?: string;
      deliverables?: string;
      paymentSchedule?: string;
      exclusivity?: string;
    };
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIssueForClause, setSelectedIssueForClause] = useState<number | null>(null);
  const [generatedClause, setGeneratedClause] = useState<string | null>(null);
  const [isGeneratingClause, setIsGeneratingClause] = useState(false);
  const [analyzedItems, setAnalyzedItems] = useState<Set<string>>(new Set());
  const [scoreAnimation, setScoreAnimation] = useState(0);
  const [resolvedIssues, setResolvedIssues] = useState<Set<number>>(new Set());
  const [expandedFixes, setExpandedFixes] = useState<Set<number>>(new Set());
  const [generatedClauses, setGeneratedClauses] = useState<Map<number, string>>(new Map());
  const [clauseStates, setClauseStates] = useState<Map<number, 'default' | 'loading' | 'success'>>(new Map());

  // Helper function to get risk score color and label
  const getRiskScoreInfo = (score: number) => {
    if (score >= 71) {
      return { color: 'text-green-400', bgColor: 'bg-green-500', label: 'Low Legal Risk', progressColor: 'from-green-500 to-emerald-500', glowColor: 'rgba(16, 185, 129, 0.3)' };
    } else if (score >= 41) {
      return { color: 'text-orange-400', bgColor: 'bg-orange-500', label: 'Moderate Legal Risk', progressColor: 'from-orange-500 to-yellow-500', glowColor: 'rgba(249, 115, 22, 0.3)' };
    } else {
      return { color: 'text-red-400', bgColor: 'bg-red-500', label: 'High Legal Risk', progressColor: 'from-red-500 to-rose-500', glowColor: 'rgba(239, 68, 68, 0.3)' };
    }
  };

  // Helper function to get key term status
  const getKeyTermStatus = (term: string, value: string | undefined) => {
    if (!value || value === 'Not specified') {
      return { badge: '⚠', color: 'bg-yellow-500/20 text-yellow-400', label: 'Specs Missing' };
    }
    // Check for vague terms
    const vagueTerms = ['tbd', 'to be determined', 'as per', 'negotiable', 'discuss'];
    const isVague = vagueTerms.some(v => value.toLowerCase().includes(v));
    if (isVague) {
      return { badge: '⚠', color: 'bg-yellow-500/20 text-yellow-400', label: 'Needs Attention' };
    }
    return { badge: '✅', color: 'bg-green-500/20 text-green-400', label: 'Clear' };
  };

  // Progressive analysis animation
  useEffect(() => {
    if (step === 'analyzing') {
      // Reset analyzed items when analysis starts
      setAnalyzedItems(new Set());
      
      // Progressively mark items as complete
      const items = ['Payment terms', 'Termination rights', 'IP ownership', 'Exclusivity clause', 'Liability terms'];
      items.forEach((item, index) => {
        setTimeout(() => {
          setAnalyzedItems(prev => new Set([...prev, item]));
        }, (index + 1) * 800); // 800ms delay between each item
      });
    } else if (step !== 'analyzing') {
      // Clear analyzed items when leaving analyzing step
      setAnalyzedItems(new Set());
    }
  }, [step]);

  // Animate score on results load
  useEffect(() => {
    if (step === 'results' && analysisResults) {
      setScoreAnimation(0);
      const targetScore = analysisResults.score;
      const duration = 1500; // 1.5 seconds
      const steps = 60;
      const increment = targetScore / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= targetScore) {
          setScoreAnimation(targetScore);
          clearInterval(interval);
        } else {
          setScoreAnimation(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [step, analysisResults]);

  // Send negotiation email
  const handleSendEmail = async (email: string) => {
    if (!session?.access_token || !negotiationMessage) {
      toast.error('Please generate a negotiation message first');
      return;
    }

    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Ensure message is formatted with latest data
    const formattedMessage = formatNegotiationMessage(negotiationMessage);

    setIsSendingEmail(true);
    triggerHaptic(HapticPatterns.medium);

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
          ? 'https://api.noticebazaar.com' 
          : 'http://localhost:3001');
      const response = await fetch(`${apiBaseUrl}/api/protection/send-negotiation-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
          body: JSON.stringify({
            toEmail: email,
            message: formattedMessage,
            reportId: reportId || null
          })
      });

      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast.success('Email sent successfully!');
      setBrandEmail('');
    } catch (error: any) {
      console.error('[ContractUploadFlow] Send email error:', error);
      toast.error(error.message || 'Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Generate safe clause using backend API
  const handleGenerateClause = async (issue: typeof analysisResults.issues[0]) => {
    if (!session?.access_token) {
      toast.error('Please log in to generate safe clauses');
      return;
    }

    if (!reportId) {
      toast.error('Report information not available. Please re-analyze the contract.');
      return;
    }

    triggerHaptic(HapticPatterns.light);
    setIsGeneratingClause(true);
    setSelectedIssueForClause(issue.id);
    setClauseStates(new Map(clauseStates.set(issue.id, 'loading')));
    
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
          ? 'https://api.noticebazaar.com' 
          : 'http://localhost:3001');
      const response = await fetch(`${apiBaseUrl}/api/protection/generate-fix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          reportId,
          issueIndex: issue.id - 1, // Convert to 0-based index
          originalClause: issue.clause || issue.title
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate safe clause');
      }

      const safeClause = `SAFER VERSION:\n\n${data.safeClause}\n\n${data.explanation ? `Explanation: ${data.explanation}` : ''}`;
      setGeneratedClause(safeClause);
      setGeneratedClauses(new Map(generatedClauses.set(issue.id, safeClause)));
      setClauseStates(new Map(clauseStates.set(issue.id, 'success')));
      toast.success('Fix Generated');
    } catch (error: any) {
      console.error('[ContractUploadFlow] Generate clause error:', error);
      toast.error(error.message || 'Failed to generate safe clause. Please try again.');
      setClauseStates(new Map(clauseStates.set(issue.id, 'default')));
    } finally {
      setIsGeneratingClause(false);
    }
  };

  // Helper functions for issue categorization and impact
  const getIssueCategory = (issue: typeof analysisResults.issues[0]) => {
    const title = issue.title.toLowerCase();
    const category = issue.category?.toLowerCase() || '';
    
    if (title.includes('payment') || title.includes('fee') || title.includes('compensation') || category.includes('payment')) {
      return { icon: DollarSign, label: 'Payment Issues', emoji: '💰' };
    }
    if (title.includes('intellectual') || title.includes('ip') || title.includes('ownership') || title.includes('rights') || category.includes('ip')) {
      return { icon: FileCode, label: 'Intellectual Property', emoji: '📜' };
    }
    if (title.includes('exclusive') || title.includes('exclusivity') || category.includes('exclusive')) {
      return { icon: Ban, label: 'Exclusivity', emoji: '⛔' };
    }
    if (title.includes('termination') || title.includes('cancel') || category.includes('termination')) {
      return { icon: AlertCircle, label: 'Termination', emoji: '🛑' };
    }
    return { icon: AlertTriangle, label: 'Other Issues', emoji: '⚠️' };
  };

  const getImpactIfIgnored = (issue: typeof analysisResults.issues[0]) => {
    const severity = issue.severity;
    const title = issue.title.toLowerCase();
    
    if (severity === 'high') {
      if (title.includes('payment')) {
        return 'You may face financial penalties or delayed payments';
      }
      if (title.includes('ip') || title.includes('rights')) {
        return 'You may lose ownership of your content';
      }
      if (title.includes('exclusive')) {
        return 'You may be restricted from working with other brands';
      }
      return 'This could lead to significant legal or financial consequences';
    }
    if (severity === 'medium') {
      return 'This may limit your flexibility or create future complications';
    }
    return 'This could become a concern in future negotiations';
  };

  const getNegotiationStrength = (issue: typeof analysisResults.issues[0]) => {
    const severity = issue.severity;
    
    if (severity === 'high') {
      return { label: 'Hard to Negotiate', color: 'bg-red-500/30 text-red-300 border-red-500/50', emoji: '🔴' };
    }
    if (severity === 'medium') {
      return { label: 'Moderate', color: 'bg-orange-500/30 text-orange-300 border-orange-500/50', emoji: '🟠' };
    }
    return { label: 'Easy to Negotiate', color: 'bg-green-500/30 text-green-300 border-green-500/50', emoji: '🟢' };
  };

  const handleMarkAsResolved = (issueId: number) => {
    setResolvedIssues(new Set([...resolvedIssues, issueId]));
    triggerHaptic(HapticPatterns.light);
    toast.success('Issue marked as resolved');
  };

  const toggleFixExpansion = (issueId: number) => {
    const newExpanded = new Set(expandedFixes);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedFixes(newExpanded);
  };

  // Calculate contract safety progress
  const getContractSafetyProgress = () => {
    if (!analysisResults) return 0;
    const totalIssues = analysisResults.issues.length;
    const resolvedCount = resolvedIssues.size;
    const generatedCount = Array.from(clauseStates.values()).filter(s => s === 'success').length;
    const progress = ((resolvedCount + generatedCount * 0.5) / totalIssues) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  // Real API integration: Upload file and analyze contract
  useEffect(() => {
    if (step === 'uploading' && uploadedFile) {
      handleRealUpload();
    }
  }, [step, uploadedFile]);

  const handleRealUpload = async () => {
    if (!uploadedFile || !profile?.id) return;

    try {
      // Upload file to Supabase storage
      const uploadResult = await uploadFile(uploadedFile, {
        category: 'contract',
        folder: 'contracts',
        userId: profile.id,
      });

      if (!uploadResult.url) {
        throw new Error('Failed to upload contract file');
      }

      setContractUrl(uploadResult.url);
      setUploadProgress(100);
      setTimeout(() => setStep('scanning'), 500);
    } catch (error: any) {
      console.error('[ContractUploadFlow] Upload error:', error);
      setUploadError(error.message || 'Upload failed. Please try again.');
      setStep('upload-error');
    }
  };

  // Real API integration: Scan document
  useEffect(() => {
    if (step === 'scanning' && contractUrl) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('analyzing'), 500);
            return 100;
          }
          return prev + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [step, contractUrl]);

  // Real API integration: Analyze contract via API
  useEffect(() => {
    if (step === 'analyzing' && contractUrl) {
      handleRealAnalysis();
    }
  }, [step, contractUrl]);

  const handleRealAnalysis = async () => {
    if (!contractUrl) return;

    setIsAnalyzing(true);
    setReviewError(null);

    try {
      // Get API base URL - use env variable, or detect from current origin, or fallback to localhost
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
          ? 'https://api.noticebazaar.com' 
          : 'http://localhost:3001');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please log in to analyze contracts');
      }

      if (!contractUrl) {
        throw new Error('Contract file URL is missing. Please upload again.');
      }

      const apiEndpoint = `${apiBaseUrl}/api/protection/analyze`;
      console.log('[ContractUploadFlow] Calling API:', apiEndpoint);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          contract_url: contractUrl,
        }),
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      const text = await response.text();
      
      let responseData: any = {};
      if (text && text.trim().length > 0) {
        if (contentType?.includes('application/json')) {
          try {
            responseData = JSON.parse(text);
          } catch (parseError) {
            console.error('[ContractUploadFlow] JSON parse error:', parseError, 'Response text:', text.substring(0, 200));
            throw new Error('Invalid response from server. Please try again.');
          }
        } else {
          // Non-JSON response (e.g., HTML error page)
          throw new Error(text.substring(0, 200) || 'Server returned an invalid response');
        }
      } else {
        // Empty response
        if (!response.ok) {
          throw new Error(`Server returned empty response (${response.status}). Please try again.`);
        }
        throw new Error('Server returned empty response. Please try again.');
      }

      // 🚨 HARD STOP: If API fails or returns 400/500, show error and STOP
      if (!response.ok) {
        if (response.status === 400 && responseData.validationError === true) {
          // Validation error - show specific error message
          setValidationError(responseData.error || 'This document is NOT a brand deal contract.');
          setStep('validation-error');
          setIsAnalyzing(false);
          return; // HARD STOP - do not proceed
        }
        
        // Other API errors
        setReviewError(responseData.error || `Contract analysis failed (${response.status}). Please try again.`);
        setStep('review-error');
        setIsAnalyzing(false);
        return; // HARD STOP - do not proceed
      }

      // ✅ Only proceed if HTTP 200 and valid data
      if (!responseData.data || !responseData.data.analysis_json) {
        throw new Error('Invalid response from server');
      }

      // Backend validation passed - show success message now
      toast.success('Contract validated and analyzed successfully!', { duration: 3000 });

      // Store PDF report URL and report ID if available
      if (responseData.data.pdf_report_url) {
        setPdfReportUrl(responseData.data.pdf_report_url);
      }
      // Set report_id if available (may be null if database save failed)
      if (responseData.data.report_id) {
        setReportId(responseData.data.report_id);
        console.log('[ContractUploadFlow] Report ID set:', responseData.data.report_id);
      } else {
        console.warn('[ContractUploadFlow] ⚠️ No report_id in response. Database save may have failed.');
        console.warn('[ContractUploadFlow] Response data:', responseData.data);
        // Don't set reportId to null - keep previous value if exists
      }
      
      // Store original contract path/URL
      // Try multiple methods to extract or use the contract URL
      if (contractUrl) {
        // Method 1: Try to extract path from Supabase storage URL
        const urlParts = contractUrl.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split('/');
          const bucket = pathParts[0];
          const filePath = pathParts.slice(1).join('/');
          setOriginalContractPath(`${bucket}/${filePath}`);
          console.log('[ContractUploadFlow] Original contract path extracted:', `${bucket}/${filePath}`);
        } else {
          // Method 2: Use the full URL if path extraction fails
          // Backend can handle full URLs
          setOriginalContractPath(contractUrl);
          console.log('[ContractUploadFlow] Using full contract URL as path:', contractUrl);
        }
      } else {
        console.warn('[ContractUploadFlow] No contractUrl available to set originalContractPath');
      }

      // Transform API response to UI format
      const analysis = responseData.data.analysis_json;
      setAnalysisResults({
        overallRisk: analysis.overallRisk || 'low',
        score: analysis.protectionScore || 0,
        negotiationPowerScore: analysis.negotiationPowerScore, // Negotiation Power Score
        issues: (analysis.issues || []).map((issue: any, index: number) => ({
          id: index + 1,
          severity: issue.severity || 'warning',
          category: issue.category || 'General',
          title: issue.title || 'Issue',
          description: issue.description || '',
          clause: issue.clause,
          recommendation: issue.recommendation || '',
        })),
        verified: (analysis.verified || []).map((item: any, index: number) => ({
          id: index + 1,
          category: item.category || 'General',
          title: item.title || 'Verified',
          description: item.description || '',
          clause: item.clause,
        })),
        keyTerms: {
          dealValue: analysis.keyTerms?.dealValue,
          duration: analysis.keyTerms?.duration,
          deliverables: analysis.keyTerms?.deliverables,
          paymentSchedule: analysis.keyTerms?.paymentSchedule,
          exclusivity: analysis.keyTerms?.exclusivity,
        },
      });

      setStep('results');
    } catch (error: any) {
      console.error('[ContractUploadFlow] Analysis error:', error);
      
      // Handle network/CORS errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setReviewError('Network error: Could not connect to the server. Please check your connection and try again.');
      } else if (error.message.includes('JSON') || error.message.includes('Unexpected end')) {
        setReviewError('Server returned an invalid response. Please try again or contact support.');
      } else {
        setReviewError(error.message || 'Contract analysis failed. Please try again.');
      }
      
      setStep('review-error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetryUpload = () => {
    setUploadError(null);
    setRetryCount(prev => prev + 1);
    setUploadProgress(0);
    setStep('uploading');
  };

  const handleRetryReview = () => {
    setReviewError(null);
    if (contractUrl) {
      setStep('analyzing');
    } else {
      // If no contract URL, go back to upload
      setStep('upload');
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a PDF or DOCX file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate if it's a brand deal contract (for PDFs)
      if (file.type === 'application/pdf') {
        try {
          // Don't show validation message - backend will validate with Gemini AI
          const validation = await validateContractFile(file);
          
          if (!validation.isValid) {
            // Set validation error and show validation error screen
            const errorMessage = validation.error || '⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.';
            setValidationError(errorMessage);
            setStep('validation-error');
            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = '';
            }
            setFileName('');
            setFileSize('');
            setUploadedFile(null);
            return;
          }
          
          // Frontend validation passed - but backend will do the real validation
          console.log('[ContractUploadFlow] Frontend validation passed for:', file.name);
          // Don't show "validated" yet - backend will validate with Gemini AI
        } catch (error) {
          console.error('[ContractUploadFlow] Validation error:', error);
          // If validation throws an error, show validation error screen
          const errorMessage = '⚠️ Failed to validate this PDF file.\n\nPlease ensure the file is a valid PDF with readable text.\n\nIf this is a brand deal contract, please try again or contact support.';
          setValidationError(errorMessage);
          setStep('validation-error');
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setFileName('');
          setFileSize('');
          setUploadedFile(null);
          return;
        }
      }

      // Only proceed if validation passed (or if not a PDF)
      console.log('[ContractUploadFlow] Proceeding with file upload:', file.name);
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setUploadedFile(file);
      setStep('uploading');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      if (!validTypes.includes(file.type)) {
        toast.error('Please select a PDF or DOCX file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate if it's a brand deal contract (for PDFs)
      if (file.type === 'application/pdf') {
        try {
          // Don't show validation message - backend will validate with Gemini AI
          const validation = await validateContractFile(file);
          
          if (!validation.isValid) {
            // Set validation error and show validation error screen
            const errorMessage = validation.error || '⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.';
            setValidationError(errorMessage);
            setStep('validation-error');
            // Reset file state
            setFileName('');
            setFileSize('');
            setUploadedFile(null);
            return;
          }
          
          // Frontend validation passed - but backend will do the real validation
          console.log('[ContractUploadFlow] Frontend validation passed for:', file.name);
          // Don't show "validated" yet - backend will validate with Gemini AI
        } catch (error) {
          console.error('[ContractUploadFlow] Validation error:', error);
          // If validation throws an error, show validation error screen
          const errorMessage = '⚠️ Failed to validate this PDF file.\n\nPlease ensure the file is a valid PDF with readable text.\n\nIf this is a brand deal contract, please try again or contact support.';
          setValidationError(errorMessage);
          setStep('validation-error');
          // Reset file state
          setFileName('');
          setFileSize('');
          setUploadedFile(null);
          return;
        }
      }

      // Only proceed if validation passed (or if not a PDF)
      console.log('[ContractUploadFlow] Proceeding with file upload:', file.name);
      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setUploadedFile(file);
      setStep('uploading');

      setFileName(file.name);
      setFileSize((file.size / (1024 * 1024)).toFixed(2) + ' MB');
      setUploadedFile(file);
      setStep('uploading');
    }
  };

  const riskConfig: Record<RiskLevel, { color: string; bgColor: string; label: string; icon: typeof CheckCircle }> = {
    low: { color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Low Risk', icon: CheckCircle },
    medium: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Medium Risk', icon: AlertTriangle },
    high: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'High Risk', icon: XCircle }
  };

  // Only render results if we have real API data
  if (step === 'results' && !analysisResults) {
    // If somehow we're on results step without data, go back to upload
    setStep('upload');
    return null;
  }

  const RiskIcon = analysisResults ? riskConfig[analysisResults.overallRisk as RiskLevel].icon : CheckCircle;

  // Compute risk score info for results step
  const resultsRiskInfo = step === 'results' && analysisResults ? getRiskScoreInfo(analysisResults.score) : null;
  const resultsCircumference = step === 'results' && analysisResults ? 2 * Math.PI * 45 : 0;
  const resultsStrokeDasharray = resultsCircumference;
  const resultsStrokeDashoffset = step === 'results' && analysisResults 
    ? resultsCircumference - (analysisResults.score / 100) * resultsCircumference 
    : 0;

  return (
    <ContextualTipsProvider currentView="upload">
    <div className="w-full text-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 z-50 bg-purple-900/90 backdrop-blur-lg border-b border-white/10 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between py-4">
          <button 
            onClick={() => step === 'results' ? setStep('upload') : navigate('/creator-dashboard')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-lg font-semibold">Upload Contract</div>
          
          <div className="w-10"></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Upload Step */}
        {step === 'upload' && (
          <div className="space-y-6">
            {/* Info Card */}
            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-5 border border-blue-400/30">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">AI-Powered Review</h3>
                  <p className="text-sm text-purple-200">Our AI instantly analyzes your contract for potential issues and unfair terms.</p>
                </div>
              </div>
            </div>

            {/* Upload Area */}
            <div 
              className="bg-white/10 backdrop-blur-md rounded-2xl border-2 border-dashed border-white/20 p-12 text-center hover:bg-white/15 transition-all cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleFileSelect}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-10 h-10 text-purple-400" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">Upload Contract</h3>
              <p className="text-sm text-purple-300 mb-4">Drag and drop or click to browse</p>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleFileSelect();
                }}
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-medium transition-colors"
              >
                Choose File
              </button>
              
              <div className="mt-4 text-xs text-purple-400">
                Supported: PDF, DOCX • Max 10MB
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Instant Analysis</div>
                  <div className="text-purple-300">Get results in under 30 seconds</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-sm">
                <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">100% Confidential</div>
                  <div className="text-purple-300">Your contracts are encrypted and secure</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3 text-sm">
                <Sparkles className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Expert Insights</div>
                  <div className="text-purple-300">AI trained on 10,000+ creator contracts</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploading Step */}
        {step === 'uploading' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center w-full max-w-md">
              <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6 relative">
                <Upload className="w-12 h-12 text-purple-400" />
                <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 border-t-purple-500 animate-spin"></div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Uploading Contract...</h2>
              <p className="text-purple-300 mb-6">{fileName}</p>
              
              {/* Enhanced Progress Bar */}
              <div className="w-full max-w-xs mx-auto mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-purple-300 font-medium">{uploadProgress}%</span>
                  <span className="text-purple-300">{fileSize}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300 relative"
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>

              {/* Stage Indicators */}
              <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 text-left">
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    uploadProgress > 0 ? 'bg-green-400 scale-125' : 'bg-white/20'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Uploading file...</div>
                    <div className="text-xs text-purple-300">
                      {uploadProgress > 0 ? `Transferred ${(uploadProgress / 100 * parseFloat(fileSize)).toFixed(2)} MB` : 'Preparing upload...'}
                    </div>
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <Loader className="w-4 h-4 animate-spin text-purple-400" />
                  )}
                  {uploadProgress === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center w-full max-w-md">
              <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-6 relative">
                <FileText className="w-12 h-12 text-blue-400" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Scanning Document...</h2>
              <p className="text-purple-300 mb-6">Reading contract clauses</p>
              
              {/* Enhanced Progress Bar */}
              <div className="w-full max-w-xs mx-auto mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-purple-300 font-medium">{scanProgress}%</span>
                  <span className="text-purple-300">12 pages</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 relative"
                    style={{ width: `${scanProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>

              {/* Stage Indicators */}
              <div className="space-y-3 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-3 text-left">
                  <div className={`w-2 h-2 rounded-full transition-all ${
                    scanProgress > 0 ? 'bg-green-400 scale-125' : 'bg-white/20'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">Extracting text from PDF...</div>
                    <div className="text-xs text-purple-300">
                      {scanProgress > 0 ? `Processed ${Math.round(scanProgress / 100 * 12)} of 12 pages` : 'Initializing scanner...'}
                    </div>
                  </div>
                  {scanProgress > 0 && scanProgress < 100 && (
                    <Loader className="w-4 h-4 animate-spin text-blue-400" />
                  )}
                  {scanProgress === 100 && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analyzing Step */}
        {step === 'analyzing' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 relative animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">AI Analyzing Contract...</h2>
              <p className="text-purple-300 mb-8">Checking for potential issues</p>
              
              <div className="space-y-3 text-sm max-w-xs mx-auto">
                {['Payment terms', 'Termination rights', 'IP ownership', 'Exclusivity clause', 'Liability terms'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-purple-200">{item}</span>
                    {analyzedItems.has(item) ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Upload Error Step */}
        {step === 'upload-error' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Upload Failed</h2>
              <p className="text-white/70 mb-6">{uploadError || 'An error occurred during upload. Please try again.'}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRetryUpload}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setStep('upload');
                    setUploadError(null);
                    setRetryCount(0);
                    setUploadProgress(0);
                    setFileName('');
                    setFileSize('');
                  }}
                  className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Choose Different File
                </button>
                <button
                  onClick={() => navigate('/creator-dashboard')}
                  className="text-purple-300 hover:text-white text-sm transition-colors"
                >
                  Go Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Review Error Step */}
        {step === 'review-error' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-yellow-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Review Failed</h2>
              <p className="text-white/70 mb-6">{reviewError || 'An error occurred during contract review. Please try again.'}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRetryReview}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Retry Review
                </button>
                <button
                  onClick={() => {
                    setStep('upload');
                    setReviewError(null);
                    setUploadProgress(0);
                    setScanProgress(0);
                    setFileName('');
                    setFileSize('');
                  }}
                  className="bg-white/10 hover:bg-white/15 px-6 py-3 rounded-xl font-medium transition-colors"
                >
                  Upload New Contract
                </button>
                <button
                  onClick={() => navigate('/creator-dashboard')}
                  className="text-purple-300 hover:text-white text-sm transition-colors"
                >
                  Go Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Error Step */}
        {step === 'validation-error' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-12 h-12 text-orange-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">Invalid Document Type</h2>
              <p className="text-white/70 mb-6 whitespace-pre-line">{validationError || 'This document does not appear to be a brand deal contract.'}</p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setStep('upload');
                    setValidationError(null);
                    setFileName('');
                    setFileSize('');
                    setUploadedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Choose Different File
                </button>
                <button
                  onClick={() => navigate('/creator-dashboard')}
                  className="text-purple-300 hover:text-white text-sm transition-colors"
                >
                  Go Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Step - ONLY render if we have real API data */}
        {step === 'results' && analysisResults && resultsRiskInfo && (
          <div className="space-y-6 animate-fadeIn pb-40 md:pb-6" style={{ paddingBottom: 'max(160px, calc(160px + env(safe-area-inset-bottom)))' }}>
            {/* Contract Type Badge */}
            <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl px-4 py-3 border border-purple-400/30">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-purple-300" />
                <span className="text-purple-200">Detected Contract Type:</span>
                <span className="font-semibold text-white">Influencer–Brand Paid Collaboration</span>
              </div>
            </div>

            {/* Premium Risk Score Card with Circular Gauge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Circular Progress Gauge with Animation and Glow */}
                <div className="relative w-40 h-40 flex-shrink-0">
                  {/* Pulse glow effect based on risk level */}
                  <div 
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      boxShadow: `0 0 30px ${resultsRiskInfo.glowColor}`,
                      opacity: 0.6
                    }}
                  />
                  <svg className="transform -rotate-90 w-40 h-40 relative z-10">
                    {/* Background circle */}
                    <circle
                      cx="80"
                      cy="80"
                      r="45"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle - animated */}
                    <circle
                      cx="80"
                      cy="80"
                      r="45"
                      stroke={`url(#gradient-${analysisResults.score})`}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={resultsStrokeDasharray}
                      strokeDashoffset={step === 'results' && analysisResults 
                        ? resultsCircumference - (resultsCircumference * (scoreAnimation || analysisResults.score) / 100)
                        : resultsCircumference}
                      strokeLinecap="round"
                      className="transition-all duration-1500 ease-out"
                    />
                    <defs>
                      <linearGradient id={`gradient-${analysisResults.score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={resultsRiskInfo.bgColor.replace('bg-', '').split('/')[0] === 'green' ? '#10b981' : resultsRiskInfo.bgColor.replace('bg-', '').split('/')[0] === 'orange' ? '#f97316' : '#ef4444'} />
                        <stop offset="100%" stopColor={resultsRiskInfo.bgColor.replace('bg-', '').split('/')[0] === 'green' ? '#059669' : resultsRiskInfo.bgColor.replace('bg-', '').split('/')[0] === 'orange' ? '#ea580c' : '#dc2626'} />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className={`text-4xl font-bold ${resultsRiskInfo.color} transition-all duration-300`}>
                      {scoreAnimation || analysisResults.score}
                    </div>
                    <div className="text-xs text-purple-300 mt-1">Score</div>
                  </div>
                </div>

                {/* Risk Label and Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl font-bold mb-2">Contract Analysis</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <p className={`text-lg font-semibold ${resultsRiskInfo.color}`}>{resultsRiskInfo.label}</p>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-purple-400 cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-purple-900/95 backdrop-blur-sm rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-purple-400/30">
                        Score is based on 30+ legal risk checks
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-purple-900/95"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-purple-300">Protection Score: {analysisResults.score}/100</p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  <button 
                    onClick={() => {
                      if (contractUrl) {
                        window.open(contractUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        toast.error('Contract URL not available');
                      }
                    }}
                    disabled={!contractUrl}
                    className="bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    View Contract
                  </button>
                </div>
              </div>
            </div>

            {/* Negotiation Power Score */}
            {analysisResults.negotiationPowerScore !== undefined && (
              <div className="mt-4 p-4 rounded-xl bg-purple-900/40 border border-purple-700/50 backdrop-blur-md">
                <div className="text-white text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-300" />
                  Negotiation Power
                </div>
                <div className="text-3xl font-bold mt-1 text-purple-200">
                  {analysisResults.negotiationPowerScore}/100
                </div>
                <div className="mt-2 text-sm">
                  {analysisResults.negotiationPowerScore > 65 && (
                    <span className="text-green-400 font-medium">🟢 Creator Dominant Deal</span>
                  )}
                  {analysisResults.negotiationPowerScore >= 40 && analysisResults.negotiationPowerScore <= 65 && (
                    <span className="text-yellow-400 font-medium">🟡 Balanced Negotiation</span>
                  )}
                  {analysisResults.negotiationPowerScore < 40 && (
                    <span className="text-red-400 font-medium">🔴 Brand Dominates</span>
                  )}
                </div>
              </div>
            )}

            {/* Key Terms with Status Badges - Refined */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/10 shadow-lg">
              <h3 className="font-semibold text-xl mb-5 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Key Terms
              </h3>
              <div className="space-y-0">
                {/* Deal Value */}
                {(() => {
                  const status = getKeyTermStatus('Deal Value', analysisResults.keyTerms.dealValue);
                  return (
                    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{status.badge}</span>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-purple-300" />
                            <span className="text-purple-200">Deal Value:</span>
                            <span className="text-white font-bold">{analysisResults.keyTerms.dealValue || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  );
                })()}

                {/* Deliverables */}
                {(() => {
                  const status = getKeyTermStatus('Deliverables', analysisResults.keyTerms.deliverables);
                  return (
                    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{status.badge}</span>
                        <div>
                          <div className="font-semibold">
                            <span className="text-purple-200">Deliverables:</span>
                            <span className="text-white font-bold ml-2">{analysisResults.keyTerms.deliverables || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  );
                })()}

                {/* Payment */}
                {(() => {
                  const status = getKeyTermStatus('Payment', analysisResults.keyTerms.paymentSchedule);
                  return (
                    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{status.badge}</span>
                        <div>
                          <div className="font-semibold">
                            <span className="text-purple-200">Payment:</span>
                            <span className="text-white font-bold ml-2">{analysisResults.keyTerms.paymentSchedule || 'Not specified'}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  );
                })()}

                {/* Governing Law / Exclusivity */}
                {(() => {
                  const governingLaw = analysisResults.keyTerms.exclusivity || 'None';
                  const hasGoverningLaw = governingLaw !== 'None' && governingLaw !== 'Not specified';
                  const status = hasGoverningLaw 
                    ? { badge: '✅', color: 'bg-green-500/20 text-green-400', label: 'Defined' }
                    : { badge: '⚠', color: 'bg-yellow-500/20 text-yellow-400', label: 'Missing' };
                  return (
                    <div className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{status.badge}</span>
                        <div>
                          <div className="font-semibold">
                            <span className="text-purple-200">Governing Law:</span>
                            <span className="text-white font-bold ml-2">{governingLaw}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Contract Safety Progress Bar */}
            {analysisResults.issues.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/10 shadow-lg mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    🛡 Contract Safety Progress
                  </h3>
                  <span className="text-2xl font-bold text-purple-300">{Math.round(getContractSafetyProgress())}% Secure</span>
                </div>
                <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getContractSafetyProgress()}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Issues Table - Premium Action-Driven */}
            {analysisResults.issues.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-white/10 shadow-lg">
                <h3 className="font-semibold text-xl mb-5 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Issues Found ({analysisResults.issues.length - resolvedIssues.size})
                </h3>
                
                {/* Group Issues by Category */}
                {(() => {
                  const groupedIssues = new Map<string, typeof analysisResults.issues>();
                  analysisResults.issues.forEach(issue => {
                    if (resolvedIssues.has(issue.id)) return;
                    const category = getIssueCategory(issue);
                    const key = category.label;
                    if (!groupedIssues.has(key)) {
                      groupedIssues.set(key, []);
                    }
                    groupedIssues.get(key)!.push(issue);
                  });

                  return Array.from(groupedIssues.entries()).map(([categoryLabel, issues]) => {
                    const categoryInfo = getIssueCategory(issues[0]);
                    const CategoryIcon = categoryInfo.icon;
                    
                    return (
                      <div key={categoryLabel} className="mb-6 last:mb-0">
                        <div className="flex items-center gap-2 mb-4">
                          <CategoryIcon className="w-5 h-5 text-purple-400" />
                          <h4 className="font-semibold text-lg">{categoryInfo.emoji} {categoryLabel} ({issues.length})</h4>
                        </div>
                        
                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">⚠ Issue</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">📄 Clause</th>
                                <th className="text-left py-3 px-4 text-sm font-semibold text-purple-300">💡 Fix</th>
                                <th className="text-center py-3 px-4 text-sm font-semibold text-purple-300">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {issues.map((issue, index) => {
                                const severityConfig = {
                                  high: { 
                                    border: 'border-l-4 border-red-500', 
                                    icon: '⚠️', 
                                    badge: 'bg-red-500/30 text-red-300 border-red-500/50' 
                                  },
                                  medium: { 
                                    border: 'border-l-4 border-orange-500', 
                                    icon: '▲', 
                                    badge: 'bg-orange-500/30 text-orange-300 border-orange-500/50' 
                                  },
                                  low: { 
                                    border: 'border-l-4 border-green-500', 
                                    icon: '✓', 
                                    badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50' 
                                  }
                                };
                                const config = severityConfig[issue.severity] || severityConfig.low;
                                const clauseState = clauseStates.get(issue.id) || 'default';
                                const generatedClause = generatedClauses.get(issue.id);
                                const negotiationStrength = getNegotiationStrength(issue);
                                
                                return (
                                  <motion.tr 
                                    key={issue.id} 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: resolvedIssues.has(issue.id) ? 0.5 : 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`${config.border} border-b border-white/5 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-200 group`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    <td className="py-5 px-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{config.icon}</span>
                                        <span className="font-semibold">{issue.title}</span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
                                          {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-5 px-4">
                                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-2">
                                        <div className="text-xs text-red-300 mb-1 flex items-center gap-1">
                                          <XCircle className="w-3 h-3" />
                                          ❌ Problem
                                        </div>
                                        <div className="text-sm text-purple-200">{issue.clause || issue.description || 'N/A'}</div>
                                      </div>
                                    </td>
                                    <td className="py-5 px-4">
                                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-2">
                                        <div className="text-xs text-green-300 mb-1 flex items-center gap-1">
                                          <CheckCircle className="w-3 h-3" />
                                          💡 Recommended Fix
                                        </div>
                                        <div className="text-sm text-purple-200 leading-relaxed">{issue.recommendation}</div>
                                        <div className="mt-2 flex items-center gap-2">
                                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${negotiationStrength.color}`}>
                                            {negotiationStrength.emoji} {negotiationStrength.label}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 mt-2">
                                        <div className="text-xs text-yellow-300 flex items-center gap-1">
                                          <AlertTriangle className="w-3 h-3" />
                                          ⚠️ If ignored: {getImpactIfIgnored(issue)}
                                        </div>
                                      </div>
                                    </td>
                                    <td className="py-5 px-4 text-center">
                                      {clauseState === 'success' && generatedClause ? (
                                        <div className="flex flex-col gap-2">
                                          <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                                            <CheckCircle className="w-4 h-4" />
                                            ✅ Clause Generated
                                          </div>
                                          <button
                                            onClick={async () => {
                                              await navigator.clipboard.writeText(generatedClause);
                                              toast.success('Clause copied!');
                                            }}
                                            className="bg-green-600/80 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                                          >
                                            <Copy className="w-3 h-3" />
                                            📋 Copy
                                          </button>
                                          <button
                                            onClick={() => handleMarkAsResolved(issue.id)}
                                            className="bg-purple-600/80 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                          >
                                            ✔ Mark as Resolved
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            triggerHaptic(HapticPatterns.light);
                                            handleGenerateClause(issue);
                                          }}
                                          disabled={clauseState === 'loading'}
                                          className="bg-purple-600/80 hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 disabled:opacity-50 group-hover:scale-105"
                                        >
                                          {clauseState === 'loading' ? (
                                            <>
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                              ⏳ Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Wand2 className="w-3 h-3 group-hover:animate-pulse" />
                                              ✨ Generate Legal-Safe Clause
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </td>
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-3">
                          {issues.map((issue, index) => {
                            if (resolvedIssues.has(issue.id)) return null;
                            
                            const severityConfig = {
                              high: { 
                                border: 'border-l-4 border-red-500', 
                                icon: '⚠️', 
                                badge: 'bg-red-500/30 text-red-300 border-red-500/50' 
                              },
                              medium: { 
                                border: 'border-l-4 border-orange-500', 
                                icon: '▲', 
                                badge: 'bg-orange-500/30 text-orange-300 border-orange-500/50' 
                              },
                              low: { 
                                border: 'border-l-4 border-green-500', 
                                icon: '✓', 
                                badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50' 
                              }
                            };
                            const config = severityConfig[issue.severity] || severityConfig.low;
                            const clauseState = clauseStates.get(issue.id) || 'default';
                            const generatedClause = generatedClauses.get(issue.id);
                            const negotiationStrength = getNegotiationStrength(issue);
                            const isFixExpanded = expandedFixes.has(issue.id);
                            
                            return (
                              <AnimatePresence key={issue.id}>
                                <motion.div 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className={`${config.border} p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-200`}
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="text-lg">{config.icon}</span>
                                        <span className="font-semibold text-sm">{issue.title}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${config.badge}`}>
                                          {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                                        </span>
                                      </div>
                                      
                                      {/* Problem Section */}
                                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-2">
                                        <div className="text-xs text-red-300 mb-1 flex items-center gap-1">
                                          <XCircle className="w-3 h-3" />
                                          ❌ Problem
                                        </div>
                                        <div className="text-xs text-purple-200 leading-relaxed">{issue.clause || issue.description || 'N/A'}</div>
                                      </div>
                                      
                                      {/* Fix Section - Collapsible on Mobile */}
                                      <div className="mb-2">
                                        <button
                                          onClick={() => toggleFixExpansion(issue.id)}
                                          className="w-full flex items-center justify-between text-xs text-purple-300 mb-1 hover:text-purple-200 transition-colors"
                                        >
                                          <span className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            💡 Recommended Fix
                                          </span>
                                          {isFixExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                        <AnimatePresence>
                                          {isFixExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                              className="overflow-hidden"
                                            >
                                              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 mb-2">
                                                <div className="text-xs text-purple-200 leading-relaxed">{issue.recommendation}</div>
                                                <div className="mt-2">
                                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${negotiationStrength.color}`}>
                                                    {negotiationStrength.emoji} {negotiationStrength.label}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                                                <div className="text-xs text-yellow-300 flex items-center gap-1">
                                                  <AlertTriangle className="w-3 h-3" />
                                                  ⚠️ If ignored: {getImpactIfIgnored(issue)}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Action Button */}
                                  {clauseState === 'success' && generatedClause ? (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2 text-green-400 text-xs">
                                        <CheckCircle className="w-3 h-3" />
                                        ✅ Clause Generated
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={async () => {
                                            await navigator.clipboard.writeText(generatedClause);
                                            toast.success('Clause copied!');
                                          }}
                                          className="flex-1 bg-green-600/80 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1"
                                        >
                                          <Copy className="w-3 h-3" />
                                          📋 Copy
                                        </button>
                                        <button
                                          onClick={() => handleMarkAsResolved(issue.id)}
                                          className="flex-1 bg-purple-600/80 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all"
                                        >
                                          ✔ Resolved
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        triggerHaptic(HapticPatterns.light);
                                        handleGenerateClause(issue);
                                      }}
                                      disabled={clauseState === 'loading'}
                                      className="w-full bg-purple-600/80 hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                      {clauseState === 'loading' ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          ⏳ Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Wand2 className="w-3 h-3" />
                                          ✨ Generate Legal-Safe Clause
                                        </>
                                      )}
                                    </button>
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* Strong Clauses - Visual Trust Boost */}
            {analysisResults.verified.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-green-500/30 shadow-lg">
                <h3 className="font-semibold text-xl mb-5 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Strong Clauses ({analysisResults.verified.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResults.verified.map((item, index) => (
                    <div 
                      key={item.id} 
                      className="flex items-start gap-3 p-4 bg-green-500/10 border-2 border-green-500/40 rounded-xl hover:border-green-500/60 transition-all duration-300"
                      style={{ 
                        animation: `fadeIn 0.5s ease-out ${index * 100}ms both`
                      }}
                    >
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <CheckCircle className="w-6 h-6 text-green-400 mt-0.5" />
                        <Lock className="w-4 h-4 text-green-400/70" />
                      </div>
                      <div className="flex-1 max-w-[85%]">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <span className="px-2 py-0.5 bg-green-500/30 text-green-300 rounded-full text-xs font-semibold border border-green-500/50">
                            {item.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Lock className="w-3 h-3 text-green-400/70" />
                          <span className="text-xs text-green-400/90 font-medium">Legally Strong</span>
                        </div>
                        <p className="text-sm text-purple-200 leading-relaxed mb-1">{item.description}</p>
                        {item.clause && (
                          <div className="text-xs text-purple-400 mt-2">📄 {item.clause}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Next Steps Panel - Action Buttons - Conversion Optimized */}
            {analysisResults.issues.length > 0 && (
              <>
              <div className="bg-gradient-to-br from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-purple-400/30 shadow-lg mb-24 md:mb-0 hidden md:block" style={{ marginBottom: 'max(96px, calc(96px + env(safe-area-inset-bottom)))' }}>
                <h3 className="font-semibold text-xl mb-4">Recommended Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Primary Green Button */}
                  <button
                    onClick={async () => {
                      if (!session?.access_token) {
                        toast.error('Please log in to download safe contract');
                        return;
                      }

                      if (!reportId) {
                        toast.error('Report ID not available. Please re-analyze the contract.');
                        return;
                      }
                      
                      // Use originalContractPath if available, otherwise fallback to contractUrl
                      const filePath = originalContractPath || contractUrl;
                      if (!filePath) {
                        toast.error('Contract file information not available. Please re-analyze the contract.');
                        return;
                      }

                      triggerHaptic(HapticPatterns.medium);
                      
                      try {
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                          (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
                            ? 'https://api.noticebazaar.com' 
                            : 'http://localhost:3001');
                        const response = await fetch(`${apiBaseUrl}/api/protection/generate-safe-contract`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            reportId,
                            originalFilePath: filePath
                          })
                        });

                        // Check if response is a file download (not JSON)
                        const contentType = response.headers.get('content-type');
                        
                        if (contentType && !contentType.includes('application/json')) {
                          // Direct file download - server returned file buffer
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          
                          // Get filename from Content-Disposition header or use default
                          const contentDisposition = response.headers.get('content-disposition');
                          const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
                          a.download = filenameMatch ? filenameMatch[1] : `safe-contract-version-${Date.now()}.pdf`;
                          
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success('Safe Version Downloaded');
                        } else {
                          // JSON response with URL (legacy fallback)
                          const data = await response.json();
                          
                          if (!response.ok || !data.success) {
                            throw new Error(data.error || 'Failed to generate safe contract');
                          }

                          // Download the safe contract
                          const downloadResponse = await fetch(data.safeContractUrl);
                          const blob = await downloadResponse.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `safe-contract-version-${Date.now()}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success('Safe Version Downloaded');
                        }
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Download safe contract error:', error);
                        toast.error(error.message || 'Failed to generate safe contract. Please try again.');
                      }
                    }}
                    className="bg-green-600/90 hover:bg-green-600 hover:shadow-xl hover:shadow-green-500/50 hover:-translate-y-1 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 md:col-span-1"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm">Download Safe Version</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-green-200 hover:text-green-100 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="bg-purple-900/95 border-white/20 text-white max-w-xs z-[10001]">
                            <p className="font-medium mb-1">Download Safe Version</p>
                            <p className="text-sm">We replace unfair or dangerous clauses with legally safer alternatives and create a new, renegotiation-ready contract PDF for you.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="text-xs text-green-100 font-normal">Auto-fixed, renegotiation ready</span>
                  </button>
                  {/* Secondary Orange Button */}
                  <button
                    onClick={async () => {
                      if (!session?.access_token) {
                        toast.error('Please log in to send for legal review');
                        return;
                      }

                      if (!reportId) {
                        toast.error('Report information not available. Please re-analyze the contract.');
                        return;
                      }

                      triggerHaptic(HapticPatterns.light);
                      
                      try {
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                          (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
                            ? 'https://api.noticebazaar.com' 
                            : 'http://localhost:3001');
                        const response = await fetch(`${apiBaseUrl}/api/protection/send-for-legal-review`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            reportId,
                            userEmail: profile?.email || session.user?.email,
                            userPhone: profile?.phone
                          })
                        });

                        // Check if response is JSON
                        const contentType = response.headers.get('content-type');
                        let data: any = {};
                        
                        if (contentType?.includes('application/json')) {
                          data = await response.json();
                        } else {
                          const text = await response.text();
                          throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                        }

                        if (!response.ok || !data.success) {
                          throw new Error(data.error || 'Failed to send for legal review');
                        }

                        toast.success('Sent for Legal Review');
                        navigate('/messages');
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Send for legal review error:', error);
                        toast.error(error.message || 'Failed to send for legal review. Please try again.');
                      }
                    }}
                    className="bg-yellow-600/80 hover:bg-yellow-600 hover:shadow-xl hover:shadow-yellow-500/50 hover:-translate-y-1 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Send className="w-5 h-5" />
                      <span className="text-sm">Send for Legal Review</span>
                    </div>
                    <span className="text-xs text-yellow-100 font-normal">Reviewed by professionals</span>
                  </button>
                  {/* Tertiary Red Button */}
                  <div className="relative">
                    <button
                      onClick={async () => {
                        if (!session?.access_token) {
                          toast.error('Please log in to generate negotiation message');
                          return;
                        }

                        if (!reportId) {
                          toast.error('Report information not available. Please re-analyze the contract.');
                          return;
                        }

                        if (!analysisResults || analysisResults.issues.length === 0) {
                          toast.error('No issues found to negotiate');
                          return;
                        }

                        triggerHaptic(HapticPatterns.light);
                        setIsGeneratingMessage(true);
                        
                        try {
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                            (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
                              ? 'https://api.noticebazaar.com' 
                              : 'http://localhost:3001');
                          const response = await fetch(`${apiBaseUrl}/api/protection/generate-negotiation-message`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                              reportId: reportId || null,
                              brandName: 'the Brand', // Could be extracted from contract or user input
                              // Send issues if reportId is not available
                              ...(reportId ? {} : {
                                issues: analysisResults?.issues
                                  ?.filter((issue: any) => issue.severity === 'high' || issue.severity === 'medium')
                                  .map((issue: any) => ({
                                    title: issue.title,
                                    category: issue.category,
                                    description: issue.description,
                                    recommendation: issue.recommendation,
                                    severity: issue.severity,
                                    clause_reference: issue.clause
                                  })) || []
                              })
                            })
                          });

                          // Check if response is JSON
                          const contentType = response.headers.get('content-type');
                          let data: any = {};
                          
                          if (contentType?.includes('application/json')) {
                            data = await response.json();
                          } else {
                            const text = await response.text();
                            throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                          }

                          if (!response.ok || !data.success) {
                            throw new Error(data.error || 'Failed to generate negotiation message');
                          }

                          // Set message and show modal
                          // Format message with dynamic fields (creator name, deal value, duration)
                          const formattedMessage = formatNegotiationMessage(data.message);
                          setNegotiationMessage(formattedMessage);
                          setShowNegotiationModal(true);
                          toast.success('Negotiation message generated!');
                        } catch (error: any) {
                          console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                          toast.error(error.message || 'Failed to generate negotiation message. Please try again.');
                        } finally {
                          setIsGeneratingMessage(false);
                        }
                      }}
                      disabled={isGeneratingMessage}
                      className="bg-red-600/80 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/50 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 w-full"
                    >
                      <div className="flex items-center gap-2">
                        {isGeneratingMessage ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <FileCheck className="w-5 h-5" />
                        )}
                        <span className="text-sm">
                          {isGeneratingMessage ? 'Preparing legal request…' : 'Request Clause Changes'}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="w-4 h-4 text-red-200 hover:text-red-100 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-purple-900/95 border-white/20 text-white max-w-xs z-[10001]">
                              <p className="font-medium mb-1">Request Clause Changes</p>
                              <p className="text-sm">We generate a polite, legally worded negotiation message you can send on WhatsApp or Email to request changes from the brand.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="text-xs text-red-100 font-normal">Send editable change request</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Sticky Mobile Action Bar */}
              <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl border-t border-purple-500/30 shadow-2xl p-4" style={{ paddingBottom: 'max(16px, calc(64px + env(safe-area-inset-bottom)))' }}>
                <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                  <button
                    onClick={async () => {
                      if (!session?.access_token) {
                        toast.error('Please log in to download safe contract');
                        return;
                      }

                      // Check if we have the contract file path (required)
                      const filePath = originalContractPath || contractUrl;
                      if (!filePath || filePath.trim() === '') {
                        toast.error('Contract file information not available. Please re-analyze the contract.');
                        return;
                      }

                      // Log what we're sending
                      console.log('[ContractUploadFlow] Generating safe contract:', {
                        hasReportId: !!reportId,
                        hasFilePath: !!filePath,
                        filePath: filePath.substring(0, 50) + '...'
                      });

                      triggerHaptic(HapticPatterns.medium);
                      
                      try {
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                          (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
                            ? 'https://api.noticebazaar.com' 
                            : 'http://localhost:3001');
                        const response = await fetch(`${apiBaseUrl}/api/protection/generate-safe-contract`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify({
                            reportId: reportId || null, // Send null explicitly if not available
                            originalFilePath: filePath // Use the validated filePath
                          })
                        });

                        const contentType = response.headers.get('content-type');
                        
                        // Check if response is a file download (not JSON)
                        if (contentType && !contentType.includes('application/json')) {
                          // Direct file download - server returned file buffer
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          
                          // Get filename from Content-Disposition header or use default
                          const contentDisposition = response.headers.get('content-disposition');
                          const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
                          a.download = filenameMatch ? filenameMatch[1] : `safe-contract-version-${Date.now()}.pdf`;
                          
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success('Safe Version Downloaded');
                        } else {
                          // JSON response with URL (legacy fallback)
                          const data = await response.json();
                          
                          if (!response.ok || !data.success) {
                            throw new Error(data.error || 'Failed to generate safe contract');
                          }

                          const downloadResponse = await fetch(data.safeContractUrl);
                          const blob = await downloadResponse.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `safe-contract-version-${Date.now()}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          toast.success('Safe Version Downloaded');
                        }
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Download safe contract error:', error);
                        toast.error(error.message || 'Failed to generate safe contract. Please try again.');
                      }
                    }}
                    className="bg-green-600/90 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm">Download Safe Version</span>
                  </button>
                  <button
                    onClick={async () => {
                      if (!session?.access_token) {
                        toast.error('Please log in to generate negotiation message');
                        return;
                      }

                      if (!analysisResults || analysisResults.issues.length === 0) {
                        toast.error('No issues found to negotiate');
                        return;
                      }

                      triggerHaptic(HapticPatterns.light);
                      setIsGeneratingMessage(true);
                      
                      try {
                        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                          (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
                            ? 'https://api.noticebazaar.com' 
                            : 'http://localhost:3001');
                        
                        // Prepare request body - send issues if reportId is not available
                        const requestBody: any = {
                          brandName: 'the Brand'
                        };
                        
                        if (reportId) {
                          requestBody.reportId = reportId;
                        } else {
                          // Send issues directly when reportId is not available
                          requestBody.issues = analysisResults.issues
                            .filter((issue: any) => issue.severity === 'high' || issue.severity === 'medium')
                            .map((issue: any) => ({
                              title: issue.title,
                              category: issue.category,
                              description: issue.description,
                              recommendation: issue.recommendation,
                              severity: issue.severity,
                              clause_reference: issue.clause
                            }));
                        }
                        
                        const response = await fetch(`${apiBaseUrl}/api/protection/generate-negotiation-message`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                          },
                          body: JSON.stringify(requestBody)
                        });

                        const contentType = response.headers.get('content-type');
                        let data: any = {};
                        
                        if (contentType?.includes('application/json')) {
                          data = await response.json();
                        } else {
                          const text = await response.text();
                          throw new Error(`Server returned ${response.status}: ${text.substring(0, 100)}`);
                        }

                        if (!response.ok || !data.success) {
                          throw new Error(data.error || 'Failed to generate negotiation message');
                        }

                        setNegotiationMessage(data.message);
                        setShowNegotiationModal(true);
                        toast.success('Negotiation message generated!');
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                        toast.error(error.message || 'Failed to generate negotiation message. Please try again.');
                      } finally {
                        setIsGeneratingMessage(false);
                      }
                    }}
                    className="bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    <span className="text-sm">Send to Brand</span>
                  </button>
                </div>
              </div>
            </>
            )}


            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-3">
              <button 
                onClick={() => {
                  navigate('/messages');
                  toast.success('Sent for Legal Review');
                }}
                className="flex-1 bg-white/10 hover:bg-white/15 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-5 h-5" />
                Get Legal Review
              </button>
              <button 
                onClick={async () => {
                  // Get creator_id - use profile.id or fallback to session.user.id for new accounts
                  const creatorId = profile?.id || session?.user?.id;
                  
                  if (!creatorId) {
                    toast.error('Unable to create deal. Please log in again.');
                    return;
                  }

                  if (!uploadedFile) {
                    toast.error('Contract file is missing. Please upload again.');
                    return;
                  }

                  try {
                    // Extract deal value from keyTerms (remove ₹ and commas)
                    const dealValueStr = (analysisResults.keyTerms.dealValue || '0').replace(/[₹,]/g, '').trim();
                    const dealAmount = parseFloat(dealValueStr) || 0;

                    // Calculate due date (30 days from now as default)
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + 30);
                    const dueDateStr = dueDate.toISOString().split('T')[0];

                    // Create deal
                    await addDealMutation.mutateAsync({
                      creator_id: creatorId,
                      organization_id: null,
                      brand_name: 'Contract Upload', // Default brand name, user can edit later
                      deal_amount: dealAmount,
                      deliverables: analysisResults?.keyTerms?.deliverables || 'As per contract',
                      contract_file: uploadedFile,
                      due_date: dueDateStr,
                      payment_expected_date: dueDateStr,
                      contact_person: null,
                      platform: 'Other',
                      status: 'Negotiation' as const,
                      invoice_file: null,
                      utr_number: null,
                      brand_email: null,
                      payment_received_date: null,
                    });

                    toast.success('Deal created successfully!', {
                      description: 'Your contract has been added to your deals.',
                    });

                    // Navigate to deals page
                    navigate('/creator-contracts');
                  } catch (error: any) {
                    console.error('[ContractUploadFlow] Error creating deal:', error);
                    toast.error('Failed to create deal', {
                      description: error?.message || 'Please try again or contact support.',
                    });
                  }
                }}
                disabled={addDealMutation.isPending || !uploadedFile}
                className="flex-1 bg-green-600 hover:bg-green-700 font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addDealMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Deal...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Add to Dashboard
                  </>
                )}
              </button>
            </div>

            {/* Clause Generation Modal */}
            {selectedIssueForClause !== null && generatedClause && (() => {
              const issue = analysisResults.issues.find(i => i.id === selectedIssueForClause);
              if (!issue) return null;
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold">Auto-Generated Safe Clause</h3>
                        <button
                          onClick={() => {
                            setSelectedIssueForClause(null);
                            setGeneratedClause(null);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Original Risky Clause */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <h4 className="font-semibold text-red-400">Original Risky Clause</h4>
                        </div>
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                          <p className="text-sm text-purple-200">{issue.clause || issue.description}</p>
                        </div>
                      </div>

                      {/* Safer Replacement */}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <h4 className="font-semibold text-green-400">Safer Replacement Clause</h4>
                        </div>
                        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <p className="text-sm text-purple-200 whitespace-pre-line">{generatedClause}</p>
                        </div>
                      </div>

                      {/* Copy Button */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedClause);
                          toast.success('Clause copied to clipboard!');
                        }}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <Copy className="w-5 h-5" />
                        Copy Safe Clause
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Negotiation Message Modal */}
            <Dialog open={showNegotiationModal} onOpenChange={setShowNegotiationModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl border border-purple-500/30 text-white overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white mb-2">
                    Request Contract Changes from Brand
                  </DialogTitle>
                  <DialogDescription className="text-purple-200">
                    Review and edit the AI-generated negotiation message before sending
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Editable Message Textarea */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">
                      Negotiation Message
                    </label>
                    <textarea
                      value={negotiationMessage || ''}
                      onChange={(e) => setNegotiationMessage(e.target.value)}
                      className="w-full min-h-[300px] p-4 bg-white/10 border border-purple-400/30 rounded-xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                      placeholder="Loading negotiation message..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                    {/* Copy Button */}
                    <button
                      onClick={async () => {
                        if (!negotiationMessage) return;
                        try {
                          // Ensure message is formatted with latest data
                          const formattedMessage = formatNegotiationMessage(negotiationMessage);
                          await navigator.clipboard.writeText(formattedMessage);
                          triggerHaptic(HapticPatterns.light);
                          toast.success('Negotiation message copied');
                        } catch (error) {
                          toast.error('Failed to copy message');
                        }
                      }}
                      className="bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Copy className="w-5 h-5" />
                      Copy Message
                    </button>

                    {/* WhatsApp Button */}
                    <button
                      onClick={() => {
                        if (!negotiationMessage) return;
                        // Ensure message is formatted with latest data
                        const formattedMessage = formatNegotiationMessage(negotiationMessage);
                        const encodedMessage = encodeURIComponent(formattedMessage);
                        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                        triggerHaptic(HapticPatterns.medium);
                        window.open(whatsappUrl, '_blank');
                        toast.success('Opening WhatsApp...');
                      }}
                      className="bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Send on WhatsApp
                    </button>

                    {/* Email Button */}
                    <button
                      onClick={() => {
                        // Show email input modal or use existing brandEmail state
                        const email = prompt('Enter brand email address:');
                        if (!email) return;
                        setBrandEmail(email);
                        handleSendEmail(email);
                      }}
                      className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      Send via Email
                    </button>
                  </div>

                  {/* Email Input Section (if email button clicked) */}
                  {brandEmail && (
                    <div className="mt-4 p-4 bg-white/10 border border-purple-400/30 rounded-xl">
                      <label className="block text-sm font-medium text-purple-200 mb-2">
                        Brand Email Address
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={brandEmail}
                          onChange={(e) => setBrandEmail(e.target.value)}
                          placeholder="brand@example.com"
                          className="flex-1 px-4 py-2 bg-white/10 border border-purple-400/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handleSendEmail(brandEmail)}
                          disabled={isSendingEmail || !brandEmail}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                        >
                          {isSendingEmail ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          Send
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowNegotiationModal(false);
                      setBrandEmail('');
                    }}
                    className="w-full bg-gray-600/80 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-4"
                  >
                    <X className="w-5 h-5" />
                    Close
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
        )}
      </div>
    </div>
    </ContextualTipsProvider>
  );
};

export default ContractUploadFlow;

