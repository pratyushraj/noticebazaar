"use client";

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
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/utils/api';

// Lifecycle Stages
type Stage = 'PROPOSAL' | 'INTAKE' | 'SIGNING' | 'ESCROW' | 'EXECUTING' | 'VESTED';

const STAGES: { id: Stage; label: string; description: string }[] = [
    { id: 'PROPOSAL', label: 'Proposal', description: 'Initial offer being reviewed' },
    { id: 'INTAKE', label: 'Intake', description: 'Gathering technical specifications' },
    { id: 'SIGNING', label: 'Signing', description: 'Agreement legally binding' },
    { id: 'ESCROW', label: 'Escrow', description: 'Funds secured in safety' },
    { id: 'EXECUTING', label: 'Execution', description: 'Content production phase' },
    { id: 'VESTED', label: 'Vested', description: 'Payment released & closed' }
];

const BrandDealConsole = () => {
    const { token } = useParams<{ token: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [currentStage, setCurrentStage] = useState<Stage>('PROPOSAL');
    const isNewSubmission = location.state?.isNewSubmission || false;

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                const apiBaseUrl = getApiBaseUrl();
                const response = await fetch(`${apiBaseUrl}/api/collab-requests/console/${token}`);
                const result = await response.json();

                if (result.success) {
                    setData(result);
                    setCurrentStage(result.stage as Stage);
                } else {
                    toast.error(result.error || 'Failed to fetch deal status');
                }
            } catch (error) {
                console.error('Console fetch error:', error);
                toast.error('Network error. Retrying...');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Initializing Secure Console...</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-6 text-center">
                <div className="max-w-md">
                    <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-white mb-2">Deal Not Found</h1>
                    <p className="text-slate-400 mb-6">This link might be expired or the token is invalid. Please contact the creator if you believe this is an error.</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const { collabRequest, brandDeal, creator, activity } = data;

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-slate-200 font-sans selection:bg-purple-500/30">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0B]/80 backdrop-blur-xl">
                <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner">
                            {(brandDeal?.brand_logo_url || collabRequest?.brand_logo_url) ? (
                                <img
                                    src={brandDeal?.brand_logo_url || collabRequest?.brand_logo_url}
                                    alt=""
                                    className="max-h-full max-w-full object-contain p-1.5"
                                />
                            ) : (
                                <Shield className="w-5 h-5 text-slate-400" />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-400">{brandDeal?.brand_name || collabRequest?.brand_name}</span>
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-800 overflow-hidden">
                                    {creator?.avatar_url ? (
                                        <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-400 font-bold uppercase">
                                            {creator?.name?.slice(0, 2)}
                                        </div>
                                    )}
                                </div>
                                <span className="text-sm font-semibold text-white">{creator?.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-white/5 text-[11px] font-medium text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Secure Connection
                        </div>
                        <button className="p-2 text-slate-400 hover:text-white transition-colors">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero / Stage Tracker */}
            <section className="border-b border-white/5 bg-[#0D0D0F]">
                <div className="max-w-[1440px] mx-auto px-6 py-12">
                    {isNewSubmission && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-start gap-3"
                        >
                            <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-semibold text-purple-100">Proposal Submitted Successfully</h3>
                                <p className="text-xs text-purple-300/80 mt-1">Your collaboration request has been securely delivered. This page is your persistent console for tracking the deal lifecycle.</p>
                            </div>
                        </motion.div>
                    )}

                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-semibold text-white tracking-tight">
                                    {collabRequest?.campaign_name || 'Campaign Partnership'}
                                </h1>
                                <p className="text-slate-400 text-sm mt-1">Console ID: <span className="font-mono text-xs">{token?.slice(0, 8)}...</span></p>
                            </div>

                            <div className="flex items-center gap-3">
                                {currentStage === 'PROPOSAL' && (
                                    <div className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-purple-900/20 hover:bg-purple-500 transition-all flex items-center gap-2 cursor-pointer">
                                        Review Brief
                                        <ArrowRight className="w-4 h-4" />
                                    </div>
                                )}
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
                                                isCompleted ? "bg-purple-600 border-purple-600" :
                                                    isActive ? "bg-purple-500/10 border-purple-500 ring-4 ring-purple-500/10" :
                                                        "bg-slate-900 border-slate-800"
                                            )}>
                                                {isCompleted ? (
                                                    <Check className="w-5 h-5 text-white" />
                                                ) : (
                                                    <span className={cn(
                                                        "text-xs font-bold",
                                                        isActive ? "text-purple-400" : "text-slate-600"
                                                    )}>{idx + 1}</span>
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <p className={cn(
                                                    "text-[12px] font-semibold uppercase tracking-wider",
                                                    isActive ? "text-white" : isCompleted ? "text-slate-300" : "text-slate-600"
                                                )}>{stage.label}</p>
                                                <p className="text-[10px] text-slate-500 mt-1 max-w-[100px] leading-tight">{stage.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Progress Line */}
                            <div className="absolute top-[34px] left-[5%] right-[5%] h-[2px] bg-slate-800 -z-0">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${(STAGES.findIndex(s => s.id === currentStage) / (STAGES.length - 1)) * 100}%`
                                    }}
                                    className="h-full bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Grid */}
            <main className="max-w-[1440px] mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8">

                    {/* Left Column: Contextual State */}
                    <div className="space-y-8">
                        {/* Stage Summary Card */}
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-8 backdrop-blur-sm">
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
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 uppercase tracking-widest border border-purple-500/20">
                                                    PROPOSAL_ACTIVE
                                                </span>
                                                <h2 className="text-xl font-semibold text-white mt-3">Proposal Details</h2>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Sent {new Date(collabRequest?.created_at).toLocaleDateString()}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Deliverables</p>
                                                <ul className="space-y-3">
                                                    {Array.isArray(collabRequest?.deliverables) ? collabRequest.deliverables.map((d: any, i: number) => (
                                                        <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                            {d}
                                                        </li>
                                                    )) : (
                                                        <li className="text-sm text-slate-300">{collabRequest?.deliverables}</li>
                                                    )}
                                                </ul>
                                            </div>
                                            <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Proposed Budget</p>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-white">₹{collabRequest?.exact_budget || collabRequest?.budget || 'N/A'}</span>
                                                    <span className="text-xs text-slate-400">Fixed Fee</span>
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Payment Terms</p>
                                                    <p className="text-sm text-slate-300">50% upfront, 50% on delivery</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-2xl bg-white/[0.02]">
                                            <Clock className="w-8 h-8 text-slate-600 mb-4" />
                                            <h3 className="text-white font-medium">Awaiting Creator Confirmation</h3>
                                            <p className="text-slate-400 text-sm text-center mt-2 max-w-sm">
                                                {creator?.name} has been notified and is currently reviewing the specifications. You will receive an email once the proposal is accepted or countered.
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {currentStage === 'INTAKE' && (
                                    <motion.div
                                        key="intake"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                    >
                                        <div className="mb-8">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 uppercase tracking-widest border border-amber-500/20">
                                                ACTION_REQUIRED
                                            </span>
                                            <h2 className="text-xl font-semibold text-white mt-3">Technical Specifications</h2>
                                            <p className="text-slate-400 text-sm mt-1">Please provide the necessary details to generate a legally binding agreement.</p>
                                        </div>

                                        <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.01] flex flex-col items-center text-center">
                                            <FileText className="w-12 h-12 text-purple-500/50 mb-4" />
                                            <h3 className="text-lg font-medium text-white mb-2">Finalize Deal Details</h3>
                                            <p className="text-slate-400 text-sm mb-8 max-w-sm">We need a few more details regarding usage rights, posting schedule, and billing information to proceed with the contract.</p>
                                            <button
                                                onClick={() => navigate(`/deal-details/${token}`)}
                                                className="px-8 py-3 bg-white text-[#0A0A0B] font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
                                            >
                                                Complete Intake Form
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
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
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 uppercase tracking-widest border border-blue-500/20">
                                                SIGNING_ACTIVE
                                            </span>
                                            <h2 className="text-xl font-semibold text-white mt-3">Agreement Finalized</h2>
                                            <p className="text-slate-400 text-sm mt-1">Review the generated contract and execute the legal signature.</p>
                                        </div>

                                        <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                                            <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="w-5 h-5 text-slate-400" />
                                                    <span className="font-medium">Collaboration_Agreement.pdf</span>
                                                </div>
                                                <button className="text-[11px] font-bold text-purple-400 uppercase tracking-widest hover:text-purple-300">Download DOCX</button>
                                            </div>
                                            <div className="aspect-[4/5] bg-[#1a1a1f] p-8 m-4 rounded-lg flex items-center justify-center border border-white/5">
                                                <div className="text-center">
                                                    <Lock className="w-8 h-8 text-slate-700 mx-auto mb-4" />
                                                    <p className="text-slate-500 text-sm">Agreement Preview Secured</p>
                                                </div>
                                            </div>
                                            <div className="p-6 bg-slate-800/50 flex items-center justify-between">
                                                <p className="text-xs text-slate-400">Version 3.0 • Generated {new Date().toLocaleDateString()}</p>
                                                <button
                                                    onClick={() => navigate(`/contract-ready/${token}`)}
                                                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-xs font-bold rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all"
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
                            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    Safety Features
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Escrow Protection</span>
                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">Enabled</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">AI Contract Audit</span>
                                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">Verified</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Liability Shield</span>
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded border border-white/10 uppercase">Pending Signature</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-900/40 border border-white/5 rounded-xl p-6">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Calendar className="w-3 h-3" />
                                    Timeline
                                </h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Submission Date</span>
                                        <span className="text-sm text-slate-200">{new Date(collabRequest?.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Intake Target</span>
                                        <span className="text-sm text-slate-200">{collabRequest?.deadline || 'Flexible'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-slate-400">Est. Completion</span>
                                        <span className="text-sm text-slate-200">TBD</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Activity Ledger */}
                    <div className="space-y-6">
                        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-purple-500" />
                                    Activity Ledger
                                </h3>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 border border-white/5 px-2 py-0.5 rounded uppercase tracking-widest">Global Audit</span>
                            </div>

                            <div className="relative space-y-8 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/5">
                                {/* Proposal Submission (Static for now since it might not be in logs) */}
                                <div className="relative pl-7 group">
                                    <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-emerald-500/20 border-2 border-emerald-500 z-10" />
                                    <div>
                                        <p className="text-xs font-semibold text-white">Proposal Submitted</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{new Date(collabRequest?.created_at).toLocaleString()}</p>
                                        <p className="text-xs text-slate-400 mt-2 p-2 rounded bg-white/[0.03] border border-white/5 italic">"Initial brief for Summer Campaign sent to creator profile."</p>
                                    </div>
                                </div>

                                {/* Audit Logs from DB */}
                                {(activity || []).map((log: any) => (
                                    <div key={log.id} className="relative pl-7 group">
                                        <div className="absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full bg-purple-500/20 border-2 border-purple-500 z-10" />
                                        <div>
                                            <p className="text-xs font-semibold text-white">{log.event.replace(/_/g, ' ')}</p>
                                            <p className="text-[11px] text-slate-500 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                                            {log.metadata?.message && (
                                                <p className="text-xs text-slate-400 mt-2 p-2 rounded bg-white/[0.03] border border-white/5 italic">"{log.metadata.message}"</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Loading state indicator for future logs */}
                                <div className="relative pl-7 text-[11px] text-slate-600 font-medium italic">
                                    Awaiting next protocol event...
                                </div>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-purple-500/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-purple-400" />
                                <h4 className="text-sm font-semibold text-white">Creator Armour Security</h4>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                All transitions in the console are cryptographically timestamped and logged.
                                Funds are only released once milestones are verified by our content protocol.
                            </p>
                            <button className="mt-4 text-[11px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 hover:text-purple-300">
                                Learn more about protection
                                <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="mt-auto border-t border-white/5 py-8">
                <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-4">
                        <span>© 2025 Creator Armour</span>
                        <span className="w-1 h-1 rounded-full bg-slate-800" />
                        <a href="#" className="hover:text-white transition-colors">Legal Framework</a>
                        <a href="#" className="hover:text-white transition-colors">Audit Integrity</a>
                    </div>
                    <div className="flex items-center gap-2">
                        <Lock className="w-3 h-3" />
                        End-to-End Encrypted Console
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default BrandDealConsole;
