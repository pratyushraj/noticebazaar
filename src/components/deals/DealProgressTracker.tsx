import React from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle, FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionLog, ActionLogEntry } from './ActionLog';

interface DealProgressTrackerProps {
    deal: any;
    actionLogs: ActionLogEntry[];
}

const TRACKER_STEPS = [
    { id: 'offer', label: 'Offer Sent' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'locked', label: 'Deal Locked' },
    { id: 'production', label: 'Production' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'approved', label: 'Approved' },
    { id: 'completed', label: 'Completed' },
];

export const DealProgressTracker: React.FC<DealProgressTrackerProps> = ({ deal, actionLogs }) => {
    if (!deal) return null;

    // Determine current step index based on status and progress
    const statusLower = (deal.status || '').toLowerCase();
    const progress = deal.progress_percentage || 0;

    let currentStepIndex = 0;

    if (progress >= 100 || statusLower.includes('completed')) {
        currentStepIndex = 6; // Completed
    } else if (statusLower.includes('approved') || statusLower.includes('payment pending')) {
        currentStepIndex = 5; // Approved
    } else if (progress >= 95 || statusLower.includes('content delivered') || statusLower.includes('submitted')) {
        currentStepIndex = 4; // Submitted
    } else if (progress >= 85 || statusLower.includes('making') || statusLower.includes('production')) {
        currentStepIndex = 3; // Production
    } else if (progress >= 60 || statusLower.includes('live') || statusLower.includes('executed') || statusLower.includes('brand_signed')) {
        currentStepIndex = 2; // Locked
    } else if (progress >= 40 || statusLower.includes('contract_ready') || statusLower.includes('review')) {
        currentStepIndex = 1; // Accepted
    } else {
        currentStepIndex = 0; // Offer Sent
    }

    // Calculate deadline text
    let deadlineText = '';
    let isDeadlineUrgent = false;

    if (deal.due_date && currentStepIndex < 6) {
        const dueDate = new Date(deal.due_date);
        const today = new Date();
        // Normalize to midnight
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            deadlineText = `Overdue by ${Math.abs(diffDays)} days`;
            isDeadlineUrgent = true;
        } else if (diffDays === 0) {
            deadlineText = 'Deadline Today';
            isDeadlineUrgent = true;
        } else if (diffDays === 1) {
            deadlineText = 'Deadline Tomorrow';
            isDeadlineUrgent = true;
        } else {
            deadlineText = `Delivery in ${diffDays} days`;
        }
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                        Deal Progress
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Track collaboration milestones and deadlines.
                    </p>
                </div>

                {deadlineText && currentStepIndex >= 2 && currentStepIndex < 6 && (
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border",
                        isDeadlineUrgent
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    )}>
                        {isDeadlineUrgent ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {deadlineText}
                    </div>
                )}
            </div>

            {/* Horizontal Timeline */}
            <div className="relative mb-12 overflow-x-auto pb-4 hide-scrollbar">
                <div className="flex items-center justify-between min-w-[600px] relative px-2">
                    {/* Connecting Line (Background) */}
                    <div className="absolute left-6 right-6 top-4 h-1 bg-slate-800 -z-10 rounded-full" />

                    {/* Connecting Line (Active) */}
                    <div
                        className="absolute left-6 top-4 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400 -z-10 rounded-full transition-all duration-700"
                        style={{ width: `calc(${(currentStepIndex / (TRACKER_STEPS.length - 1)) * 100}% - ${currentStepIndex === 0 ? '0px' : '30px'})` }}
                    />

                    {TRACKER_STEPS.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        const isPending = index > currentStepIndex;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative gap-3 group">
                                {/* Node */}
                                <div className={cn(
                                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 border-2 z-10",
                                    isCompleted ? "bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-white" :
                                        isCurrent ? "bg-slate-800 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] text-emerald-400" :
                                            "bg-slate-900 border-slate-700 text-slate-500"
                                )}>
                                    {isCompleted ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-bold">{index + 1}</span>
                                    )}
                                </div>

                                {/* Label */}
                                <span className={cn(
                                    "text-xs font-semibold whitespace-nowrap transition-colors",
                                    isCompleted ? "text-slate-300" :
                                        isCurrent ? "text-emerald-400" :
                                            "text-slate-500"
                                )}>
                                    {step.label}
                                </span>

                                {/* Pending State Next Step Pointer (Only for Active Step) */}
                                {isCurrent && index < TRACKER_STEPS.length - 1 && (
                                    <div className="absolute -bottom-8 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap animate-pulse">
                                        Next Step
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Embedded Activity Log */}
            <div className="border-t border-slate-800 pt-6 mt-6">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Deal History Log
                </h3>

                <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <ActionLog entries={actionLogs} />
                </div>
            </div>
        </div>
    );
};
