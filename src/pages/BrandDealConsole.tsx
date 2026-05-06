

import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    Clock,
    FileText,
    Shield,
    ChevronRight,
    AlertCircle,
    Activity,
    ArrowRight,
    Loader2,
    Calendar,
    Lock,
    ExternalLink,
    MoreVertical,
    Check,
    Send,
    Edit3,
    ThumbsUp,
    ThumbsDown,
    MessageSquare,
    Link as LinkIcon,
    Sun,
    Moon,
    Laptop
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';
import { withRetry } from '@/lib/utils/retry';
import { useSession } from '@/contexts/SessionContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

// Lifecycle Stages
type Stage = 'PROPOSAL' | 'INTAKE' | 'SIGNING' | 'ESCROW' | 'EXECUTING' | 'VESTED';

const safeImageSrc = (src?: string | null) => {
    const value = (src || '').trim();
    if (!value) return undefined;
    if (/cdninstagram\.com/i.test(value)) return undefined;
    return value;
};

const STAGES: { id: Stage; label: string; description: string }[] = [
    { id: 'PROPOSAL', label: 'Proposal', description: 'Reviewing initial brief' },
    { id: 'INTAKE', label: 'Deal Lock', description: 'Mutual commitment layer' },
    { id: 'SIGNING', label: 'Signing', description: 'Contract legally binding' },
    { id: 'ESCROW', label: 'Security', description: 'Payment validation phase' },
    { id: 'EXECUTING', label: 'Execution', description: 'Content production phase' },
    { id: 'VESTED', label: 'Vested', description: 'Campaign closed' }
];

