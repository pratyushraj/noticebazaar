import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertTriangle, XCircle, Loader, Sparkles, Shield, Eye, Download, IndianRupee, Calendar, Loader2, Copy, Wrench, Send, FileCheck, X, Wand2, Lock, Info, MessageSquare, Mail, ChevronDown, ChevronUp, TrendingUp, DollarSign, FileCode, Ban, AlertCircle, ArrowDown, Clock, Star, Heart, Zap, CreditCard, Building2, Gift, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
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
  const [dealType, setDealType] = useState<'contract' | 'barter'>('contract'); // 'contract' or 'barter'
  
  // Barter Deal State
  const [barterChatText, setBarterChatText] = useState('');
  const [barterFormData, setBarterFormData] = useState({
    brandName: '',
    productName: '',
    deliverables: '',
    productValue: '',
    usageRights: '',
    timeline: '',
  });
  const [barterInputMode, setBarterInputMode] = useState<'chat' | 'form'>('chat'); // 'chat' or 'form'
  const [isGeneratingBarter, setIsGeneratingBarter] = useState(false);
  const [barterError, setBarterError] = useState<string | null>(null);
  const [isBarterDeal, setIsBarterDeal] = useState(false); // Flag to track if current analysis is from barter
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
  
  // Brand Approval Tracker State
  const [brandApprovalStatus, setBrandApprovalStatus] = useState<'sent' | 'viewed' | 'negotiating' | 'approved' | 'rejected' | null>(null);
  const [approvalStatusUpdatedAt, setApprovalStatusUpdatedAt] = useState<Date | null>(null);
  
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

    // Format the message with India-optimized template
    let formattedMessage = `Subject: Requested Revisions for ${brandName} Collaboration Agreement

Dear ${brandName},

Thank you for sharing the contract and for the opportunity to collaborate. I truly appreciate the interest and am excited about the potential association.

After reviewing the agreement, I would like to request a few minor revisions to ensure clarity and fairness for both parties:

${issuesContent}

These changes will help us maintain a long-term and professional working relationship.

Kindly share the revised agreement at your convenience.

Looking forward to working together.

Warm regards,
${creatorName}`;

    // Add contact info if available
    const creatorEmail = session?.user?.email || '';
    const creatorPhone = profile?.phone || '';
    if (creatorEmail || creatorPhone) {
      formattedMessage += `\n\n${creatorPhone ? `${creatorPhone} | ` : ''}${creatorEmail}`;
    }

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
      brandName?: string;
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
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);
  const [isKeyTermsExpanded, setIsKeyTermsExpanded] = useState(false);
  const [isIssuesExpanded, setIsIssuesExpanded] = useState(true);
  const [isProtectionStatusExpanded, setIsProtectionStatusExpanded] = useState(false);
  const [isMissingClausesExpanded, setIsMissingClausesExpanded] = useState(false);
  const [isFinancialBreakdownExpanded, setIsFinancialBreakdownExpanded] = useState(false);
  const [isRecommendedActionsExpanded, setIsRecommendedActionsExpanded] = useState(false);

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
  
  // Calculate fixed issues count
  const fixedIssuesCount = analysisResults ? (
    Array.from(clauseStates.values()).filter(s => s === 'success').length + resolvedIssues.size
  ) : 0;
  const totalIssuesCount = analysisResults?.issues?.length || 0;
  
  // Get top 2 most dangerous issues (sorted by severity: high > medium > low > warning)
  const getTopIssues = (issues: any[]) => {
    const severityOrder = { high: 4, medium: 3, low: 2, warning: 1 };
    return [...issues]
      .filter(issue => !resolvedIssues.has(issue.id))
      .sort((a, b) => (severityOrder[b.severity as keyof typeof severityOrder] || 0) - (severityOrder[a.severity as keyof typeof severityOrder] || 0))
      .slice(0, 2);
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

      // Set brand approval status to 'sent' when email is successfully sent
      setBrandApprovalStatus('sent');
      setApprovalStatusUpdatedAt(new Date());
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

  // Missing Price Alert Component
  const MissingPriceAlert = ({ onAskBrand }: { onAskBrand: () => void }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        const alertElement = document.getElementById('deal-breaker-alert');
        if (alertElement) {
          alertElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }, []);

    return (
      <motion.div
        id="deal-breaker-alert"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-red-500/20 border-2 border-red-500/50 rounded-xl p-5 md:p-6 relative overflow-hidden"
      >
        {/* Pulse animation */}
        <motion.div
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 bg-red-500/10 rounded-xl"
        />
        <div className="relative z-10">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-lg md:text-xl text-red-300 mb-2">
                🔴 DEAL BREAKER ALERT: Payment amount is missing
              </h4>
              <p className="text-sm text-red-200/80 leading-relaxed">
                This contract does not specify the payment amount. This is a critical issue that must be addressed before proceeding.
              </p>
            </div>
          </div>
          <motion.button
            onClick={onAskBrand}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Ask Brand to Add Price
          </motion.button>
        </div>
      </motion.div>
    );
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

  // Helper function to create WhatsApp-optimized message (under 600 chars)
  const createWhatsAppMessage = (fullMessage: string): string => {
    // Extract key points from the full message
    const lines = fullMessage.split('\n');
    let whatsappMessage = '';
    
    // Start with greeting
    if (lines[0].includes('Dear') || lines[0].includes('Subject')) {
      whatsappMessage = 'Hi! 👋\n\n';
    }
    
    // Extract main request
    const requestSection = lines.find(line => 
      line.toLowerCase().includes('request') || 
      line.toLowerCase().includes('revision') ||
      line.toLowerCase().includes('clarification')
    );
    
    if (requestSection) {
      whatsappMessage += requestSection + '\n\n';
    }
    
    // Add key issues (truncate if needed)
    const issuesStart = lines.findIndex(line => line.match(/^\d+\./));
    if (issuesStart !== -1) {
      let issueCount = 0;
      for (let i = issuesStart; i < Math.min(issuesStart + 3, lines.length); i++) {
        if (lines[i].trim() && issueCount < 2) {
          whatsappMessage += lines[i] + '\n';
          issueCount++;
        }
      }
    }
    
    // Add closing
    whatsappMessage += '\nPlease share the revised contract. Thanks! 🙏';
    
    // Truncate if still too long
    if (whatsappMessage.length > 600) {
      whatsappMessage = whatsappMessage.substring(0, 597) + '...';
    }
    
    return whatsappMessage;
  };

  // Copy Email handler
  const handleCopyEmail = async () => {
    if (!negotiationMessage) {
      toast.error('Please generate a negotiation message first');
      return;
    }
    
    const emailMessage = formatNegotiationMessage(negotiationMessage);
    await navigator.clipboard.writeText(emailMessage);
    toast.success('Copied for Email');
    triggerHaptic(HapticPatterns.light);
  };

  // Copy WhatsApp handler
  const handleCopyWhatsApp = async () => {
    if (!negotiationMessage) {
      toast.error('Please generate a negotiation message first');
      return;
    }
    
    const fullMessage = formatNegotiationMessage(negotiationMessage);
    const whatsappMessage = createWhatsAppMessage(fullMessage);
    
    // Show preview modal first
    setShowWhatsAppPreview(true);
    triggerHaptic(HapticPatterns.light);
  };
  
  const handleConfirmWhatsAppCopy = async () => {
    if (!negotiationMessage) return;
    
    const fullMessage = formatNegotiationMessage(negotiationMessage);
    const whatsappMessage = createWhatsAppMessage(fullMessage);
    await navigator.clipboard.writeText(whatsappMessage);
    toast.success('Copied for WhatsApp');
    setShowWhatsAppPreview(false);
  };

  // Share Feedback modal state
  const [showShareFeedbackModal, setShowShareFeedbackModal] = useState(false);

  // Helper function to build mock barter analysis from chat text
  const buildMockBarterAnalysis = (chatText: string): NonNullable<typeof analysisResults> => {
    const lowerText = chatText.toLowerCase();
    
    // Extract brand name
    let brandName = 'Brand (from chat)';
    const brandPatterns = [
      /(?:hi|hello|hey)[\s,]+(?:this is|i'm|i am|from)[\s]+([A-Z][a-zA-Z\s&]+?)(?:[\s,]+(?:team|brand|here)|$)/i,
      /(?:from|by)[\s]+([A-Z][a-zA-Z\s&]+?)(?:[\s,]+(?:team|brand)|$)/i,
      /([A-Z][a-zA-Z\s&]{2,20})(?:[\s,]+(?:brand|team|here))/i,
    ];
    for (const pattern of brandPatterns) {
      const match = chatText.match(pattern);
      if (match && match[1]) {
        brandName = match[1].trim();
        break;
      }
    }
    
    // Extract product
    let product = '';
    const productPatterns = [
      /(?:sending you|we'll send|we will send|gift|product)[\s:]+([A-Za-z\s&]+?)(?:[\s,]+(?:worth|valued|₹)|$)/i,
      /(?:product|item)[\s:]+([A-Za-z\s&]+?)(?:[\s,]+(?:worth|valued)|$)/i,
    ];
    for (const pattern of productPatterns) {
      const match = chatText.match(pattern);
      if (match && match[1]) {
        product = match[1].trim();
        break;
      }
    }
    
    // Extract deliverables
    let deliverables = '';
    const deliverablePatterns = [
      /(\d+)[\s]*(?:instagram|insta|ig)[\s]*(?:reel|reels|post|posts|story|stories)/i,
      /(?:post|reel|story)[\s]+(\d+)/i,
      /(\d+)[\s]*(?:content|post|reel|story)/i,
    ];
    for (const pattern of deliverablePatterns) {
      const match = chatText.match(pattern);
      if (match) {
        const count = match[1];
        const type = lowerText.includes('reel') ? 'Reels' : lowerText.includes('story') ? 'Stories' : 'Posts';
        deliverables = `${count} Instagram ${type}`;
        break;
      }
    }
    if (!deliverables && (lowerText.includes('post') || lowerText.includes('reel') || lowerText.includes('story'))) {
      deliverables = 'Content posts (extracted from chat)';
    }
    
    // Extract product value
    let productValue = '';
    const valueMatch = chatText.match(/₹[\s]*([\d,]+)|([\d,]+)[\s]*(?:rupees|rs|inr)/i);
    if (valueMatch) {
      productValue = valueMatch[1] || valueMatch[2] || '';
      if (productValue && !productValue.includes('₹')) {
        productValue = `₹${productValue}`;
      }
    }
    
    // Extract timeline
    let timeline = '';
    const timelineMatch = chatText.match(/(\d+)[\s]*(?:days?|weeks?|months?)/i);
    if (timelineMatch) {
      timeline = timelineMatch[0];
    }
    
    // Determine risk level and score
    let protectionScore = 45; // Default for barter deals (lower than contracts)
    let overallRisk: RiskLevel = 'high';
    
    // Adjust score based on what's mentioned
    if (deliverables) protectionScore += 10;
    if (productValue) protectionScore += 10;
    if (timeline) protectionScore += 5;
    if (lowerText.includes('usage') || lowerText.includes('rights')) protectionScore += 5;
    
    if (protectionScore >= 60) overallRisk = 'medium';
    if (protectionScore >= 75) overallRisk = 'low';
    
    // Build issues array
    const issues: NonNullable<typeof analysisResults>['issues'] = [];
    
    if (!deliverables || deliverables.includes('extracted')) {
      issues.push({
        id: 1,
        severity: 'high',
        category: 'Deliverables',
        title: 'No written confirmation of deliverables',
        description: 'The chat does not clearly specify what content you need to create. This can lead to scope creep or disputes later.',
        recommendation: 'Ask the brand to confirm deliverables and posting date in one message.',
      });
    }
    
    if (!timeline) {
      issues.push({
        id: 2,
        severity: 'high',
        category: 'Timeline',
        title: 'No timeline for product delivery',
        description: 'There is no clear deadline mentioned for when you will receive the product or when you need to post.',
        recommendation: 'Clarify both product delivery date and content posting deadline.',
      });
    }
    
    if (!lowerText.includes('usage') && !lowerText.includes('rights')) {
      issues.push({
        id: 3,
        severity: 'high',
        category: 'Usage Rights',
        title: 'No clarity on usage rights of your content',
        description: 'The chat does not specify how the brand can use your content. They may reuse it in ads or repost without permission.',
        recommendation: 'Clarify if they can reuse your content in ads and ask for tag/credit requirements.',
      });
    }
    
    if (!productValue) {
      issues.push({
        id: 4,
        severity: 'medium',
        category: 'Product Value',
        title: 'Product value not specified',
        description: 'The value of the product/service you are receiving is not mentioned, making it hard to assess if the deal is fair.',
        recommendation: 'Ask the brand to confirm the product value to ensure fair exchange.',
      });
    }
    
    // Build verified items
    const verified: NonNullable<typeof analysisResults>['verified'] = [];
    if (brandName && brandName !== 'Brand (from chat)') {
      verified.push({
        id: 1,
        category: 'Brand Identification',
        title: 'Brand name identified',
        description: `Brand identified as: ${brandName}`,
      });
    }
    
    if (product) {
      verified.push({
        id: 2,
        category: 'Product/Service',
        title: 'Product identified',
        description: `Product/service: ${product}`,
      });
    }
    
    return {
      overallRisk,
      score: Math.min(100, Math.max(0, protectionScore)),
      negotiationPowerScore: 35, // Lower for barter deals
      issues,
      verified,
      keyTerms: {
        dealValue: productValue || 'Product/Service Exchange',
        duration: timeline || 'Not specified',
        deliverables: deliverables || 'Not specified',
        paymentSchedule: 'Barter - No payment',
        exclusivity: 'Not specified',
        brandName: brandName,
      },
      dealType: 'barter',
    };
  };

  // Handle barter report generation
  const handleGenerateBarterReport = async () => {
    const chatText = barterInputMode === 'chat' ? barterChatText : 
      `Brand: ${barterFormData.brandName}\nProduct: ${barterFormData.productName}\nDeliverables: ${barterFormData.deliverables}\nProduct Value: ${barterFormData.productValue || 'Not specified'}\nUsage Rights: ${barterFormData.usageRights || 'Not specified'}\nTimeline: ${barterFormData.timeline || 'Not specified'}`;
    
    if (!chatText.trim()) {
      const errorMsg = 'Please paste your WhatsApp / Instagram chat before generating a report.';
      setBarterError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    // Validate form mode
    if (barterInputMode === 'form' && !barterFormData.brandName.trim() && !barterFormData.deliverables.trim()) {
      const errorMsg = 'Please fill in at least Brand Name and Deliverables.';
      setBarterError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    
    try {
      setIsGeneratingBarter(true);
      setBarterError(null);
      triggerHaptic(HapticPatterns.medium);
      setIsAnalyzing(true);
      setStep('analyzing');
      
      // Try real API first
      let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const useLocalApi = localStorage.getItem('useLocalApi') === 'true' || 
                           urlParams.get('localApi') === 'true';
        const tunnelUrl = urlParams.get('tunnelUrl') || localStorage.getItem('tunnelUrl');
        
        if (useLocalApi && tunnelUrl) {
          apiBaseUrl = tunnelUrl.replace(/\/$/, '');
        } else if (useLocalApi) {
          apiBaseUrl = 'http://localhost:3001';
        }
      }
      
      if (!apiBaseUrl && typeof window !== 'undefined') {
        apiBaseUrl = window.location.origin.replace(':8080', ':3001');
      }
      
      let report: NonNullable<typeof analysisResults> | null = null;
      
      try {
        const res = await fetch(`${apiBaseUrl}/api/protection/analyze-barter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ 
            chatText: barterInputMode === 'chat' ? barterChatText : null,
            formData: barterInputMode === 'form' ? barterFormData : null,
            inputType: barterInputMode,
          }),
        });
        
        if (res.ok) {
          const responseData = await res.json();
          if (responseData.success && responseData.data?.analysis_json) {
            const analysis = responseData.data.analysis_json;
            report = {
              overallRisk: analysis.overallRisk || 'medium',
              score: analysis.protectionScore || 45,
              negotiationPowerScore: analysis.negotiationPowerScore || 35,
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
                dealValue: analysis.keyTerms?.dealValue || barterFormData.productValue || 'Product/Service Exchange',
                duration: analysis.keyTerms?.duration || barterFormData.timeline,
                deliverables: analysis.keyTerms?.deliverables || barterFormData.deliverables,
                paymentSchedule: 'Barter - No payment',
                exclusivity: analysis.keyTerms?.exclusivity,
                brandName: analysis.keyTerms?.brandName || barterFormData.brandName,
              },
              dealType: 'barter',
            };
          }
        }
      } catch (apiError) {
        console.log('[ContractUploadFlow] Barter API not available, using mock analysis');
      }
      
      // Fallback: use mock analysis
      if (!report) {
        report = buildMockBarterAnalysis(chatText);
      }
      
      // Set analysis results and navigate to results view
      setAnalysisResults(report);
      setIsBarterDeal(true);
      setStep('results');
      toast.success('Barter protection report generated!');
      
    } catch (err: any) {
      console.error('[ContractUploadFlow] Barter report generation error:', err);
      const errorMsg = 'Something went wrong while generating the barter protection report. Please try again.';
      setBarterError(errorMsg);
      toast.error(errorMsg);
      setStep('upload');
    } finally {
      setIsGeneratingBarter(false);
      setIsAnalyzing(false);
    }
  };

  // Calculate contract safety progress
  const getContractSafetyProgress = () => {
    if (!analysisResults || !analysisResults.issues || analysisResults.issues.length === 0) return 0;
    const totalIssues = analysisResults.issues.length;
    if (totalIssues === 0) return 100; // No issues = 100% protected
    
    const resolvedCount = resolvedIssues?.size || 0;
    const generatedCount = clauseStates ? Array.from(clauseStates.values()).filter(s => s === 'success').length : 0;
    const progress = totalIssues > 0 ? ((resolvedCount + generatedCount * 0.5) / totalIssues) * 100 : 0;
    return Math.min(100, Math.max(0, progress));
  };

  // Get dynamic risk-based status based on progress percentage
  const getProtectionStatus = (progress: number) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    if (clampedProgress === 100) {
      return {
        label: 'Fully Secured',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        borderColor: 'border-green-500/50',
        shieldColor: 'text-green-400',
        glowColor: 'rgba(34, 197, 94, 0.6)', // green-500
        gradientStart: '#10b981', // emerald-500
        gradientEnd: '#059669', // emerald-600
        icon: '✅'
      };
    } else if (clampedProgress >= 76) {
      return {
        label: 'Almost Secure',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/50',
        shieldColor: 'text-blue-400',
        glowColor: 'rgba(59, 130, 246, 0.6)', // blue-500
        gradientStart: '#3b82f6', // blue-500
        gradientEnd: '#2563eb', // blue-600
        icon: '🛡️'
      };
    } else if (clampedProgress >= 51) {
      return {
        label: 'Improving Protection',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        borderColor: 'border-yellow-500/50',
        shieldColor: 'text-yellow-400',
        glowColor: 'rgba(234, 179, 8, 0.6)', // yellow-500
        gradientStart: '#eab308', // yellow-500
        gradientEnd: '#ca8a04', // yellow-600
        icon: '⚠️'
      };
    } else if (clampedProgress >= 26) {
      return {
        label: 'Moderate Risk',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        borderColor: 'border-orange-500/50',
        shieldColor: 'text-orange-400',
        glowColor: 'rgba(249, 115, 22, 0.6)', // orange-500
        gradientStart: '#f97316', // orange-500
        gradientEnd: '#ea580c', // orange-600
        icon: '▲'
      };
    } else {
      return {
        label: 'High Risk',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/50',
        shieldColor: 'text-red-400',
        glowColor: 'rgba(239, 68, 68, 0.6)', // red-500
        gradientStart: '#ef4444', // red-500
        gradientEnd: '#dc2626', // red-600
        icon: '⚠️'
      };
    }
  };

  // Get smooth gradient colors for progress bar based on percentage
  // Transitions: Red (0%) → Orange (25%) → Yellow (50%) → Blue (75%) → Green (100%)
  const getProgressGradient = (progress: number) => {
    const clampedProgress = Math.min(100, Math.max(0, progress));
    
    // Define color stops for smooth transitions
    if (clampedProgress === 0) {
      return { start: '#ef4444', end: '#dc2626' }; // Red
    } else if (clampedProgress < 25) {
      // Red to Orange
      const ratio = clampedProgress / 25;
      const r = Math.round(239 + (249 - 239) * ratio);
      const g = Math.round(68 + (115 - 68) * ratio);
      const b = Math.round(68 + (22 - 68) * ratio);
      const r2 = Math.round(220 + (234 - 220) * ratio);
      const g2 = Math.round(38 + (88 - 38) * ratio);
      const b2 = Math.round(38 + (12 - 38) * ratio);
      return { start: `rgb(${r}, ${g}, ${b})`, end: `rgb(${r2}, ${g2}, ${b2})` };
    } else if (clampedProgress < 50) {
      // Orange to Yellow
      const ratio = (clampedProgress - 25) / 25;
      const r = Math.round(249 + (234 - 249) * ratio);
      const g = Math.round(115 + (179 - 115) * ratio);
      const b = Math.round(22 + (8 - 22) * ratio);
      const r2 = Math.round(234 + (202 - 234) * ratio);
      const g2 = Math.round(88 + (138 - 88) * ratio);
      const b2 = Math.round(12 + (4 - 12) * ratio);
      return { start: `rgb(${r}, ${g}, ${b})`, end: `rgb(${r2}, ${g2}, ${b2})` };
    } else if (clampedProgress < 75) {
      // Yellow to Blue
      const ratio = (clampedProgress - 50) / 25;
      const r = Math.round(234 + (59 - 234) * ratio);
      const g = Math.round(179 + (130 - 179) * ratio);
      const b = Math.round(8 + (246 - 8) * ratio);
      const r2 = Math.round(202 + (37 - 202) * ratio);
      const g2 = Math.round(138 + (99 - 138) * ratio);
      const b2 = Math.round(4 + (235 - 4) * ratio);
      return { start: `rgb(${r}, ${g}, ${b})`, end: `rgb(${r2}, ${g2}, ${b2})` };
    } else if (clampedProgress < 100) {
      // Blue to Green
      const ratio = (clampedProgress - 75) / 25;
      const r = Math.round(59 + (16 - 59) * ratio);
      const g = Math.round(130 + (185 - 130) * ratio);
      const b = Math.round(246 + (129 - 246) * ratio);
      const r2 = Math.round(37 + (5 - 37) * ratio);
      const g2 = Math.round(99 + (150 - 99) * ratio);
      const b2 = Math.round(235 + (105 - 235) * ratio);
      return { start: `rgb(${r}, ${g}, ${b})`, end: `rgb(${r2}, ${g2}, ${b2})` };
    } else {
      return { start: '#10b981', end: '#059669' }; // Green (100%)
    }
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
      let apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      
      // Check for local testing mode (for testing on noticebazaar.com with local API via tunnel)
      // This works on mobile too! Just use URL parameters: ?localApi=true&tunnelUrl=https://...
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const useLocalApi = localStorage.getItem('useLocalApi') === 'true' || 
                           urlParams.get('localApi') === 'true';
        // Get tunnel URL from URL param (preferred - works on mobile!) or localStorage
        const tunnelUrl = urlParams.get('tunnelUrl') || localStorage.getItem('tunnelUrl');
        
        if (useLocalApi) {
          // Use tunnel URL if available, otherwise fallback to localhost (won't work from noticebazaar.com)
          if (tunnelUrl) {
            apiBaseUrl = tunnelUrl.replace(/\/$/, ''); // Remove trailing slash
            console.log('[ContractUploadFlow] Using tunnel API for testing:', apiBaseUrl);
            console.log('[ContractUploadFlow] ✅ Works on mobile too!');
          } else {
            apiBaseUrl = 'http://localhost:3001';
            console.warn('[ContractUploadFlow] Using localhost API (may not work from noticebazaar.com due to CORS). Set tunnelUrl in localStorage or URL param.');
          }
        }
      }
      
      if (!apiBaseUrl && typeof window !== 'undefined') {
        const origin = window.location.origin;
        // If on production domain, try api subdomain first, then same origin
        if (origin.includes('noticebazaar.com')) {
          // Try api subdomain, but fallback to same origin if it fails
          apiBaseUrl = 'https://api.noticebazaar.com';
        } else {
          // Local development
          apiBaseUrl = 'http://localhost:3001';
        }
      } else if (!apiBaseUrl) {
        apiBaseUrl = 'http://localhost:3001';
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Please log in to analyze contracts');
      }

      if (!contractUrl) {
        throw new Error('Contract file URL is missing. Please upload again.');
      }

      const apiEndpoint = `${apiBaseUrl}/api/protection/analyze`;
      console.log('[ContractUploadFlow] Calling API:', apiEndpoint);
      console.log('[ContractUploadFlow] Current origin:', typeof window !== 'undefined' ? window.location.origin : 'server');

      let response;
      try {
        response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            contract_url: contractUrl,
          }),
        });
      } catch (fetchError: any) {
        console.error('[ContractUploadFlow] Analysis error:', fetchError);
        
        // Check if it's a network error (API might be sleeping on free tier)
        const isNetworkError = fetchError.message?.includes('Failed to fetch') || 
                               fetchError.message?.includes('NetworkError') ||
                               fetchError.name === 'TypeError';
        
        if (isNetworkError) {
          // API might be sleeping (Render free tier spins down after inactivity)
          const errorMessage = 'The analysis service is starting up. Please wait a moment and try again. This usually takes 30-50 seconds after the first request.';
          setReviewError(errorMessage);
          setStep('review-error');
          setIsAnalyzing(false);
          return;
        }
        
        // If api subdomain fails and we're on production, try same origin
        if (apiBaseUrl.includes('api.noticebazaar.com') && typeof window !== 'undefined') {
          console.warn('[ContractUploadFlow] API subdomain failed, trying same origin:', fetchError);
          const sameOriginUrl = `${window.location.origin}/api/protection/analyze`;
          console.log('[ContractUploadFlow] Retrying with same origin:', sameOriginUrl);
          try {
            response = await fetch(sameOriginUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                contract_url: contractUrl,
              }),
            });
          } catch (retryError) {
            setReviewError('Unable to connect to the analysis service. Please check your internet connection and try again.');
            setStep('review-error');
            setIsAnalyzing(false);
            return;
          }
        } else {
          setReviewError('Unable to connect to the analysis service. Please try again.');
          setStep('review-error');
          setIsAnalyzing(false);
          return;
        }
      }

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
        console.error('[ContractUploadFlow] API error response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        });
        
        if (response.status === 400 && responseData.validationError === true) {
          // Validation error - show specific error message with details
          const errorMessage = responseData.error || 'This document is NOT a brand deal contract.';
          const details = responseData.details?.classification;
          
          console.error('[ContractUploadFlow] Validation error details:', details);
          
          // Build detailed error message
          let fullErrorMessage = errorMessage;
          if (details?.reasoning) {
            fullErrorMessage += `\n\nReason: ${details.reasoning}`;
          }
          if (details?.confidence !== undefined) {
            fullErrorMessage += `\nConfidence: ${(details.confidence * 100).toFixed(0)}%`;
          }
          
          setValidationError(fullErrorMessage);
          setStep('validation-error');
          setIsAnalyzing(false);
          return; // HARD STOP - do not proceed
        }
        
        // Other API errors
        console.error('[ContractUploadFlow] API error:', responseData);
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
      
      // Extract brand name from contract text if not provided by AI
      let extractedBrandName = analysis.keyTerms?.brandName || (analysis as any).brandName;
      if (!extractedBrandName && responseData.data.contract_text) {
        // Try to extract brand name from contract text
        const contractText = responseData.data.contract_text.toLowerCase();
        // Common patterns for brand names in contracts
        const brandPatterns = [
          /(?:brand|company|client|sponsor)[\s:]+([A-Z][a-zA-Z\s&]+)/i,
          /(?:between|with)[\s]+([A-Z][a-zA-Z\s&]+?)(?:[\s,]+(?:herein|hereinafter|the|a))/i,
          /(?:this\s+agreement\s+is\s+between)[\s]+([A-Z][a-zA-Z\s&]+?)(?:[\s,]+(?:and|&))/i,
        ];
        
        for (const pattern of brandPatterns) {
          const match = responseData.data.contract_text.match(pattern);
          if (match && match[1]) {
            extractedBrandName = match[1].trim();
            // Clean up common suffixes
            extractedBrandName = extractedBrandName.replace(/\s+(?:LLC|Inc|Ltd|Limited|Corp|Corporation|Pvt|Private).*$/i, '');
            if (extractedBrandName.length > 2 && extractedBrandName.length < 50) {
              break;
            }
          }
        }
      }
      
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
          brandName: extractedBrandName,
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
        toast.error('Please select a PDF, DOCX, or DOC file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate if it's a brand deal contract (for PDFs and DOCX)
      // DOC files will be validated by backend only
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
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
        toast.error('Please select a PDF, DOCX, or DOC file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate if it's a brand deal contract (for PDFs and DOCX)
      // DOC files will be validated by backend only
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
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
          
          <div className="text-lg font-semibold">
            {dealType === 'contract' ? 'Upload Contract' : 'Barter Deal'}
          </div>
          
          <div className="w-10"></div>
        </div>
        
        {/* Deal Type Toggle */}
        {step === 'upload' && (
          <div className="flex gap-2 mb-4 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => {
                setDealType('contract');
                triggerHaptic(HapticPatterns.light);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                dealType === 'contract'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              Upload Contract
            </button>
            <button
              onClick={() => {
                setDealType('barter');
                triggerHaptic(HapticPatterns.light);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                dealType === 'barter'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-white/60 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Gift className="w-4 h-4" />
              Barter Deal (No Contract)
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Upload Step */}
        {step === 'upload' && (
          <>
            {dealType === 'contract' ? (
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
            ) : (
              <div className="space-y-6">
                {/* Info Card */}
                <div className="bg-gradient-to-br from-green-500/20 to-purple-500/20 backdrop-blur-md rounded-2xl p-5 border border-green-400/30">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/30 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Barter Deal Protection</h3>
                      <p className="text-sm text-purple-200">Convert your chat conversations into legal proof and protect your rights.</p>
                    </div>
                  </div>
                </div>

                {/* Input Mode Toggle */}
                <div className="flex gap-2 bg-white/5 rounded-xl p-1">
                  <button
                    onClick={() => {
                      setBarterInputMode('chat');
                      triggerHaptic(HapticPatterns.light);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      barterInputMode === 'chat'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Paste Chat
                  </button>
                  <button
                    onClick={() => {
                      setBarterInputMode('form');
                      triggerHaptic(HapticPatterns.light);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                      barterInputMode === 'form'
                        ? 'bg-purple-600 text-white shadow-lg'
                        : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Manual Form
                  </button>
                </div>

                {/* Chat Input Mode */}
                {barterInputMode === 'chat' && (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-300" />
                      Paste WhatsApp / Instagram Chat
                    </h3>
                    <textarea
                      value={barterChatText}
                      onChange={(e) => {
                        setBarterChatText(e.target.value);
                        setBarterError(null); // Clear error on input
                      }}
                      placeholder="Paste your full brand conversation here..."
                      className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                    />
                    {barterError && (
                      <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {barterError}
                      </p>
                    )}
                  </div>
                )}

                {/* Manual Form Mode */}
                {barterInputMode === 'form' && (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6 space-y-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-300" />
                      Deal Details
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Brand Name</label>
                      <input
                        type="text"
                        value={barterFormData.brandName}
                        onChange={(e) => {
                          setBarterFormData({ ...barterFormData, brandName: e.target.value });
                          setBarterError(null);
                        }}
                        placeholder="Enter brand name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Product Name</label>
                      <input
                        type="text"
                        value={barterFormData.productName}
                        onChange={(e) => {
                          setBarterFormData({ ...barterFormData, productName: e.target.value });
                          setBarterError(null);
                        }}
                        placeholder="What product/service are you receiving?"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Deliverables</label>
                      <input
                        type="text"
                        value={barterFormData.deliverables}
                        onChange={(e) => {
                          setBarterFormData({ ...barterFormData, deliverables: e.target.value });
                          setBarterError(null);
                        }}
                        placeholder="e.g., 2 Instagram Reels, 3 Posts"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Product Value (₹)</label>
                        <input
                          type="text"
                          value={barterFormData.productValue}
                          onChange={(e) => {
                            setBarterFormData({ ...barterFormData, productValue: e.target.value });
                            setBarterError(null);
                          }}
                          placeholder="Optional"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">Timeline</label>
                        <input
                          type="text"
                          value={barterFormData.timeline}
                          onChange={(e) => {
                            setBarterFormData({ ...barterFormData, timeline: e.target.value });
                            setBarterError(null);
                          }}
                          placeholder="e.g., 15 days"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">Usage Rights</label>
                      <input
                        type="text"
                        value={barterFormData.usageRights}
                        onChange={(e) => {
                          setBarterFormData({ ...barterFormData, usageRights: e.target.value });
                          setBarterError(null);
                        }}
                        placeholder="e.g., 6 months, unlimited usage"
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                  </div>
                )}
                
                {/* Error Display for Form Mode */}
                {barterInputMode === 'form' && barterError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <p className="text-sm text-red-400 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {barterError}
                    </p>
                  </div>
                )}

                {/* Generate Button */}
                <motion.button
                  onClick={handleGenerateBarterReport}
                  whileHover={{ scale: isGeneratingBarter ? 1 : 1.02 }}
                  whileTap={{ scale: isGeneratingBarter ? 1 : 0.98 }}
                  disabled={isGeneratingBarter}
                  aria-busy={isGeneratingBarter}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingBarter ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Generate Barter Protection Report
                    </>
                  )}
                </motion.button>

                {/* Benefits */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5">
                  <h4 className="font-semibold mb-4 text-center">What You Get</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">Converts chat into legal proof</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">Generates Barter Agreement PDF</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">Detects misuse & unlimited usage risk</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 text-sm">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">Helps you send a legal notice later</div>
                      </div>
                    </div>
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
          </>
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
          <div className="flex flex-col items-center min-h-[60vh] py-8" style={{ willChange: 'contents' }}>
            <div className="text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-6 relative animate-pulse">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold mb-2">AI Analyzing Contract...</h2>
              <p className="text-purple-300/70 mb-8">Checking for potential issues</p>
              
              <div className="space-y-3 text-sm max-w-xs mx-auto">
                {['Payment terms', 'Termination rights', 'IP ownership', 'Exclusivity clause', 'Liability terms'].map((item) => (
                  <div key={item} className="flex items-center justify-between p-3 bg-white/5 rounded-lg" style={{ transform: 'translateZ(0)' }}>
                    <span className="text-purple-200/70">{item}</span>
                    {analyzedItems.has(item) ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Skeleton Loaders for Results Preview */}
            <div className="w-full max-w-4xl mx-auto space-y-8 mt-8">
              <SkeletonLoader variant="score" />
              <SkeletonLoader variant="issues" />
              <SkeletonLoader variant="keyTerms" />
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
          <div className="space-y-8 md:space-y-10 animate-fadeIn pb-40 md:pb-6" style={{ paddingBottom: 'max(160px, calc(160px + env(safe-area-inset-bottom)))', willChange: 'scroll-position' }}>
            {/* Content Width Container for iPad/Tablet */}
            <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            {/* Contract Type Badge */}
            <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl px-4 py-3 border border-purple-400/30">
              <div className="flex items-center gap-2 text-sm flex-wrap">
                <FileText className="w-4 h-4 text-purple-300" />
                <span className="text-purple-200">
                  {analysisResults.dealType === 'barter' ? 'Barter Protection (from chat)' : 'Detected Contract Type:'}
                </span>
                <span className="font-semibold text-white">
                  {analysisResults.dealType === 'barter' 
                    ? 'Beta' 
                    : 'Influencer–Brand Paid Collaboration'}
                </span>
                {analysisResults.dealType === 'barter' && (
                  <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                    Barter Deal
                  </span>
                )}
              </div>
            </div>

            {/* Premium Badge - Show for PRO users */}
            {((profile as any)?.subscription_plan === 'premium' || (profile as any)?.subscription_plan === 'pro' || (profile as any)?.subscription_plan === 'strategic') ? (
              <div className="bg-gradient-to-r from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl px-4 py-3 border border-purple-400/30">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200">🛡️ Contract Protected by Lawyer + AI</span>
                </div>
                <p className="text-xs text-purple-300/80 mt-1 ml-6">
                  ✅ Your contract is now legally optimized for negotiation
                </p>
              </div>
            ) : null}

            {/* Premium Risk Score Card with Circular Gauge */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-white/10 shadow-xl" style={{ transform: 'translateZ(0)' }}>
              <div className="flex flex-col items-center gap-6">
                {/* Brand Name and Deal Amount Display */}
                {(analysisResults.keyTerms?.brandName || analysisResults.keyTerms?.dealValue) && (
                  <div className="w-full mb-2 space-y-2">
                    {analysisResults.keyTerms?.brandName && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-400/40 rounded-xl backdrop-blur-sm">
                        <Building2 className="w-4 h-4 text-purple-300 flex-shrink-0" />
                        <span className="text-sm font-semibold text-white tracking-wide">
                          {analysisResults.keyTerms.brandName}
                        </span>
                      </div>
                    )}
                    {analysisResults.keyTerms?.dealValue && analysisResults.keyTerms.dealValue !== 'Not specified' && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-xl backdrop-blur-sm">
                        <IndianRupee className="w-4 h-4 text-green-300 flex-shrink-0" />
                        <span className="text-sm font-semibold text-white tracking-wide">
                          {analysisResults.keyTerms.dealValue}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {/* Circular Progress Gauge with Animation and Glow */}
                <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0" style={{ willChange: 'transform' }}>
                  {/* Pulse glow effect based on risk level */}
                  <div 
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{
                      boxShadow: `0 0 40px ${resultsRiskInfo.glowColor}`,
                      opacity: 0.5
                    }}
                  />
                  <svg className="transform -rotate-90 w-32 h-32 md:w-40 md:h-40 relative z-10">
                    {/* Background circle */}
                    <circle
                      cx={analysisResults.score >= 80 ? "64" : "80"}
                      cy={analysisResults.score >= 80 ? "64" : "80"}
                      r={analysisResults.score >= 80 ? "36" : "45"}
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="6"
                      fill="none"
                    />
                    {/* Progress circle - animated */}
                    <circle
                      cx={analysisResults.score >= 80 ? "64" : "80"}
                      cy={analysisResults.score >= 80 ? "64" : "80"}
                      r={analysisResults.score >= 80 ? "36" : "45"}
                      stroke={`url(#gradient-${analysisResults.score})`}
                      strokeWidth="6"
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
                    <div className="relative">
                      <div className={`text-5xl md:text-6xl font-black ${resultsRiskInfo.color} transition-all duration-300 leading-none drop-shadow-lg`} style={{ textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        {scoreAnimation || analysisResults.score}
                      </div>
                      <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white/40 animate-pulse"></div>
                    </div>
                    <div className="text-[11px] md:text-xs text-white/60 mt-2 font-semibold tracking-widest uppercase letter-spacing-wide">Score</div>
                  </div>
                </div>

                {/* Risk Label and Info */}
                <div className="flex-1 text-center w-full">
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Contract Analysis</h2>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <p className={`text-base md:text-lg font-semibold ${resultsRiskInfo.color}`}>{resultsRiskInfo.label}</p>
                    <div className="group relative">
                      <Info className="w-4 h-4 text-white/40 cursor-help hover:text-white/60 transition-colors" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-purple-900/95 backdrop-blur-sm rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 border border-purple-400/30">
                        Score is based on 30+ legal risk checks
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-purple-900/95"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 font-medium">
                    Protection Score: <span className={`font-black ${resultsRiskInfo.color}`}>{analysisResults.score}</span>/100
                  </p>
                </div>

                {/* Primary CTA */}
                <div className="flex flex-col gap-2 w-full md:w-auto">
                  {fixedIssuesCount >= 2 && (
                    <motion.button
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
                          const requestBody: any = { brandName: 'the Brand' };
                          if (reportId) {
                            requestBody.reportId = reportId;
                          } else {
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
                          const formattedMessage = formatNegotiationMessage(data.message);
                          setNegotiationMessage(formattedMessage);
                          setShowShareFeedbackModal(true);
                          toast.success('Negotiation message generated!');
                        } catch (error: any) {
                          console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                          toast.error(error.message || 'Failed to generate negotiation message. Please try again.');
                        } finally {
                          setIsGeneratingMessage(false);
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-green-600 hover:bg-green-700 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-green-500/30 min-h-[48px]"
                    >
                      <Send className="w-4 h-4" />
                      Ready to Send Back to Brand
                    </motion.button>
                  )}
                </div>
              </div>
            </div>

            {/* Collapsible Sections */}
            {analysisResults && (
            <div className="space-y-3 mt-4">
              {/* 1. Key Terms */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setIsKeyTermsExpanded(!isKeyTermsExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Key Terms</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      All Clear
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${isKeyTermsExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isKeyTermsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {analysisResults.keyTerms && (
                          <>
                            {analysisResults.keyTerms.brandName && (
                              <div className="flex justify-between items-center text-sm pb-2 border-b border-white/10">
                                <span className="text-white/70 flex items-center gap-2">
                                  <Building2 className="w-4 h-4" />
                                  Brand Name:
                                </span>
                                <span className="text-white font-semibold">{analysisResults.keyTerms.brandName}</span>
                              </div>
                            )}
                            {analysisResults.keyTerms.dealValue && analysisResults.keyTerms.dealValue !== 'Not specified' && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-white/70">Deal Value:</span>
                                <span className="text-white font-medium">{analysisResults.keyTerms.dealValue}</span>
                              </div>
                            )}
                            {analysisResults.keyTerms.deliverables && analysisResults.keyTerms.deliverables !== 'Not specified' && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-white/70">Deliverables:</span>
                                <span className="text-white font-medium">{analysisResults.keyTerms.deliverables}</span>
                              </div>
                            )}
                            {analysisResults.keyTerms.paymentSchedule && analysisResults.keyTerms.paymentSchedule !== 'Not specified' && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-white/70">Payment Schedule:</span>
                                <span className="text-white font-medium">{analysisResults.keyTerms.paymentSchedule}</span>
                              </div>
                            )}
                            {analysisResults.keyTerms.duration && analysisResults.keyTerms.duration !== 'Not specified' && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-white/70">Duration:</span>
                                <span className="text-white font-medium">{analysisResults.keyTerms.duration}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. Protection Status */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setIsProtectionStatusExpanded(!isProtectionStatusExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Protection Status</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      {analysisResults.verified.length} Strong Clauses
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${isProtectionStatusExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isProtectionStatusExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {analysisResults.verified.length > 0 ? (
                          analysisResults.verified.map((clause) => (
                            <div key={clause.id} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-white font-medium">{clause.title}</div>
                                <div className="text-white/60 text-xs">{clause.description}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-white/60 text-sm">No strong clauses found.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. Issues Found */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setIsIssuesExpanded(!isIssuesExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span className="text-white font-medium">Issues Found</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      {analysisResults.issues.length} {analysisResults.issues.length === 1 ? 'Issue' : 'Issues'}
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${isIssuesExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isIssuesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {analysisResults.issues.length > 0 ? (
                          analysisResults.issues.map((issue) => (
                            <div key={issue.id} className="flex items-start gap-2 text-sm">
                              <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                issue.severity === 'high' ? 'text-red-400' : 
                                issue.severity === 'medium' ? 'text-orange-400' : 
                                'text-yellow-400'
                              }`} />
                              <div className="flex-1">
                                <div className="text-white font-medium">{issue.title}</div>
                                <div className="text-white/60 text-xs">{issue.description}</div>
                                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                                  issue.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                  issue.severity === 'medium' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                  'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                }`}>
                                  {issue.severity}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-white/60 text-sm">No issues found.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. Financial Breakdown */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setIsFinancialBreakdownExpanded(!isFinancialBreakdownExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    <span className="text-white font-medium">Financial Breakdown</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      Fair Rate
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${isFinancialBreakdownExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isFinancialBreakdownExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3">
                        {analysisResults.keyTerms?.dealValue && analysisResults.keyTerms.dealValue !== 'Not specified' && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white/70">Deal Value:</span>
                            <span className="text-white font-medium">{analysisResults.keyTerms.dealValue}</span>
                          </div>
                        )}
                        {analysisResults.keyTerms?.paymentSchedule && analysisResults.keyTerms.paymentSchedule !== 'Not specified' && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-white/70">Payment Schedule:</span>
                            <span className="text-white font-medium">{analysisResults.keyTerms.paymentSchedule}</span>
                          </div>
                        )}
                        {(!analysisResults.keyTerms?.dealValue || analysisResults.keyTerms.dealValue === 'Not specified') && (
                          <div className="text-white/60 text-sm">Payment amount not specified in contract.</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 6. Recommended Actions */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setIsRecommendedActionsExpanded(!isRecommendedActionsExpanded)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">Recommended Actions</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {analysisResults.issues.length > 0 ? '4 Actions' : '0 Actions'}
                    </span>
                  </div>
                  <ChevronDown 
                    className={`w-5 h-5 text-white/60 transition-transform ${isRecommendedActionsExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {isRecommendedActionsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-2">
                        {analysisResults.issues.length > 0 && (
                          <>
                            <div className="text-sm text-white font-medium mb-2">Next Steps:</div>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 text-sm">
                                <span className="text-orange-400">1.</span>
                                <span className="text-white">Ask brand for revisions</span>
                              </div>
                              <div className="flex items-start gap-2 text-sm">
                                <span className="text-yellow-400">2.</span>
                                <span className="text-white">Get lawyer review</span>
                              </div>
                              <div className="flex items-start gap-2 text-sm">
                                <span className="text-green-400">3.</span>
                                <span className="text-white">Download brand-safe contract</span>
                              </div>
                              <div className="flex items-start gap-2 text-sm">
                                <span className="text-purple-400">4.</span>
                                <span className="text-white">Share feedback with brand</span>
                              </div>
                            </div>
                          </>
                        )}
                        {analysisResults.issues.length === 0 && (
                          <div className="text-white/60 text-sm">No actions needed. Contract looks safe!</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            )}

            {/* Action Buttons */}
            {analysisResults && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                {/* Save This Deal Button */}
                <motion.button
                  onClick={async () => {
                    if (!session?.access_token) {
                      toast.error('Please log in to save this deal');
                      return;
                    }

                    if (!analysisResults) {
                      toast.error('No contract data to save');
                      return;
                    }

                    triggerHaptic(HapticPatterns.light);
                    
                    try {
                      const creatorId = session?.user?.id;
                      if (!creatorId) {
                        toast.error('User ID not found');
                        return;
                      }

                      // Parse deal amount - default to 0 if not specified (required field)
                      let dealAmount = 0;
                      const dealValueStr = analysisResults.keyTerms?.dealValue || '';
                      
                      if (dealValueStr && dealValueStr.trim() !== '' && 
                          dealValueStr.toLowerCase() !== 'not specified' && 
                          dealValueStr.toLowerCase() !== 'not mentioned') {
                        
                        // Try multiple parsing strategies
                        // Strategy 1: Extract number with commas (e.g., "Rs. 75,000" or "₹75,000")
                        const commaMatch = dealValueStr.match(/(\d{1,3}(?:,\d{2,3})*(?:\.\d+)?)/);
                        if (commaMatch) {
                          const valueWithCommas = commaMatch[1].replace(/,/g, '');
                          const parsed = parseFloat(valueWithCommas);
                          if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
                            dealAmount = parsed;
                          }
                        }
                        
                        // Strategy 2: If Strategy 1 failed, try removing all non-digits except decimal point
                        if (dealAmount === 0) {
                          let cleanedValue = dealValueStr
                            .replace(/[₹Rs$€£,\s]/g, '')
                            .trim();
                          const parsed = parseFloat(cleanedValue);
                          if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
                            dealAmount = parsed;
                          }
                        }
                        
                        // Strategy 3: Try to find any sequence of digits
                        if (dealAmount === 0) {
                          const digitMatch = dealValueStr.match(/(\d+)/);
                          if (digitMatch) {
                            const parsed = parseFloat(digitMatch[1]);
                            if (!isNaN(parsed) && parsed > 0 && isFinite(parsed)) {
                              dealAmount = parsed;
                            }
                          }
                        }
                      }
                      
                      // If still 0, show a warning but allow saving
                      if (dealAmount === 0 && dealValueStr) {
                        console.warn('[ContractUploadFlow] Could not parse deal amount from:', dealValueStr);
                        toast.warning(`Could not extract payment amount from "${dealValueStr}". Deal saved with ₹0. You can update it later.`);
                      } else if (dealAmount === 0) {
                        toast.warning('No payment amount found in contract. Deal saved with amount ₹0. You can update it later.');
                      }

                      // Calculate due date (default to 30 days from now) - required field
                      const dueDate = new Date();
                      dueDate.setDate(dueDate.getDate() + 30);
                      const dueDateStr = dueDate.toISOString().split('T')[0];
                      
                      // Payment expected date (same as due date) - required field
                      const paymentExpectedDateStr = dueDateStr;
                      
                      // Extract brand name from contract or use default
                      const extractedBrandName = analysisResults.keyTerms?.brandName || 
                        fileName?.replace(/\.(pdf|docx?)$/i, '').replace(/[_-]/g, ' ') || 
                        'Contract Upload';
                      
                      await addDealMutation.mutateAsync({
                        creator_id: creatorId,
                        organization_id: null,
                        brand_name: extractedBrandName,
                        deal_amount: dealAmount, // Always a number, never null
                        deliverables: analysisResults.keyTerms?.deliverables || 'As per contract',
                        contract_file: uploadedFile, // File object or null
                        due_date: dueDateStr, // Required
                        payment_expected_date: paymentExpectedDateStr, // Required
                        contact_person: null,
                        platform: 'Other',
                        status: 'Draft' as const,
                        invoice_file: null,
                        utr_number: null,
                        brand_email: null,
                        payment_received_date: null,
                      });
                      toast.success('✅ Deal saved successfully!');
                    } catch (error: any) {
                      console.error('[ContractUploadFlow] Save deal error:', error);
                      toast.error(error.message || 'Failed to save deal. Please try again.');
                    }
                  }}
                  disabled={addDealMutation.isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addDealMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Save This Deal
                    </>
                  )}
                </motion.button>

                {/* Fix Contract & Send to Brand Button */}
                <motion.button
                  onClick={async () => {
                    if (!session?.access_token) {
                      toast.error('Please log in to send to brand');
                      return;
                    }

                    if (!analysisResults || analysisResults.issues.length === 0) {
                      toast.error('No issues found to fix');
                      return;
                    }

                    triggerHaptic(HapticPatterns.medium);
                    setIsGeneratingMessage(true);
                    
                    try {
                      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
                          ? 'https://api.noticebazaar.com' 
                          : 'http://localhost:3001');
                      
                      const requestBody: any = {
                        brandName: 'the Brand'
                      };
                      
                      if (reportId) {
                        requestBody.reportId = reportId;
                      } else {
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

                      const formattedMessage = formatNegotiationMessage(data.message);
                      setNegotiationMessage(formattedMessage);
                      setShowShareFeedbackModal(true);
                      toast.success('Ready to send to brand!');
                    } catch (error: any) {
                      console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                      toast.error(error.message || 'Failed to generate message. Please try again.');
                    } finally {
                      setIsGeneratingMessage(false);
                    }
                  }}
                  disabled={isGeneratingMessage}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-purple-500/30"
                >
                  {isGeneratingMessage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Fix Contract & Send to Brand
                    </>
                  )}
                </motion.button>
              </div>
            )}

            {/* Perfect Contract Empty State */}
            {analysisResults.issues.length === 0 && analysisResults.score >= 75 && (
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-2xl p-8 md:p-12 border-2 border-green-500/60 shadow-lg text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="mb-6"
                >
                  <div className="text-6xl md:text-8xl mb-4">
                    🎉 ✨ 🎊
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  </motion.div>
                </motion.div>
                <h2 className="text-3xl md:text-4xl font-bold text-green-300 mb-3">Perfect Contract! 💯</h2>
                <p className="text-lg text-green-200/80 mb-6 max-w-2xl mx-auto">
                  This is one of the safest contracts we've analyzed. All key terms are properly defined and there are no critical risks.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <motion.button
                    onClick={async () => {
                      if (contractUrl) {
                        const a = document.createElement('a');
                        a.href = contractUrl;
                        a.download = fileName || 'contract.pdf';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        toast.success('Contract downloaded!');
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download for Records
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (contractUrl) {
                        window.open(contractUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Share with Brand
                  </motion.button>
                </div>
              </div>
            )}

            {/* Old Issues Section - Removed */}
            {false && analysisResults.issues.length > 0 && (
              <div id="issues-section-old" className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 md:p-8 border border-white/10 md:border-t shadow-lg">
                <button
                  onClick={() => setIsIssuesExpanded(!isIssuesExpanded)}
                  className="w-full flex items-center justify-between mb-4 hover:opacity-80 transition-opacity"
                >
                  <h3 className="font-semibold text-xl md:text-2xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-400" />
                    Issues Found
                    <span className="text-sm font-normal text-purple-300 ml-2">
                      ({analysisResults.issues.length} {analysisResults.issues.length === 1 ? 'issue' : 'issues'})
                    </span>
                  </h3>
                  <motion.div
                    animate={{ rotate: isIssuesExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-purple-300" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {isIssuesExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      {/* Safety Progress Tracker */}
                <div className="mb-6 p-4 bg-purple-900/40 rounded-xl border border-purple-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-200">Safety Progress:</span>
                    <span className="text-lg font-bold text-white">
                      {fixedIssuesCount} of {totalIssuesCount} issues fixed
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(fixedIssuesCount / totalIssuesCount) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                </div>
                
                {/* Quick Fix Mode Banner */}
                {analysisResults.issues.length > 1 && (
                  <div className="mb-4">
                    <motion.button
                      onClick={async () => {
                        if (!session?.access_token) {
                          toast.error('Please log in to generate safe clauses');
                          return;
                        }
                        if (!reportId) {
                          toast.error('Report information not available. Please re-analyze the contract.');
                          return;
                        }
                        
                        const unresolvedIssues = analysisResults.issues.filter(issue => !resolvedIssues.has(issue.id));
                        if (unresolvedIssues.length === 0) {
                          toast.info('All issues are already resolved!');
                          return;
                        }
                        
                        triggerHaptic(HapticPatterns.medium);
                        toast.loading(`Generating ${unresolvedIssues.length} safer clauses...`, { id: 'quick-fix' });
                        
                        try {
                          const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 
                            (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com') 
                              ? 'https://api.noticebazaar.com' 
                              : 'http://localhost:3001');
                          
                          // Generate clauses for all unresolved issues
                          const clausePromises = unresolvedIssues.slice(0, 5).map(async (issue) => {
                            try {
                              const response = await fetch(`${apiBaseUrl}/api/protection/generate-fix`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${session.access_token}`
                                },
                                body: JSON.stringify({
                                  reportId,
                                  issueIndex: issue.id - 1,
                                  originalClause: issue.clause || issue.title
                                })
                              });
                              
                              const data = await response.json();
                              if (response.ok && data.success) {
                                const safeClause = `SAFER VERSION:\n\n${data.safeClause}\n\n${data.explanation ? `Explanation: ${data.explanation}` : ''}`;
                                setGeneratedClauses(new Map(generatedClauses.set(issue.id, safeClause)));
                                setClauseStates(new Map(clauseStates.set(issue.id, 'success')));
                                return true;
                              }
                              return false;
                            } catch (error) {
                              console.error(`Failed to generate clause for issue ${issue.id}:`, error);
                              return false;
                            }
                          });
                          
                          const results = await Promise.all(clausePromises);
                          const successCount = results.filter(r => r).length;
                          
                          toast.success(`Generated ${successCount} safer clauses!`, { id: 'quick-fix' });
                        } catch (error: any) {
                          console.error('[ContractUploadFlow] Quick fix error:', error);
                          toast.error('Some clauses failed to generate. Please try individual fixes.', { id: 'quick-fix' });
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 text-sm shadow-lg shadow-purple-500/30"
                    >
                      <Zap className="w-4 h-4" />
                      <span className="hidden md:inline">Quick Fix: Fix All Issues</span>
                      <span className="md:hidden">Quick Fix</span>
                    </motion.button>
                  </div>
                )}
                
                {/* Missing Price Alert - DEAL BREAKER */}
                {(() => {
                  const dealValue = analysisResults.keyTerms?.dealValue;
                  const isMissingPrice = !dealValue || 
                    dealValue.trim() === '' || 
                    dealValue.toLowerCase() === 'not specified' ||
                    dealValue.toLowerCase() === 'not mentioned' ||
                    dealValue === '0' ||
                    dealValue === '₹0';
                  
                  if (isMissingPrice) {
                    return (
                      <MissingPriceAlert
                        onAskBrand={async () => {
                          // Generate negotiation message focused on price
                          if (!negotiationMessage) {
                            // Generate message first
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
                                  'Authorization': `Bearer ${session?.access_token}`
                                },
                                body: JSON.stringify({
                                  reportId: reportId || null,
                                  brandName: 'the Brand',
                                  issues: [{
                                    title: 'Payment amount is missing',
                                    category: 'Payment',
                                    description: 'The contract does not specify the payment amount.',
                                    recommendation: 'Request the brand to add the exact payment amount to the contract.',
                                    severity: 'high',
                                    clause_reference: 'Payment Terms'
                                  }]
                                })
                              });
                              const data = await response.json();
                              if (data.success) {
                                const formattedMessage = formatNegotiationMessage(data.message);
                                setNegotiationMessage(formattedMessage);
                                await navigator.clipboard.writeText(formattedMessage);
                                toast.success('Copied for Email');
                                setShowNegotiationModal(true);
                              }
                            } catch (error) {
                              toast.error('Failed to generate message');
                            } finally {
                              setIsGeneratingMessage(false);
                            }
                          } else {
                            const emailMessage = formatNegotiationMessage(negotiationMessage);
                            await navigator.clipboard.writeText(emailMessage);
                            toast.success('Copied for Email');
                            setShowNegotiationModal(true);
                          }
                        }}
                      />
                    );
                  }
                  return null;
                })()}
                
                {/* Group Issues by Category */}
                {(() => {
                  // Get unresolved issues
                  const unresolvedIssues = analysisResults.issues.filter(issue => !resolvedIssues.has(issue.id));
                  
                  // Get top 2 most dangerous issues
                  const topIssues = getTopIssues(unresolvedIssues);
                  const issuesToShow = showAllIssues ? unresolvedIssues : topIssues;
                  
                  const groupedIssues = new Map<string, typeof analysisResults.issues>();
                  issuesToShow.forEach(issue => {
                    const category = getIssueCategory(issue);
                    const key = category.label;
                    if (!groupedIssues.has(key)) {
                      groupedIssues.set(key, []);
                    }
                    groupedIssues.get(key)!.push(issue);
                  });

                  return (
                    <>
                    <div className="md:grid md:grid-cols-2 md:gap-8 lg:gap-10">
                      {Array.from(groupedIssues.entries()).map(([categoryLabel, issues]) => {
                    const categoryInfo = getIssueCategory(issues[0]);
                    const CategoryIcon = categoryInfo.icon;
                    
                    return (
                          <div key={categoryLabel} className="mb-8 md:mb-0">
                        <div className="flex items-center gap-3 mb-5 md:mb-6 pb-3 border-b border-white/10">
                          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <CategoryIcon className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                          </div>
                          <h4 className="font-semibold text-lg md:text-xl">{categoryInfo.emoji} {categoryLabel} ({issues.length})</h4>
                        </div>
                        
                        {/* Desktop/iPad Table View - Clean and Organized */}
                        <div className="hidden md:block">
                          <div className="space-y-4">
                            {issues.map((issue, index) => {
                              const severityConfig = {
                                high: { 
                                  border: 'border-l-4 border-red-500', 
                                  badge: 'bg-red-500/30 text-red-300 border-red-500/50',
                                  label: 'High'
                                },
                                medium: { 
                                  border: 'border-l-4 border-orange-500', 
                                  badge: 'bg-orange-500/30 text-orange-300 border-orange-500/50',
                                  label: 'Medium'
                                },
                                low: { 
                                  border: 'border-l-4 border-yellow-500', 
                                  badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                                  label: 'Warning'
                                },
                                warning: {
                                  border: 'border-l-4 border-yellow-500',
                                  badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                                  label: 'Warning'
                                }
                              };
                              const config = severityConfig[issue.severity] || severityConfig.medium;
                              const clauseState = clauseStates.get(issue.id) || 'default';
                              const generatedClause = generatedClauses.get(issue.id);
                              const negotiationStrength = getNegotiationStrength(issue);
                              const isExpanded = expandedFixes.has(issue.id);
                              
                              // Calculate potential score improvement
                              const currentScore = analysisResults?.score || 0;
                              const potentialScore = Math.min(100, currentScore + (issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 5 : 3));
                              
                              return (
                                <React.Fragment key={issue.id}>
                                  <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: resolvedIssues.has(issue.id) ? 0.5 : 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`${config.border} bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-200 p-5`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                  >
                                    {/* Issue Header Row */}
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                          <h5 className="font-semibold text-base md:text-lg text-white">{issue.title}</h5>
                                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex-shrink-0 ${config.badge}`}>
                                            {config.label}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => toggleFixExpansion(issue.id)}
                                          className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 mt-1"
                                        >
                                          {isExpanded ? 'Hide Details' : 'Tap to View Details'}
                                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                      </div>
                                    </div>

                                    {/* Score Impact */}
                                    <div className="mb-4 pb-4 border-b border-white/10">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-purple-400" />
                                        <span className="text-xs text-purple-400 font-medium">
                                          {issue.severity === 'high' ? '2-3 min fix' : issue.severity === 'medium' ? '1-2 min fix' : '1 min fix'}
                                        </span>
                                      </div>
                                      <p className="text-sm md:text-base text-purple-300/70">
                                        Fixing this will improve your score to ~<span className="font-black text-purple-200">{potentialScore}/100</span>
                                      </p>
                                    </div>

                                    {/* Impact Preview - Risk if Ignored */}
                                    <div className="mb-4 bg-red-900/20 border-l-4 border-red-500 p-3 rounded-r-lg">
                                      <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                          <span className="text-xs font-semibold text-red-300 block mb-1">Risk if ignored:</span>
                                          <p className="text-xs text-red-200/80 leading-relaxed">{getImpactIfIgnored(issue)}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-4">
                                      {clauseState === 'success' && generatedClause ? (
                                        <div className="flex flex-col gap-3">
                                          <div className="flex items-center gap-2 text-green-400 text-sm justify-center">
                                            <CheckCircle className="w-4 h-4" />
                                            ✅ Clause Generated
                                          </div>
                                          <div className="grid grid-cols-2 gap-3">
                                            <button
                                              onClick={async () => {
                                                await navigator.clipboard.writeText(generatedClause);
                                                toast.success('Clause copied!');
                                              }}
                                              className="bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 min-h-[48px]"
                                            >
                                              <Copy className="w-4 h-4" />
                                              Copy
                                            </button>
                                            <button
                                              onClick={() => handleMarkAsResolved(issue.id)}
                                              className="bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all min-h-[48px] flex flex-col items-center"
                                            >
                                              Issue Fixed
                                              <span className="text-xs text-purple-300 mt-1">This risk is now secured</span>
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <motion.button
                                          onClick={() => {
                                            triggerHaptic(HapticPatterns.light);
                                            handleGenerateClause(issue);
                                          }}
                                          disabled={clauseState === 'loading'}
                                          whileTap={{ scale: 0.98 }}
                                          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                                        >
                                          {clauseState === 'loading' ? (
                                            <>
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                              Generating...
                                            </>
                                          ) : (
                                            <>
                                              <Wand2 className="w-4 h-4" />
                                              Generate Safer Clause
                                            </>
                                          )}
                                        </motion.button>
                                      )}
                                      {clauseState !== 'loading' && clauseState !== 'success' && (
                                        <span className="text-xs text-purple-300 mt-1 block text-center">AI rewrites this clause in your favor</span>
                                      )}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mt-5 pt-5 border-t border-white/10 overflow-hidden"
                                      >
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                            <div className="text-xs text-red-300 mb-2 flex items-center gap-1 font-medium">
                                              <XCircle className="w-3 h-3" />
                                              Problem Detected
                                            </div>
                                            <div className="text-sm text-purple-200 leading-relaxed">{issue.clause || issue.description || 'N/A'}</div>
                                          </div>
                                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                            <div className="text-xs text-green-300 mb-2 flex items-center gap-1 font-medium">
                                              <CheckCircle className="w-3 h-3" />
                                              Recommended Fix
                                            </div>
                                            <div className="text-sm text-purple-200 leading-relaxed mb-3">{issue.recommendation}</div>
                                            <div className="mb-3">
                                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${negotiationStrength.color}`}>
                                                {negotiationStrength.emoji} {negotiationStrength.label}
                                              </span>
                                            </div>
                                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                                              <div className="text-xs text-yellow-300 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                If ignored: {getImpactIfIgnored(issue)}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </motion.div>
                                </React.Fragment>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Mobile Card View - Compact by Default */}
                        <div className="md:hidden space-y-3">
                          {issues.map((issue, index) => {
                            if (resolvedIssues.has(issue.id)) return null;
                            
                            const severityConfig = {
                              high: { 
                                border: 'border-l-4 border-red-500', 
                                badge: 'bg-red-500/30 text-red-300 border-red-500/50',
                                label: 'High'
                              },
                              medium: { 
                                border: 'border-l-4 border-orange-500', 
                                badge: 'bg-orange-500/30 text-orange-300 border-orange-500/50',
                                label: 'Medium'
                              },
                              low: { 
                                border: 'border-l-4 border-yellow-500', 
                                badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                                label: 'Warning'
                              },
                              warning: {
                                border: 'border-l-4 border-yellow-500',
                                badge: 'bg-yellow-500/30 text-yellow-300 border-yellow-500/50',
                                label: 'Warning'
                              }
                            };
                            const config = severityConfig[issue.severity] || severityConfig.medium;
                            const clauseState = clauseStates.get(issue.id) || 'default';
                            const generatedClause = generatedClauses.get(issue.id);
                            const negotiationStrength = getNegotiationStrength(issue);
                            const isExpanded = expandedFixes.has(issue.id);
                            
                            // Calculate potential score improvement
                            const currentScore = analysisResults?.score || 0;
                            const potentialScore = Math.min(100, currentScore + (issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 5 : 3));
                            
                            return (
                              <AnimatePresence key={issue.id}>
                                <motion.div 
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className={`${config.border} p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-purple-400/30 transition-all duration-200`}
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  {/* Compact Header - Always Visible */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        <span className="font-semibold text-base">{issue.title}</span>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config.badge}`}>
                                          {config.label}
                                        </span>
                                      </div>
                                      
                                      {/* Score Preview - Always Visible */}
                                      <p className="text-xs text-purple-300 mb-3">
                                        Fixing this will improve your score to ~{potentialScore}/100
                                      </p>
                                      
                                      {/* Tap to View Details Link */}
                                        <button
                                          onClick={() => toggleFixExpansion(issue.id)}
                                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 mb-3"
                                      >
                                        {isExpanded ? 'Hide Details' : 'Tap to View Details'}
                                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                        </button>
                                    </div>
                                  </div>
                                  
                                  {/* Expanded Details - Only on Tap */}
                                        <AnimatePresence>
                                    {isExpanded && (
                                            <motion.div
                                              initial={{ height: 0, opacity: 0 }}
                                              animate={{ height: 'auto', opacity: 1 }}
                                              exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-3 mb-3"
                                            >
                                        {/* Problem Section */}
                                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                          <div className="text-xs text-red-300 mb-1 flex items-center gap-1 font-medium">
                                            <XCircle className="w-3 h-3" />
                                            Problem Detected
                                          </div>
                                          <div className="text-sm text-purple-200 leading-relaxed">{issue.clause || issue.description || 'N/A'}</div>
                                        </div>
                                        
                                        {/* Recommendation Section */}
                                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                          <div className="text-xs text-green-300 mb-1 flex items-center gap-1 font-medium">
                                            <CheckCircle className="w-3 h-3" />
                                            Recommended Fix
                                          </div>
                                          <div className="text-sm text-purple-200 leading-relaxed">{issue.recommendation}</div>
                                                <div className="mt-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${negotiationStrength.color}`}>
                                                    {negotiationStrength.emoji} {negotiationStrength.label}
                                                  </span>
                                                </div>
                                              </div>
                                        
                                        {/* Impact Warning */}
                                              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2">
                                                <div className="text-xs text-yellow-300 flex items-center gap-1">
                                                  <AlertTriangle className="w-3 h-3" />
                                            If ignored: {getImpactIfIgnored(issue)}
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                  
                                  {/* Primary CTA Button - Always Visible */}
                                  {clauseState === 'success' && generatedClause ? (
                                    <div className="flex flex-col gap-2">
                                      <div className="flex items-center gap-2 text-green-400 text-xs mb-1">
                                        <CheckCircle className="w-3 h-3" />
                                        ✅ Clause Generated
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={async () => {
                                            await navigator.clipboard.writeText(generatedClause);
                                            toast.success('Clause copied!');
                                          }}
                                          className="flex-1 bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 min-h-[48px]"
                                        >
                                          <Copy className="w-4 h-4" />
                                          Copy Clause
                                        </button>
                                        <button
                                          onClick={() => handleMarkAsResolved(issue.id)}
                                          className="flex-1 bg-purple-600/80 hover:bg-purple-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all min-h-[48px] flex flex-col items-center justify-center"
                                        >
                                          Issue Fixed
                                          <span className="text-xs text-purple-300 mt-1">This risk is now secured</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <motion.button
                                      onClick={() => {
                                        triggerHaptic(HapticPatterns.light);
                                        handleGenerateClause(issue);
                                      }}
                                      disabled={clauseState === 'loading'}
                                      whileTap={{ scale: 0.98 }}
                                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-lg hover:shadow-purple-500/50 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                                    >
                                      {clauseState === 'loading' ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <Wand2 className="w-4 h-4" />
                                          Generate Safer Clause
                                        </>
                                      )}
                                    </motion.button>
                                  )}
                                  {clauseState !== 'loading' && clauseState !== 'success' && (
                                    <span className="text-xs text-purple-300 mt-1 block text-center">AI rewrites this clause in your favor</span>
                                  )}
                                </motion.div>
                              </AnimatePresence>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                    </div>
                    {!showAllIssues && unresolvedIssues.length > 2 && (
                      <div className="mt-6 text-center">
                        <motion.button
                          onClick={() => {
                            setShowAllIssues(true);
                            triggerHaptic(HapticPatterns.light);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="bg-purple-600/80 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mx-auto"
                        >
                          Show all issues ({unresolvedIssues.length})
                        </motion.button>
                      </div>
                    )}
                    </>
                  );
                })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Share & Brand Actions - Moved higher, right after Issues */}
            {analysisResults.issues.length > 0 && negotiationMessage && (
              <div className="mt-6 mb-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-300" />
                  <span className="text-white">Share Fixes with Brand</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Copy Email Button */}
                  <motion.button
                    onClick={handleCopyEmail}
                    disabled={!negotiationMessage}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-blue-600/90 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail className="w-5 h-5" />
                    <span className="text-sm font-semibold">Copy Email</span>
                  </motion.button>
                  
                  {/* Copy WhatsApp Button */}
                  <motion.button
                    onClick={handleCopyWhatsApp}
                    disabled={!negotiationMessage}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-green-600/90 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-sm font-semibold">Copy WhatsApp</span>
                  </motion.button>
                  
                  {/* Send Fixes to Brand Button */}
                  <motion.button
                    onClick={() => {
                      if (!negotiationMessage) {
                        toast.error('Please generate a negotiation message first');
                        return;
                      }
                      setShowShareFeedbackModal(true);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-purple-600/90 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Send className="w-5 h-5" />
                    <span className="text-sm font-semibold">Send Fixes to Brand</span>
                  </motion.button>
                </div>
              </div>
            )}



            {/* Old Recommended Actions - Removed */}
            {false && analysisResults.issues.length > 0 && (
              <>
              <div className="bg-gradient-to-br from-purple-600/30 to-indigo-600/30 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-purple-400/30 shadow-lg mb-24 md:mb-0" style={{ marginBottom: 'max(96px, calc(96px + env(safe-area-inset-bottom)))' }}>
                <h3 className="font-semibold text-xl mb-4">Recommended Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Critical Action - Ask Brand for Revisions */}
                  <motion.button
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
                        
                        const requestBody: any = {
                          brandName: 'the Brand'
                        };
                        
                        if (reportId) {
                          requestBody.reportId = reportId;
                        } else {
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

                        const formattedMessage = formatNegotiationMessage(data.message);
                        setNegotiationMessage(formattedMessage);
                        setShowShareFeedbackModal(true);
                        toast.success('Negotiation message generated!');
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                        toast.error(error.message || 'Failed to generate negotiation message. Please try again.');
                      } finally {
                        setIsGeneratingMessage(false);
                      }
                    }}
                    disabled={isGeneratingMessage}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-red-600/90 hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/50 hover:-translate-y-1 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[48px] relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-red-500/20"
                    />
                    <div className="flex items-center gap-2 relative z-10">
                      <AlertTriangle className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <strong className="text-sm">Critical: Ask Brand for Revisions</strong>
                        <span className="text-xs text-red-100/80">Must do before signing</span>
                      </div>
                    </div>
                  </motion.button>
                  
                  {/* Important Action - Get Lawyer Review */}
                  <motion.button
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
                            userEmail: session.user?.email || '',
                            userPhone: profile?.phone
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
                          throw new Error(data.error || 'Failed to send for legal review');
                        }

                        toast.success('Sent for Legal Review');
                        navigate('/messages');
                      } catch (error: any) {
                        console.error('[ContractUploadFlow] Send for legal review error:', error);
                        toast.error(error.message || 'Failed to send for legal review. Please try again.');
                      }
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-yellow-600/80 hover:bg-yellow-600 hover:shadow-xl hover:shadow-yellow-500/50 hover:-translate-y-1 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[48px]"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <strong className="text-sm">Get Lawyer Review</strong>
                        <span className="text-xs text-yellow-100/80">Within 24-48 hours</span>
                      </div>
                    </div>
                  </motion.button>
                  
                  {/* Optional Action - Download Brand-Safe Contract */}
                  <motion.button
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
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-green-600/90 hover:bg-green-600 hover:shadow-xl hover:shadow-green-500/50 hover:-translate-y-1 text-white px-4 py-4 rounded-xl font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1.5 min-h-[48px]"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      <div className="flex flex-col items-start">
                        <strong className="text-sm">Download Brand-Safe Contract</strong>
                        <span className="text-xs text-green-100/80">Ready to share</span>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>
              

              {/* Brand Approval Tracker */}
              {brandApprovalStatus && (
                <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/10 shadow-lg">
                  <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-purple-400" />
                    Brand Approval Status
                  </h4>
                  
                  <div className="space-y-3">
                    {/* Status Badge */}
                    <div className="flex items-center gap-3">
                      {brandApprovalStatus === 'sent' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                          <span className="font-medium text-yellow-300">Sent to Brand</span>
                          <span className="text-sm text-white/60 ml-auto">Waiting for their response</span>
                        </>
                      )}
                      {brandApprovalStatus === 'viewed' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                          <span className="font-medium text-blue-300">Brand Viewed</span>
                          <span className="text-sm text-white/60 ml-auto">Brand opened your message</span>
                        </>
                      )}
                      {brandApprovalStatus === 'negotiating' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-orange-400 animate-pulse"></div>
                          <span className="font-medium text-orange-300">Negotiating</span>
                          <span className="text-sm text-white/60 ml-auto">Changes being discussed</span>
                        </>
                      )}
                      {brandApprovalStatus === 'approved' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-green-400"></div>
                          <span className="font-medium text-green-300">Approved</span>
                          <span className="text-sm text-white/60 ml-auto">Contract finalized</span>
                        </>
                      )}
                      {brandApprovalStatus === 'rejected' && (
                        <>
                          <div className="w-3 h-3 rounded-full bg-red-400"></div>
                          <span className="font-medium text-red-300">Rejected</span>
                          <span className="text-sm text-white/60 ml-auto">Brand declined changes</span>
                        </>
                      )}
                    </div>

                    {/* Auto Actions */}
                    {brandApprovalStatus === 'approved' && (
                      <button
                        onClick={async () => {
                          // Auto-move to Active Deals
                          const creatorId = profile?.id || session?.user?.id;
                          if (!creatorId || !uploadedFile) return;
                          
                          try {
                            const dealValueStr = (analysisResults?.keyTerms?.dealValue || '0').replace(/[₹,]/g, '').trim();
                            const dealAmount = parseFloat(dealValueStr) || 0;
                            const dueDate = new Date();
                            dueDate.setDate(dueDate.getDate() + 30);
                            const dueDateStr = dueDate.toISOString().split('T')[0];

                            await addDealMutation.mutateAsync({
                              creator_id: creatorId,
                              organization_id: null,
                              brand_name: 'Contract Upload',
                              deal_amount: dealAmount,
                              deliverables: analysisResults?.keyTerms?.deliverables || 'As per contract',
                              contract_file: uploadedFile,
                              due_date: dueDateStr,
                              payment_expected_date: dueDateStr,
                              contact_person: null,
                              platform: 'Other',
                              status: 'Active' as const,
                              invoice_file: null,
                              utr_number: null,
                              brand_email: brandEmail || null,
                              payment_received_date: null,
                            });

                            toast.success('Deal moved to Active!');
                            navigate('/creator-contracts');
                          } catch (error: any) {
                            toast.error('Failed to create deal', { description: error?.message });
                          }
                        }}
                        className="w-full bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                      >
                        ✅ Move to Active Deals
                      </button>
                    )}

                    {brandApprovalStatus === 'sent' && approvalStatusUpdatedAt && (
                      <div className="text-xs text-white/60">
                        Sent {new Date(approvalStatusUpdatedAt).toLocaleDateString()} • 
                        {Math.floor((Date.now() - approvalStatusUpdatedAt.getTime()) / (1000 * 60 * 60)) > 48 && (
                          <button
                            onClick={() => {
                              toast.info('Reminder sent to brand');
                            }}
                            className="ml-2 text-purple-400 hover:text-purple-300 underline"
                          >
                            Send Reminder
                          </button>
                        )}
                      </div>
                    )}

                    {brandApprovalStatus === 'rejected' && (
                      <button
                        onClick={() => {
                          setShowNegotiationModal(true);
                          toast.info('Try renegotiation with revised terms');
                        }}
                        className="w-full bg-orange-600/80 hover:bg-orange-600 text-white px-4 py-3 rounded-lg text-sm font-semibold transition-all"
                      >
                        🔄 Try Renegotiation with Revised Terms
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
            )}


            {/* Desktop Action Buttons */}
            <div className="hidden md:flex gap-3 max-w-3xl mx-auto">
              {/* Copy Email Button */}
              <motion.button
                onClick={handleCopyEmail}
                disabled={!negotiationMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-blue-600/90 hover:bg-blue-600 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-5 h-5" />
                Copy Email
              </motion.button>
              
              {/* Copy WhatsApp Button */}
              <motion.button
                onClick={handleCopyWhatsApp}
                disabled={!negotiationMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-green-600/90 hover:bg-green-600 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare className="w-5 h-5" />
                Copy WhatsApp
              </motion.button>
              
              {/* Share Feedback Button */}
              <motion.button
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

                    // Format message with India-optimized template
                    const formattedMessage = formatNegotiationMessage(data.message);
                    setNegotiationMessage(formattedMessage);
                    setShowShareFeedbackModal(true);
                    toast.success('Negotiation message generated!');
                  } catch (error: any) {
                    console.error('[ContractUploadFlow] Generate negotiation message error:', error);
                    toast.error(error.message || 'Failed to generate negotiation message. Please try again.');
                  } finally {
                    setIsGeneratingMessage(false);
                  }
                }}
                disabled={isGeneratingMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-purple-600/90 hover:bg-purple-600 font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingMessage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Share Feedback
                  </>
                )}
              </motion.button>
            </div>
            </div>
            {/* End Content Width Container for iPad/Tablet */}

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
                    {/* Copy Email Button */}
                    <motion.button
                      onClick={handleCopyEmail}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-blue-600/80 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Mail className="w-5 h-5" />
                      Copy Email
                    </motion.button>

                    {/* Copy WhatsApp Button */}
                    <motion.button
                      onClick={handleCopyWhatsApp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-green-600/80 hover:bg-green-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-5 h-5" />
                      Copy WhatsApp
                    </motion.button>

                    {/* Download PDF Button (Secondary) */}
                    <motion.button
                      onClick={async () => {
                        if (!session?.access_token) {
                          toast.error('Please log in to download safe contract');
                          return;
                        }

                        const filePath = originalContractPath || contractUrl;
                        if (!filePath || filePath.trim() === '') {
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
                              reportId: reportId || null,
                              originalFilePath: filePath
                            })
                          });

                          const contentType = response.headers.get('content-type');
                          
                          if (contentType && !contentType.includes('application/json')) {
                            const blob = await response.blob();
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            
                            const contentDisposition = response.headers.get('content-disposition');
                            const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/i);
                            a.download = filenameMatch ? filenameMatch[1] : `safe-contract-version-${Date.now()}.pdf`;
                            
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            toast.success('Safe Version Downloaded');
                          } else {
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
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-gray-600/80 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Download PDF
                    </motion.button>
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

            {/* Share Feedback Modal */}
            <Dialog open={showShareFeedbackModal} onOpenChange={setShowShareFeedbackModal}>
              <DialogContent className="max-w-2xl max-h-[90vh] bg-gradient-to-br from-purple-900/95 to-indigo-900/95 backdrop-blur-xl border border-purple-500/30 text-white overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white mb-2">
                    Send Fixes to Brand
                  </DialogTitle>
                  <DialogDescription className="text-purple-200">
                    Choose how you'd like to share your contract feedback
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Share via WhatsApp */}
                  <motion.button
                    onClick={() => {
                      if (!negotiationMessage) return;
                      const formattedMessage = formatNegotiationMessage(negotiationMessage);
                      const whatsappMessage = createWhatsAppMessage(formattedMessage);
                      const encodedMessage = encodeURIComponent(whatsappMessage);
                      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                      triggerHaptic(HapticPatterns.medium);
                      window.open(whatsappUrl, '_blank');
                      toast.success('Opening WhatsApp...');
                      setBrandApprovalStatus('sent');
                      setApprovalStatusUpdatedAt(new Date());
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-green-600/80 hover:bg-green-600 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <MessageSquare className="w-6 h-6" />
                    <div className="flex flex-col items-start">
                      <span className="text-lg">Share via WhatsApp</span>
                      <span className="text-sm text-green-100/80">Opens WhatsApp with pre-filled message</span>
                    </div>
                  </motion.button>

                  {/* Share via Email */}
                  <motion.button
                    onClick={() => {
                      if (!negotiationMessage) return;
                      const formattedMessage = formatNegotiationMessage(negotiationMessage);
                      const subject = encodeURIComponent('Requested Revisions for Collaboration Agreement');
                      const body = encodeURIComponent(formattedMessage);
                      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
                      triggerHaptic(HapticPatterns.medium);
                      window.location.href = mailtoUrl;
                      toast.success('Opening email client...');
                      setBrandApprovalStatus('sent');
                      setApprovalStatusUpdatedAt(new Date());
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-blue-600/80 hover:bg-blue-600 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <Mail className="w-6 h-6" />
                    <div className="flex flex-col items-start">
                      <span className="text-lg">Share via Email</span>
                      <span className="text-sm text-blue-100/80">Opens your email client with pre-filled message</span>
                    </div>
                  </motion.button>

                  {/* Copy Shareable Link */}
                  <motion.button
                    onClick={async () => {
                      if (!reportId) {
                        toast.error('Report ID not available. Please re-analyze the contract.');
                        return;
                      }
                      
                      const shareableUrl = `${window.location.origin}/#/feedback/${reportId}`;
                      await navigator.clipboard.writeText(shareableUrl);
                      triggerHaptic(HapticPatterns.light);
                      toast.success('Shareable link copied!');
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-purple-600/80 hover:bg-purple-600 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <Copy className="w-6 h-6" />
                    <div className="flex flex-col items-start">
                      <span className="text-lg">Copy Shareable Link</span>
                      <span className="text-sm text-purple-100/80">Share a read-only feedback page with the brand</span>
                    </div>
                  </motion.button>

                  {/* Close Button */}
                  <button
                    onClick={() => {
                      setShowShareFeedbackModal(false);
                    }}
                    className="w-full bg-gray-600/80 hover:bg-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 mt-4"
                  >
                    <X className="w-5 h-5" />
                    Close
                  </button>
                </div>
              </DialogContent>
            </Dialog>
            
            {/* WhatsApp Preview Modal */}
            <Dialog open={showWhatsAppPreview} onOpenChange={setShowWhatsAppPreview}>
              <DialogContent className="max-w-lg bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-xl border border-green-500/30 text-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    WhatsApp Message Preview
                  </DialogTitle>
                  <DialogDescription className="text-green-200">
                    Review your message before sending
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 max-h-96 overflow-y-auto">
                  <pre className="text-sm text-white whitespace-pre-wrap font-sans">
                    {negotiationMessage ? createWhatsAppMessage(formatNegotiationMessage(negotiationMessage)) : 'No message available'}
                  </pre>
                </div>
                <div className="flex gap-3 mt-6">
                  <motion.button
                    onClick={handleConfirmWhatsAppCopy}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Copy & Close
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      if (!negotiationMessage) return;
                      const fullMessage = formatNegotiationMessage(negotiationMessage);
                      const whatsappMessage = createWhatsAppMessage(fullMessage);
                      const encodedMessage = encodeURIComponent(whatsappMessage);
                      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
                      window.open(whatsappUrl, '_blank');
                      toast.success('Opening WhatsApp...');
                      setShowWhatsAppPreview(false);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Open WhatsApp
                  </motion.button>
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

