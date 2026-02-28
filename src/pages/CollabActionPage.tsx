
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Shield, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
// Remove Alert imports if they don't exist
// import { Alert, AlertDescription } from '@/components/ui/alert';

// Interface for API response
interface CollabRequest {
    id: string;
    brand_name: string;
    collab_type: 'paid' | 'barter' | 'hybrid' | 'both';
    deliverables: string[];
    budget_range?: string;
    exact_budget?: number;
    barter_value?: number;
    barter_description?: string;
    deadline?: string;
    campaign_description?: string;
    status: string;
}

export default function CollabActionPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<CollabRequest | null>(null);
    const [actionType, setActionType] = useState<'accept' | 'decline' | 'counter' | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Counter State
    const [counterBudget, setCounterBudget] = useState('');
    const [counterDeliverables, setCounterDeliverables] = useState('');
    const [counterTimeline, setCounterTimeline] = useState('');
    const [counterNotes, setCounterNotes] = useState('');
    const [suggestedRate, setSuggestedRate] = useState<number | null>(null);

    // Decline State
    const [declineReason, setDeclineReason] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid link. Token is missing.');
            setLoading(false);
            return;
        }

        const fetchDetails = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/collab-action/details?token=${token}`);
                const data = await res.json();

                if (data.success) {
                    setRequest(data.data);
                    setActionType(data.action); // 'accept', 'decline', 'counter'
                    setSuggestedRate(data.suggested_reel_rate || null);

                    if (data.status_message) {
                        setError(data.status_message);
                        setLoading(false);
                        return;
                    }

                    // Pre-fill counter fields with Smart Suggestions
                    if (data.data) {
                        const originalBudget = data.data.exact_budget || 0;
                        const creatorRate = data.suggested_reel_rate || 0;
                        const deliverables = data.data.deliverables || [];
                        const deadline = data.data.deadline;
                        const collabType = data.data.collab_type;

                        let suggestedBudget = originalBudget;
                        let suggestedDeliverables = [...deliverables];
                        let suggestedTimeline = deadline || '';
                        let suggestedNotes = '';

                        // 1. Budget Suggestion
                        if (collabType === 'paid' || collabType === 'both' || collabType === 'hybrid') {
                            if (originalBudget > 0 && creatorRate > 0 && originalBudget < creatorRate) {
                                suggestedBudget = Math.round(originalBudget * 1.2);
                            }
                        } else if (collabType === 'barter') {
                            const barterValue = data.data.barter_value || 0;
                            if (barterValue < 1000) {
                                suggestedNotes = "Suggesting an additional unit of the product due to low barter value.";
                            }
                        }

                        // 2. Deliverables Suggestion
                        if (deliverables.length > 2) {
                            suggestedDeliverables = deliverables.slice(0, -1);
                        }

                        // 3. Timeline Suggestion
                        const minDesiredDays = 10;
                        const tenDaysOut = new Date();
                        tenDaysOut.setDate(tenDaysOut.getDate() + minDesiredDays);
                        const tenDaysStr = tenDaysOut.toISOString().split('T')[0];

                        if (deadline) {
                            const deadlineDate = new Date(deadline);
                            const now = new Date();
                            const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays < minDesiredDays) {
                                suggestedTimeline = tenDaysStr;
                            }
                        } else {
                            suggestedTimeline = tenDaysStr;
                        }

                        // 4. Usage Rights
                        if (!suggestedNotes.includes("digital usage")) {
                            suggestedNotes += (suggestedNotes ? " " : "") + "Standard 3 months digital usage rights recommended.";
                        }

                        setCounterBudget(suggestedBudget.toString());
                        setCounterDeliverables(suggestedDeliverables.join('\n'));
                        setCounterTimeline(suggestedTimeline);
                        setCounterNotes(suggestedNotes);
                    }
                } else {
                    setError(data.error || 'Failed to load request details.');
                }
            } catch (err) {
                setError('Network error. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [token]);

    const handleConfirm = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/collab-action/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                toast.success('Deal Secured! Contract is being generated.');
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error('Failed to confirm deal.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDecline = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/collab-action/decline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, reason: declineReason })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                toast.success('Request Declined. Brand has been notified.');
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error('Failed to decline.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCounter = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/collab-action/counter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    counterBudget: parseFloat(counterBudget),
                    counterDeliverables: counterDeliverables.split('\n').filter((s: string) => s.trim()), // Simple split
                    counterTimeline,
                    notes: counterNotes
                })
            });
            const data = await res.json();
            if (data.success) {
                setSuccess(true);
                toast.success('Counter Proposal Sent. Brand will review your terms.');
            } else {
                toast.error(data.error);
            }
        } catch (err) {
            toast.error('Failed to send counter proposal.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-red-500 font-medium bg-white p-8 rounded-lg shadow-sm">{error}</div></div>;

    if (success) return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <Card className="w-full max-w-md text-center p-8 border-0 shadow-lg">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-3 text-gray-900">
                    {actionType === 'accept' ? 'Deal Secured!' : actionType === 'decline' ? 'Request Declined' : 'Proposal Sent'}
                </h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                    {actionType === 'accept' ? 'Your contract is being generated. You will receive an email shortly with the next steps.' :
                        actionType === 'decline' ? 'We have professionally notified the brand. You remain discoverable for future opportunities.' :
                            'The brand has been notified of your updated terms and will respond shortly.'}
                </p>
                <Button onClick={() => window.close()} variant="outline">Close Tab</Button>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-2xl mx-auto space-y-6">

                {/* Header Logo or branding could go here */}

                {/* You're Protected Card */}
                <Card className="border-l-4 border-l-purple-600 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-3 bg-purple-50/30 border-b border-purple-50">
                        <div className="flex items-center gap-2.5">
                            <div className="bg-purple-100 p-1.5 rounded-full">
                                <Shield className="w-5 h-5 text-purple-600" />
                            </div>
                            <CardTitle className="text-lg font-semibold text-gray-900">You're Protected</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <ul className="space-y-3 text-sm text-gray-700">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <span>Contract auto-generated instantly upon confirmation</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <span>Payments tracked & secure inside Creator Armour</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <span>Legal support available if any disputes arise</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                {/* Deal Summary */}
                <Card className="shadow-sm border-gray-200 overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="text-center text-sm font-semibold text-gray-500 uppercase tracking-widest">
                            Deal Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* 1. Deal Value (Top Highlight) */}
                        <div className="p-8 text-center bg-white border-b border-gray-50">
                            <Label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 block">
                                Deal Value
                            </Label>
                            <div className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-bold mb-4 border border-green-100">
                                {request?.collab_type === 'barter' ? 'Barter Deal' : 'Paid Collaboration'}
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
                                {request?.collab_type === 'barter'
                                    ? `🎁 Product worth ₹${request?.barter_value?.toLocaleString() || '—'}`
                                    : `💰 ₹${request?.exact_budget?.toLocaleString() || request?.budget_range} Collaboration`}
                            </h2>
                            <p className="text-sm font-medium text-purple-600 flex items-center justify-center gap-1.5">
                                <CheckCircle className="w-3.5 h-3.5" />
                                {request?.collab_type === 'barter' ? 'Product delivery tracked' : 'Payment protected via contract'}
                            </p>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* 2. Deliverables */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">You will create</span>
                                    <div className="h-px bg-gray-100 flex-1"></div>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {request?.deliverables && request.deliverables.length > 0 ? (
                                        request?.deliverables.map((d: string, i: number) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100/50 group hover:border-purple-100 hover:bg-white transition-all">
                                                <div className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400 group-hover:text-purple-500 group-hover:border-purple-200">
                                                    {i + 1}
                                                </div>
                                                <span className="text-gray-700 font-medium">{d}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-sm text-gray-500 italic py-2">No specific deliverables listed</p>
                                    )}
                                </div>
                            </div>

                            {/* 3. Timeline */}
                            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-orange-50/50 border border-orange-100/50">
                                <Label className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Timeline</Label>
                                <div className="flex items-center gap-2 text-orange-900 font-bold text-lg">
                                    <Clock className="w-5 h-5 opacity-70" />
                                    <span>Deadline: {request?.deadline || 'Flexible'}</span>
                                </div>
                            </div>

                            {/* 4. Brand Details (Smaller) */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brand Name</Label>
                                        <p className="text-sm font-bold text-gray-700">{request?.brand_name}</p>
                                    </div>
                                    {request?.campaign_description && (
                                        <div className="space-y-1">
                                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campaign Goal</Label>
                                            <p className="text-sm text-gray-600 line-clamp-2">{request.campaign_description}</p>
                                        </div>
                                    )}
                                </div>
                                {request?.barter_description && (
                                    <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                        <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 block">Notes on Product</Label>
                                        <p className="text-xs text-blue-800 leading-relaxed italic">"{request.barter_description}"</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Area */}
                {actionType === 'accept' && (
                    <div className="pt-2">
                        <Button
                            className="w-full text-lg py-6 bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all font-semibold"
                            onClick={handleConfirm}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Securing Deal...
                                </div>
                            ) : 'Confirm & Secure Deal'}
                        </Button>
                        <p className="text-center text-xs text-gray-500 mt-3">
                            By clicking confirm, you agree to the standard terms. A binding contract will be created.
                        </p>
                    </div>
                )}

                {actionType === 'counter' && (
                    <Card className="border-purple-200 shadow-md">
                        <CardHeader className="bg-purple-50 rounded-t-lg border-b border-purple-100">
                            <CardTitle className="text-purple-900">Adjust Terms</CardTitle>
                            <CardDescription className="text-purple-700">Adjust this collaboration to better fit your style</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {/* Smart Suggestions Callout */}
                            <div className="bg-green-50/50 border border-green-100 rounded-2xl p-5 mb-2">
                                <h3 className="text-sm font-bold text-green-800 flex items-center gap-2 mb-3">
                                    <Shield className="w-4 h-4" />
                                    Suggested creator-friendly terms
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                    <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-white/50 p-2 rounded-lg border border-green-100">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Budget: {request?.collab_type === 'barter' ? 'Product Barter' : `₹${parseInt(counterBudget || '0').toLocaleString('en-IN')}`}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-white/50 p-2 rounded-lg border border-green-100">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Timeline: {counterTimeline}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs font-semibold text-green-700 bg-white/50 p-2 rounded-lg border border-green-100">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>Deliverables: {counterDeliverables.split('\n').filter(s => s.trim()).length} Item(s)</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-green-700/80 leading-relaxed font-medium">
                                    "We've suggested terms that protect your time and effort. You can modify them before confirming."
                                </p>
                            </div>

                            <div className="bg-white rounded-xl p-4 border border-purple-100 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">
                                        {request?.collab_type === 'barter' ? 'Adjust Product Value / Quantity' : 'Adjust Budget (₹)'}
                                    </Label>
                                    <Input
                                        type="number"
                                        value={counterBudget}
                                        onChange={e => setCounterBudget(e.target.value)}
                                        placeholder={request?.collab_type === 'barter' ? "Amount you'd like to adjust to..." : "Enter your adjusted rate"}
                                        className="border-purple-100 focus:ring-purple-500"
                                    />
                                    {request?.collab_type !== 'barter' && (
                                        <p className="text-[10px] text-gray-500 italic">
                                            {suggestedRate ? (
                                                <>Suggested rate based on your profile is around ₹{suggestedRate.toLocaleString('en-IN')}.</>
                                            ) : (
                                                <>Typical rate for this scope is around ₹{(request?.exact_budget || 5000) * 1.2}. You can adjust if needed.</>
                                            )}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Adjust Deliverables</Label>
                                    <Textarea
                                        value={counterDeliverables}
                                        onChange={e => setCounterDeliverables(e.target.value)}
                                        rows={3}
                                        placeholder="List what you will provide..."
                                        className="border-purple-100 focus:ring-purple-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-gray-700">Adjust Timeline</Label>
                                    <Input
                                        type="text"
                                        value={counterTimeline}
                                        onChange={(e) => setCounterTimeline(e.target.value)}
                                        placeholder="e.g. 15 Feb 2026 or +2 days"
                                        className="border-purple-100 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-gray-700">Personal Note (Optional)</Label>
                                <Textarea
                                    value={counterNotes}
                                    onChange={e => setCounterNotes(e.target.value)}
                                    placeholder="E.g. Let me know if this works better for you!"
                                    className="border-purple-100 focus:ring-purple-500"
                                />
                            </div>

                            <Button
                                className="w-full bg-purple-600 hover:bg-purple-700 mt-2 py-6 text-lg font-semibold shadow-lg shadow-purple-200"
                                onClick={handleCounter}
                                disabled={submitting}
                            >
                                {submitting ? 'Sending Adjustments...' : 'Submit Adjustments'}
                            </Button>
                            <p className="text-center text-[10px] text-gray-400 italic">
                                The brand will be notified of these small adjustments.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {actionType === 'decline' && (
                    <Card className="border-red-100 shadow-md">
                        <CardHeader className="bg-red-50 rounded-t-lg border-b border-red-100">
                            <CardTitle className="text-red-700">Decline Request</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6">
                            <div className="space-y-2">
                                <Label>Reason for declining (Optional)</Label>
                                <Textarea
                                    value={declineReason}
                                    onChange={e => setDeclineReason(e.target.value)}
                                    placeholder="E.g. Budget too low, schedule conflict..."
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800">
                                <div className="flex gap-2">
                                    <div className="shrink-0 mt-0.5 text-blue-500">
                                        <Shield className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs leading-relaxed font-medium">
                                            The brand will be notified professionally. We frame it so you stay on their radar for future deals.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="destructive"
                                className="w-full py-6 text-lg font-semibold"
                                onClick={handleDecline}
                                disabled={submitting}
                            >
                                {submitting ? 'Declining...' : 'Decline Request'}
                            </Button>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
}