const BrandDealConsole = () => {
    const [logoErrored, setLogoErrored] = useState(false);
    const [avatarErrored, setAvatarErrored] = useState(false);
    const { token } = useParams<{ token: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [currentStage, setCurrentStage] = useState<Stage>('PROPOSAL');
    const { profile } = useSession();
    const [isSubmittingContent, setIsSubmittingContent] = useState(false);
    const [contentUrl, setContentUrl] = useState('');
    const [creatorNotes, setCreatorNotes] = useState('');
    const [brandFeedback, setBrandFeedback] = useState('');
    const [isReviewing, setIsReviewing] = useState(false);
    const isCreator = profile && data?.creator && profile.id === data.creator.id;
    const isNewSubmission = location.state?.isNewSubmission || false;
    const THEME_KEY = 'brand_console_theme_preference';
    const [themePreference, setThemePreference] = useState<'system' | 'dark' | 'light'>(() => {
        if (typeof window === 'undefined') return 'system';
        const saved = (localStorage.getItem(THEME_KEY) || '').toLowerCase();
        if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
        return 'system';
    });
    const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(THEME_KEY, themePreference);
    }, [themePreference]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
        if (typeof mq.addEventListener === 'function') mq.addEventListener('change', onChange);
        else (mq as any).addListener(onChange);
        return () => {
            if (typeof mq.removeEventListener === 'function') mq.removeEventListener('change', onChange);
            else (mq as any).removeListener(onChange);
        };
    }, []);

    const isDark = themePreference === 'system' ? systemPrefersDark : themePreference === 'dark';

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const apiBaseUrl = getApiBaseUrl();
                const response = await withRetry(() => fetch(`${apiBaseUrl}/api/collab/console/${token}`));
                const result = await response.json();

                if (result.success) {
                    setData(result);
                    setCurrentStage(result.stage as Stage);
                } else {
                    toast.error(result.error || 'Failed to fetch deal status');
                }
            } catch (error) {
                console.error('Console fetch error:', error);
                toast.error('Network error. Please check your connection and try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const handleContentSubmission = async () => {
        if (!contentUrl) {
            toast.error('Please provide a content URL');
            return;
        }
            setIsSubmittingContent(true);
        try {
            const apiBaseUrl = getApiBaseUrl();
            const accessToken = (await supabase.auth.getSession()).data.session?.access_token;
            const response = await withRetry(() => fetch(`${apiBaseUrl}/api/deals/${data.brandDeal.id}/submit-content`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ contentUrl, notes: creatorNotes })
            }));
            const result = await response.json();
            if (result.success) {
                toast.success('Content submitted for review');
                // Refresh data
                const refreshRes = await withRetry(() => fetch(`${apiBaseUrl}/api/collab/console/${token}`));
                const refreshData = await refreshRes.json();
                if (refreshData.success) setData(refreshData);
            } else {
                toast.error(result.error || 'Failed to submit content');
            }
        } catch (error) {
            toast.error('Submission failed. Please try again.');
        } finally {
            setIsSubmittingContent(false);
        }
    };

    const handleBrandReview = async (status: 'approved' | 'changes_requested') => {
        setIsReviewing(true);
        try {
            const apiBaseUrl = getApiBaseUrl();
            const response = await withRetry(() => fetch(`${apiBaseUrl}/api/deals/${data.brandDeal.id}/review-content`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, feedback: brandFeedback })
            }));
            const result = await response.json();
            if (result.success) {
                toast.success(status === 'approved' ? 'Content approved!' : 'Feedback sent to creator');
                // Refresh data
                const refreshRes = await withRetry(() => fetch(`${apiBaseUrl}/api/collab/console/${token}`));
                const refreshData = await refreshRes.json();
                if (refreshData.success) {
                    setData(refreshData);
                    setCurrentStage(refreshData.stage as Stage);
                }
            } else {
                toast.error(result.error || 'Failed to submit review');
            }
        } catch (error) {
            toast.error('Review failed. Please try again.');
        } finally {
            setIsReviewing(false);
        }
    };

    if (loading) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center", "bg-background dark:bg-[#0A0A0B]")}>
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-muted-foreground dark:text-muted-foreground text-sm font-medium">Initializing Secure Console...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className={cn("min-h-screen flex items-center justify-center p-6 text-center", "bg-background dark:bg-[#0A0A0B]")}>
                <div className="max-w-md">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-muted-foreground dark:text-foreground mb-2">Deal Not Found</h1>
                    <p className="text-muted-foreground dark:text-muted-foreground mb-6">This link might be expired or the token is invalid. Please contact the creator if you believe this is an error.</p>
                    <button type="button"
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-background text-foreground rounded-lg hover:bg-background transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const { collabRequest, brandDeal, creator, activity } = data;

    return (
        <div className={cn(
            "min-h-screen font-sans selection:bg-primary/30",
            isDark ? "dark" : "",
            "bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-muted-foreground dark:bg-[#0A0A0B] dark:text-muted-foreground"
        )}>
            {/* Top Bar */}
            <header className="sticky top-0 z-50 border-b bg-secondary/70 border-border/70 dark:border-border/5 dark:bg-[#0A0A0B]/80 backdrop-blur-xl">
                <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden shadow-inner">
                                {(brandDeal?.brand_logo_url || collabRequest?.brand_logo_url) && !logoErrored ? (
                                <img
                                    src={brandDeal?.brand_logo_url || collabRequest?.brand_logo_url}
                                    alt="Brand logo"
                                    className="max-h-full max-w-full object-contain p-1.5"
                                    onError={() => setLogoErrored(true)}
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                    <Shield className="w-5 h-5 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-muted-foreground">{brandDeal?.brand_name || collabRequest?.brand_name}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-background overflow-hidden">
                                    {safeImageSrc(creator?.avatar_url) && !avatarErrored ? (
                                        <img
                                            src={safeImageSrc(creator.avatar_url)}
                                            alt="Brand logo"
                                            className="w-full h-full object-cover"
                                            onError={() => setAvatarErrored(true)}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-primary/15 flex items-center justify-center text-[10px] text-primary font-bold uppercase">
                                            {creator?.name?.slice(0, 2) || 'CR'}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-muted-foreground dark:text-foreground">{creator?.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-1 rounded-full border border-border/80 bg-secondary/70 px-1 py-1 shadow-sm dark:border-border dark:bg-card">
                            <button type="button"
                                type="button"
                                onClick={() => setThemePreference('system')}
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                                    themePreference === 'system' ? "bg-primary/15 text-primary dark:text-primary" : "text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-foreground"
                                )}
                                aria-label="Theme: system"
                            >
                                <Laptop className="w-4 h-4" />
                            </button>
                            <button type="button"
                                type="button"
                                onClick={() => setThemePreference('light')}
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                                    themePreference === 'light' ? "bg-primary/15 text-primary dark:text-primary" : "text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-foreground"
                                )}
                                aria-label="Theme: light"
                            >
                                <Sun className="w-4 h-4" />
                            </button>
                            <button type="button"
                                type="button"
                                onClick={() => setThemePreference('dark')}
                                className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
                                    themePreference === 'dark' ? "bg-primary/15 text-primary dark:text-primary" : "text-muted-foreground hover:text-muted-foreground dark:text-muted-foreground dark:hover:text-foreground"
                                )}
                                aria-label="Theme: dark"
                            >
                                <Moon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/5 text-[11px] font-medium text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            Secure Connection
                        </div>
                        <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero / Stage Tracker */}
            <section className="border-b border-border/70 bg-secondary/60 dark:border-border/5 dark:bg-[#0D0D0F]">
                <div className="max-w-[1440px] mx-auto px-6 py-12">
                    {isNewSubmission && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-start gap-3"
                        >
                            <CheckCircle className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground dark:text-primary">Proposal Submitted Successfully</h3>
                                <p className="text-xs text-muted-foreground dark:text-primary/80 mt-1">Your collaboration request has been securely delivered. This page is your persistent console for tracking the deal lifecycle.</p>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold text-foreground tracking-tight">
                                    {collabRequest?.campaign_name || 'Campaign Partnership'}
                                </h1>
                                <p className="text-muted-foreground text-sm mt-1">Console ID: <span className="font-mono text-xs">{token?.slice(0, 8)}...</span></p>
                            </div>

                            <div className="flex items-center gap-3">
                                {currentStage === 'PROPOSAL' && (
                                    <div className="px-4 py-2 bg-[#0FA47F] text-foreground text-sm font-medium rounded-lg shadow-lg shadow-emerald-900/20 hover:bg-primary transition-all flex items-center gap-2 cursor-pointer">
                                        Review Brief
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Linear Progress Tracker */}
                <div className="relative pt-4 overflow-x-auto no-scrollbar">
                    <div className="flex items-center justify-between min-w-[800px] px-2">
                        {STAGES.map((stage, idx) => {
                            const isCompleted = STAGES.findIndex(s => s.id === currentStage) > idx;
                            const isActive = stage.id === currentStage;

                            return (
                                <div key={stage.id} className="flex flex-col items-center gap-3 relative z-10">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                                        isCompleted ? "bg-[#0FA47F] border-[#0FA47F]" :
                                            isActive ? "bg-primary/10 border-primary ring-4 ring-emerald-500/10" :
                                                "bg-background border-border"
                                    )}>
                                        {isCompleted ? (
                                            <Check className="w-5 h-5 text-foreground" />
                                        ) : (
                                            <span className={cn(
                                                "text-xs font-bold",
                                                isActive ? "text-primary" : "text-muted-foreground dark:text-muted-foreground"
                                            )}>{idx + 1}</span>
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <p className={cn(
                                            "text-[12px] font-semibold uppercase tracking-wider",
                                            isActive ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground"
                                        )}>{stage.label}</p>
                                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[100px] leading-tight">{stage.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Progress Line */}
                    <div className="absolute top-[34px] left-[5%] right-[5%] h-[2px] bg-background dark:bg-background -z-0">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${(STAGES.findIndex(s => s.id === currentStage) / (STAGES.length - 1)) * 100}%`
                            }}
                            className="h-full bg-[#0FA47F] shadow-[0_0_10px_rgba(15,164,127,0.55)]"
                        />
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <main className="max-w-[1440px] mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8">

                    {/* Left Column: Contextual State */}
                    <div className="space-y-8">
                        {/* Stage Summary Card */}
                        <div className="bg-secondary/80 border border-border/80 rounded-2xl p-8 backdrop-blur-sm shadow-sm dark:bg-background/40 dark:border-border/5 dark:shadow-none">
                            <AnimatePresence mode="wait">
                                {currentStage === 'PROPOSAL' && (
                                    <motion.div
                                        key="proposal"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <div className="flex items-start justify-between mb-8">
                                            <div>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary dark:text-primary uppercase tracking-widest border border-primary/20">
                                                    PROPOSAL_ACTIVE
                                                </span>
                                                <h2 className="text-xl font-semibold text-muted-foreground dark:text-foreground mt-3">Proposal Details</h2>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Sent {new Date(collabRequest?.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-card rounded-xl p-5 border border-border/80 dark:bg-card dark:border-border/5">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Deliverables</p>
                                                <ul className="space-y-3">
                                                    {Array.isArray(collabRequest?.deliverables) ? collabRequest.deliverables.map((d: any, i: number) => (
                                                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground dark:text-muted-foreground">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                            {d}
                                                        </li>
                                                    )) : (
                                                        <li className="text-sm text-muted-foreground dark:text-muted-foreground">{collabRequest?.deliverables}</li>
                                                    )}
                                                </ul>
                                            </div>
                                            <div className="bg-card rounded-xl p-5 border border-border/80 dark:bg-card dark:border-border/5">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Proposed Budget</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-muted-foreground dark:text-foreground">₹{collabRequest?.exact_budget || collabRequest?.budget || 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">Fixed Fee</span>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-border/70 dark:border-border/5">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Payment Terms</p>
                                                    <p className="text-sm text-muted-foreground dark:text-muted-foreground">50% upfront, 50% on delivery</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex flex-col items-center justify-center p-12 border border-dashed border-border/70 dark:border-border rounded-2xl bg-secondary/60 dark:bg-secondary/[0.02]">
                                            <Clock className="w-8 h-8 text-muted-foreground dark:text-muted-foreground mb-4" />
                                            <h3 className="text-muted-foreground dark:text-foreground font-medium">Awaiting Creator Confirmation</h3>
                                            <p className="text-muted-foreground dark:text-muted-foreground text-sm text-center mt-2 max-w-sm">
                                                {creator?.name} has been notified and is currently reviewing the specifications. You will receive an email once the proposal is accepted or countered.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStage === 'INTAKE' && (
                                    <motion.div
                                        key="deal_lock"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <div className="mb-8">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">
                                                DEAL_LOCKED
                                            </span>
                                            <h2 className="text-xl font-semibold text-foreground mt-3 flex items-center gap-2">
                                                <Lock className="w-5 h-5 text-primary" />
                                                Mutual Commitment Required
                                            </h2>
                                            <p className="text-muted-foreground text-sm mt-1">Both sides must lock terms before production begins. This makes the partnership official.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                            <div className="p-6 rounded-2xl border border-border/5 bg-primary/[0.02] flex flex-col items-center text-center">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                    <CheckCircle className="w-5 h-5 text-primary" />
                                                </div>
                                                <h3 className="text-sm font-bold text-foreground mb-2">Creator Commitment</h3>
                                                <ul className="text-[11px] text-muted-foreground space-y-2 mb-6">
                                                    <li>✓ Deliverables confirmed</li>
                                                    <li>✓ Timeline accepted</li>
                                                    <li>✓ Exclusivity understood</li>
                                                </ul>
                                                <div className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Creator Confirmed</div>
                                            </div>

                                            <div className="p-6 rounded-2xl border border-purple-500/30 bg-secondary/[0.02] flex flex-col items-center text-center">
                                                <div className="w-10 h-10 rounded-full bg-card0 flex items-center justify-center mb-4">
                                                    <Activity className="w-5 h-5 text-secondary" />
                                                </div>
                                                <h3 className="text-sm font-bold text-foreground mb-2">Brand Commitment</h3>
                                                <ul className="text-[11px] text-muted-foreground space-y-2 mb-6">
                                                    <li>• Payment commitment confirmed</li>
                                                    <li>• Content brief finalized</li>
                                                    <li>• Admin rights prepared</li>
                                                </ul>
                                                <button type="button"
                                                    onClick={() => navigate(`/deal-details/${token}`)}
                                                    className="w-full py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-foreground text-xs font-bold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Finalize & Commit
                                                    <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStage === 'EXECUTING' && (
                                    <motion.div
                                        key="executing"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <div className="mb-8">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning uppercase tracking-widest border border-orange-500/20">
                                                EXECUTION_PHASE
                                            </span>
                                            <h2 className="text-xl font-semibold text-foreground mt-3">Content Production</h2>
                                            <p className="text-muted-foreground text-sm mt-1">Creator is currently producing agreed deliverables. Track milestones below.</p>
                                        </div>

                                        <div className="space-y-6">
                                            <p className="text-xs text-muted-foreground mb-3">Follow each step to complete the deal. Click each step for details.</p>
                                            {/* Milestone Status Indicators */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className={cn(
                                                    "p-4 rounded-xl border flex flex-col items-center text-center gap-2",
                                                    brandDeal?.content_submitted_at ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                                                )}>
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                                        brandDeal?.content_submitted_at ? "bg-primary text-foreground" : "bg-background text-muted-foreground"
                                                    )}>
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Content Submitted</span>
                                                    {brandDeal?.content_submitted_at && <span className="text-[10px] text-primary">{new Date(brandDeal.content_submitted_at).toLocaleDateString()}</span>}
                                                </div>
                                                <div className={cn(
                                                    "p-4 rounded-xl border flex flex-col items-center text-center gap-2",
                                                    brandDeal?.brand_approval_status === 'approved' ? "bg-primary/5 border-primary/20" :
                                                        brandDeal?.brand_approval_status === 'changes_requested' ? "bg-warning/5 border-orange-500/20" : "bg-card border-border"
                                                )}>
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                                        brandDeal?.brand_approval_status === 'approved' ? "bg-primary text-foreground" :
                                                            brandDeal?.brand_approval_status === 'changes_requested' ? "bg-warning text-foreground" : "bg-background text-muted-foreground"
                                                    )}>
                                                        <CheckCircle className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Brand Approval</span>
                                                    <span className="text-[10px] text-muted-foreground capitalize">{brandDeal?.brand_approval_status?.replace('_', ' ') || 'Pending'}</span>
                                                </div>
                                                <div className={cn(
                                                    "p-4 rounded-xl border flex flex-col items-center text-center gap-2",
                                                    brandDeal?.status === 'Completed' || brandDeal?.status === 'VESTED' ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                                                )}>
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                                        brandDeal?.status === 'Completed' || brandDeal?.status === 'VESTED' ? "bg-primary text-foreground" : "bg-background text-muted-foreground"
                                                    )}>
                                                        <Lock className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider">Campaign Locked</span>
                                                    <span className="text-[10px] text-muted-foreground">Post-Approval</span>
                                                </div>
                                            </div>

                                            {/* Role-specific Actions */}
                                            {isCreator && brandDeal?.brand_approval_status !== 'approved' && (
                                                <div className="bg-card border border-purple-500/20 rounded-2xl p-6">
                                                    <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                                                        <Send className="w-4 h-4 text-secondary" />
                                                        Submit Content Draft
                                                    </h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Content URL (Drive, Dropbox, Unlisted Link)</label>
                                                            <Input
                                                                value={contentUrl}
                                                                onChange={(e) => setContentUrl(e.target.value)}
                                                                placeholder="https://docs.google.com/..."
                                                                className="bg-card border-border text-foreground"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Notes for Brand</label>
                                                            <Textarea
                                                                value={creatorNotes}
                                                                onChange={(e) => setCreatorNotes(e.target.value)}
                                                                placeholder="Explain the creative direction or any specific feedback needed..."
                                                                className="bg-card border-border text-foreground resize-none"
                                                                rows={3}
                                                            />
                                                        </div>
                                                        <Button
                                                            onClick={handleContentSubmission}
                                                            disabled={isSubmittingContent}
                                                            className="w-full bg-secondary hover:bg-secondary text-foreground font-bold"
                                                        >
                                                            {isSubmittingContent ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                                                            Submit for Review
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {!isCreator &&
                                              ((Array.isArray((brandDeal as any)?.content_links) && (brandDeal as any).content_links.length > 0) || brandDeal?.content_submission_url) &&
                                              brandDeal?.brand_approval_status !== 'approved' && (
                                                <div className="bg-info/5 border border-info/20 rounded-2xl p-6">
                                                    <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                                                        <Edit3 className="w-4 h-4 text-info" />
                                                        Review Content Draft
                                                    </h3>
                                                    <div className="space-y-4">
                                                        <div className="bg-card border border-border rounded-xl p-4">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <LinkIcon className="w-4 h-4 text-muted-foreground" />
                                                                <span className="text-sm text-muted-foreground">Submitted links</span>
                                                                {String((brandDeal as any)?.content_delivery_status || '').toLowerCase() === 'posted' && (
                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                                                        POSTED
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                {Array.from(
                                                                    new Set(
                                                                        [
                                                                            ...(Array.isArray((brandDeal as any)?.content_links) ? (brandDeal as any).content_links : []),
                                                                            brandDeal?.content_submission_url,
                                                                        ]
                                                                            .map((v: any) => String(v || '').trim())
                                                                            .filter(Boolean)
                                                                    )
                                                                ).map((link, idx) => (
                                                                    <a
                                                                        key={`${link}-${idx}`}
                                                                        href={link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-xs font-bold text-info hover:underline flex items-center gap-1 break-all"
                                                                    >
                                                                        Open link <ExternalLink className="w-3 h-3" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {(brandDeal?.content_caption || brandDeal?.content_notes) && (
                                                            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                                                                {brandDeal?.content_caption && (
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Caption</p>
                                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{brandDeal.content_caption}</p>
                                                                    </div>
                                                                )}
                                                                {brandDeal?.content_notes && (
                                                                    <div>
                                                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Message</p>
                                                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{brandDeal.content_notes}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div>
                                                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Approval Feedback</label>
                                                            <Textarea
                                                                value={brandFeedback}
                                                                onChange={(e) => setBrandFeedback(e.target.value)}
                                                                placeholder="Add feedback if requesting changes..."
                                                                className="bg-card border-border text-foreground resize-none"
                                                                rows={3}
                                                            />
                                                        </div>

                                                        <div className="flex gap-3">
                                                            <Button
                                                                onClick={() => handleBrandReview('changes_requested')}
                                                                disabled={isReviewing}
                                                                variant="outline"
                                                                className="flex-1 border-orange-500/50 text-warning hover:bg-warning/10"
                                                            >
                                                                <ThumbsDown className="w-4 h-4 mr-2" />
                                                                Request Changes
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleBrandReview('approved')}
                                                                disabled={isReviewing}
                                                                className="flex-1 bg-primary hover:bg-primary text-foreground font-bold"
                                                            >
                                                                <ThumbsUp className="w-4 h-4 mr-2" />
                                                                Approve Content
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {brandDeal?.brand_approval_status === 'approved' && (
                                                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8 text-center">
                                                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                                                        <CheckCircle className="w-8 h-8 text-primary" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-foreground mb-2">Content Approved</h3>
                                                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                                        The content has been officially approved. The campaign is now moving to the closing phase.
                                                    </p>
                                                    {brandDeal.brand_feedback && (
                                                        <div className="mt-6 p-4 bg-card rounded-xl border border-border/5 text-left">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                <MessageSquare className="w-3 h-3" />
                                                                Final Feedback
                                                            </p>
                                                            <p className="text-sm text-muted-foreground italic">"{brandDeal.brand_feedback}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {(currentStage === 'SIGNING' || brandDeal?.status === 'CONTRACT_READY') && (
                                    <motion.div
                                        key="signing"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <div className="mb-8">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-info/10 text-info uppercase tracking-widest border border-info/20">
                                                SIGNING_ACTIVE
                                            </span>
                                            <h2 className="text-xl font-semibold text-foreground mt-3">Agreement Finalized</h2>
                                            <p className="text-muted-foreground text-sm mt-1">Review the generated contract and execute the legal signature.</p>
                                        </div>

                                        <div className="bg-card rounded-2xl border border-border/5 overflow-hidden">
                                            <div className="p-6 border-b border-border/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                                    <span className="font-medium">Collaboration_Agreement.pdf</span>
                                                </div>
                                                <button type="button" className="text-[11px] font-bold text-secondary uppercase tracking-widest hover:text-secondary">Download DOCX</button>
                                            </div>
                                            <div className="aspect-[4/5] bg-[#1a1a1f] p-8 m-4 rounded-lg flex items-center justify-center border border-border/5">
                                                <div className="text-center">
                                                    <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                                                    <p className="text-muted-foreground text-sm">Agreement Preview Secured</p>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-background/50 flex items-center justify-between">
                                                <p className="text-xs text-muted-foreground">Version 3.0 • Generated {new Date().toLocaleDateString()}</p>
                                                <button type="button"
                                                    onClick={() => navigate(`/contract-ready/${token}`)}
                                                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-foreground text-xs font-bold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all"
                                                >
                                                    Review & Sign
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Deal Terms Mini-Ledger */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-background/40 border border-border/5 rounded-xl p-6">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    Safety Features
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Secure Payouts</span>
                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase">Enabled</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">AI Contract Audit</span>
                                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase">Verified</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Liability Shield</span>
                                        <span className="text-[10px] font-bold text-muted-foreground bg-background/10 px-1.5 py-0.5 rounded border border-border uppercase">Pending Signature</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-background/40 border border-border/5 rounded-xl p-6">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Timeline
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Submission Date</span>
                                        <span className="text-sm text-muted-foreground">{new Date(collabRequest?.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Intake Target</span>
                                        <span className="text-sm text-muted-foreground">{collabRequest?.deadline || 'Flexible'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Est. Completion</span>
                                        <span className="text-sm text-muted-foreground">TBD</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Activity Ledger */}
                    <div className="space-y-6">
                        <div className="bg-background/40 border border-border/5 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-secondary" />
                                    Activity Ledger
                                </h3>
                                <span className="text-[10px] font-bold text-muted-foreground bg-background border border-border/5 px-2 py-0.5 rounded uppercase tracking-widest">Global Audit</span>
                            </div>

                            <div className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-card">
                                {/* Proposal Submission (Static for now since it might not be in logs) */}
                                <div className="relative pl-7 group">
                                    <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-primary/20 border-2 border-primary z-10" />
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">Proposal Submitted</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(collabRequest?.created_at).toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-secondary/[0.03] border border-border/5 italic">"Initial brief for Summer Campaign sent to creator profile."</p>
                                    </div>
                                </div>

                                {/* Audit Logs from DB */}
                                {(activity || []).map((log: any) => (
                                    <div key={log.id} className="relative pl-7 group">
                                        <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-secondary/20 border-2 border-purple-500 z-10" />
                                        <div>
                                            <p className="text-xs font-semibold text-foreground">{log.event.replace(/_/g, ' ')}</p>
                                            <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                                            {log.metadata?.message && (
                                                <p className="text-xs text-muted-foreground mt-2 p-2 rounded bg-secondary/[0.03] border border-border/5 italic">"{log.metadata.message}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Loading state indicator for future logs */}
                                <div className="relative pl-7 text-[11px] text-muted-foreground font-medium italic">
                                    Awaiting next protocol event...
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-purple-500/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-secondary" />
                                <h4 className="text-sm font-semibold text-foreground">Creator Armour Security</h4>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                All transitions in the console are cryptographically timestamped and logged.
                                Funds are only released once milestones are verified by our content protocol.
                            </p>
                            <button type="button" className="mt-4 text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2 hover:text-secondary">
                                Learn more about protection
                                <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </main >

            <footer className="mt-auto border-t border-border/5 py-8">
                <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-4">
                        <span>© 2025 Creator Armour</span>
                        <span className="w-1 h-1 rounded-full bg-background" />
                        <a href="#" className="hover:text-foreground transition-colors">Legal Framework</a>
                        <a href="#" className="hover:text-foreground transition-colors">Audit Integrity</a>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        End-to-End Encrypted Console
                    </div>
                </div>
            </footer>
        </div >
    );
};

export default BrandDealConsole;
