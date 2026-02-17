// Creator Sign Page - Magic Link Contract Signing (No Login Required)
// Validates token, shows contract, handles OTP verification and signing

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    XCircle,
    Loader2,
    FileText,
    Lock,
    ShieldCheck,
    Mail,
    Fingerprint,
    X
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';
import { getApiBaseUrl } from '@/lib/utils/api';

const CreatorSignPage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [dealInfo, setDealInfo] = useState<any>(null);
    const [creatorEmail, setCreatorEmail] = useState<string>('');

    // OTP State
    const [showOTPModal, setShowOTPModal] = useState(false);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isSendingOTP, setIsSendingOTP] = useState(false);
    const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
    const [otpResendCooldown, setOtpResendCooldown] = useState(0);
    const [isOTPVerified, setIsOTPVerified] = useState(false);
    const [otpVerifiedAt, setOtpVerifiedAt] = useState<string | null>(null);

    // Signing State
    const [isSigning, setIsSigning] = useState(false);
    const [isAuthorizedToSign, setIsAuthorizedToSign] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // Load token and deal info
    useEffect(() => {
        const loadTokenInfo = async () => {
            if (!token) {
                setLoadError('Invalid signing link');
                setIsLoading(false);
                return;
            }

            try {
                const apiBaseUrl = getApiBaseUrl();

                const response = await fetch(`${apiBaseUrl}/api/creator-sign/${token}`);
                const data = await response.json();

                if (!response.ok || !data.success) {
                    throw new Error(data.error || 'Invalid signing link');
                }

                setDealInfo(data.dealData);
                setCreatorEmail(data.tokenData.creator_email);
            } catch (error: any) {
                console.error('[CreatorSignPage] Load error:', error);
                setLoadError(error.message || 'Failed to load signing information');
            } finally {
                setIsLoading(false);
            }
        };

        loadTokenInfo();
    }, [token]);

    // OTP countdown
    useEffect(() => {
        if (otpResendCooldown > 0) {
            const timer = setTimeout(() => {
                setOtpResendCooldown(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [otpResendCooldown]);

    // Auto-focus first OTP input
    useEffect(() => {
        if (showOTPModal) {
            setTimeout(() => {
                document.getElementById('otp-input-0')?.focus();
            }, 100);
        }
    }, [showOTPModal]);

    // Send OTP
    const sendOTP = async () => {
        if (!token || !creatorEmail) {
            toast.error('Invalid signing link');
            return;
        }

        setIsSendingOTP(true);

        try {
            const apiBaseUrl =
                import.meta.env.VITE_API_BASE_URL ||
                (window.location.origin.includes('creatorarmour.com')
                    ? 'https://api.creatorarmour.com'
                    : getApiBaseUrl());

            const response = await fetch(`${apiBaseUrl}/api/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, email: creatorEmail }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                toast.error(data.error || 'Failed to send OTP');
                return;
            }

            toast.success('OTP sent to your email!');
            setShowOTPModal(true);
            setOtpResendCooldown(30);
        } catch (error: any) {
            console.error('[CreatorSignPage] OTP send error:', error);
            toast.error('Failed to send OTP');
        } finally {
            setIsSendingOTP(false);
        }
    };

    // Verify OTP
    const verifyOTP = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Please enter a 6-digit OTP');
            return;
        }

        setIsVerifyingOTP(true);

        try {
            const apiBaseUrl =
                import.meta.env.VITE_API_BASE_URL ||
                (window.location.origin.includes('creatorarmour.com')
                    ? 'https://api.creatorarmour.com'
                    : getApiBaseUrl());

            const response = await fetch(`${apiBaseUrl}/api/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, otp: otpString }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                toast.error(data.error || 'Invalid OTP');
                return;
            }

            toast.success('Identity verified!');
            setIsOTPVerified(true);
            setOtpVerifiedAt(new Date().toISOString());
            setShowOTPModal(false);
            triggerHaptic(HapticPatterns.success);
        } catch (error: any) {
            console.error('[CreatorSignPage] OTP verify error:', error);
            toast.error('Failed to verify OTP');
        } finally {
            setIsVerifyingOTP(false);
        }
    };

    // Handle OTP input
    const handleOTPChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-input-${index + 1}`)?.focus();
        }
    };

    const handleOTPKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-input-${index - 1}`)?.focus();
        }
    };

    // Sign Contract
    const handleSign = async () => {
        if (!isOTPVerified) {
            toast.error('Please verify your identity first');
            setShowOTPModal(true);
            return;
        }

        if (!isAuthorizedToSign) {
            toast.error('Please confirm you are authorized to sign');
            return;
        }

        setIsSigning(true);

        try {
            const apiBaseUrl =
                import.meta.env.VITE_API_BASE_URL ||
                (window.location.origin.includes('creatorarmour.com')
                    ? 'https://api.creatorarmour.com'
                    : getApiBaseUrl());

            const response = await fetch(`${apiBaseUrl}/api/creator-sign/${token}/sign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    signerName: dealInfo.creator_name || 'Creator',
                    signerEmail: creatorEmail,
                    otpVerified: true,
                    otpVerifiedAt: otpVerifiedAt || new Date().toISOString(),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                toast.error(data.error || 'Failed to sign contract');
                return;
            }

            toast.success('Contract signed successfully!');
            triggerHaptic(HapticPatterns.success);
            setIsSubmitted(true);
        } catch (error: any) {
            console.error('[CreatorSignPage] Sign error:', error);
            toast.error('Failed to sign contract');
            triggerHaptic(HapticPatterns.error);
        } finally {
            setIsSigning(false);
        }
    };

    if (isLoading) {
        return (
            <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-4" />
                    <p className="text-white/70">Loading...</p>
                </div>
            </div>
        );
    }

    if (loadError || !dealInfo) {
        return (
            <div className="nb-screen-height bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Invalid Signing Link</h1>
                    <p className="text-white/70">{loadError || 'This link is invalid or has expired.'}</p>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-[#111114] border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-green-500" />
                    <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Contract Signed Successfully!</h1>
                    <p className="text-white/70 mb-2 leading-relaxed">
                        The collaboration is now legally active. Both parties will receive confirmation emails.
                    </p>
                    <p className="text-white/50 text-sm mb-8 leading-relaxed">
                        Any changes to these terms now require a new agreement.
                    </p>
                    <button
                        onClick={() => window.close()}
                        className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all">
                        Close Window
                    </button>
                </motion.div>
            </div>
        );
    }

    // Main signing page UI (similar to ContractReadyPage but simplified)
    return (
        <div className="min-h-screen bg-[#020617] text-white pb-12">
            {/* Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[25%] -left-[10%] w-[70%] h-[70%] bg-purple-600/8 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] -right-[5%] w-[50%] h-[50%] bg-blue-600/8 blur-[100px] rounded-full" />
            </div>

            <div className="relative max-w-2xl mx-auto px-4 py-12 md:py-16 space-y-12">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">Secure Digital Signature</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                        Creator <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Armour</span>
                    </h1>
                    <h2 className="text-lg md:text-xl font-medium text-white/90 mb-4">
                        Sign Collaboration Agreement
                    </h2>
                </motion.div>

                {/* Deal Summary Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="ios-card">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-purple-400" />
                        </div>
                        <h3 className="font-bold text-white tracking-tight">Agreement Summary</h3>
                    </div>

                    {dealInfo.deal_amount && (
                        <div className="flex justify-between items-center py-4 border-b border-white/5">
                            <div>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-0.5">Compensation</p>
                                <p className="text-white/70 text-xs leading-relaxed">Total amount for deliverables</p>
                            </div>
                            <span className="font-black text-green-400 text-xl tracking-tight">
                                ₹{Number(dealInfo.deal_amount).toLocaleString('en-IN')}
                            </span>
                        </div>
                    )}

                    <div className="py-4">
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Brand</p>
                        <p className="text-white font-semibold leading-relaxed">{dealInfo.brand_name}</p>
                    </div>
                </motion.div>

                {/* Identity Verification Section */}
                {!isOTPVerified && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="ios-card">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                                <Fingerprint className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Identity Verification</h3>
                                <p className="text-white/50 text-xs">A one-time password is required to legally bind this agreement to your email.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-white/40 ml-1">Your Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-white/20" />
                                    </div>
                                    <input
                                        type="email"
                                        value={creatorEmail}
                                        disabled
                                        className="w-full pl-11 pr-4 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-white/20 text-sm opacity-60 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={sendOTP}
                                disabled={isSendingOTP || otpResendCooldown > 0}
                                className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 rounded-2xl text-white font-bold transition-all shadow-lg shadow-purple-500/5 flex items-center justify-center gap-2">
                                {isSendingOTP ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : otpResendCooldown > 0 ? (
                                    <span>Resend in {otpResendCooldown}s</span>
                                ) : (
                                    <span>Begin Verification</span>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Signing Section (after OTP verified) */}
                {isOTPVerified && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ios-card bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/30">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 text-green-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Final Execution</h3>
                                <p className="text-green-400/60 text-xs font-medium uppercase tracking-widest">Identity Verified • Ready to Sign</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <label className="flex items-start gap-4 cursor-pointer p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={isAuthorizedToSign}
                                    onChange={(e) => setIsAuthorizedToSign(e.target.checked)}
                                    className="w-5 h-5 rounded-md border-white/20 bg-white/10 text-green-500 focus:ring-0 focus:ring-offset-0 mt-1"
                                />
                                <span className="text-xs text-white/70 leading-relaxed font-medium">
                                    I confirm that I am authorized to sign this collaboration agreement and I legally accept its terms.
                                </span>
                            </label>

                            <button
                                onClick={handleSign}
                                disabled={isSigning || !isAuthorizedToSign}
                                className="w-full h-16 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/10 rounded-2xl text-white font-bold transition-all shadow-lg shadow-purple-500/5 flex items-center justify-center gap-3 text-lg">
                                {isSigning ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Fingerprint className="w-6 h-6" />
                                        Execute Agreement
                                    </>
                                )}
                            </button>

                            <div className="flex items-center justify-center gap-2 text-[10px] text-white/30 font-bold uppercase tracking-tighter">
                                <Lock className="w-3 h-3" />
                                Legally binding • This link is unique to you
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* OTP Modal */}
                {showOTPModal && (
                    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="bg-[#0f172a] border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500" />

                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white tracking-tight">Security Code</h3>
                                </div>
                                <button
                                    onClick={() => setShowOTPModal(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-white/50 text-sm mb-8 leading-relaxed">
                                Verification code sent to <span className="text-white font-semibold">{creatorEmail}</span>
                            </p>

                            <div className="flex gap-2.5 mb-2 justify-center">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-input-${index}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOTPChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                                        className="w-11 h-14 text-center text-2xl font-black bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all flex-shrink-0"
                                    />
                                ))}
                            </div>

                            <p className="text-center text-[10px] text-white/30 font-medium mb-8">
                                No agreement will be executed without your explicit confirmation.
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={verifyOTP}
                                    disabled={isVerifyingOTP || otp.join('').length !== 6}
                                    className="w-full h-14 bg-white text-black hover:bg-white/90 disabled:bg-white/10 disabled:text-white/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2">
                                    {isVerifyingOTP ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Verify Identity
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={sendOTP}
                                    disabled={isSendingOTP || otpResendCooldown > 0}
                                    className="w-full py-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-purple-400 disabled:hover:text-white/30 transition-colors">
                                    {otpResendCooldown > 0 ? `Resend in ${otpResendCooldown}s` : 'Request New Code'}
                                </button>
                            </div>

                            <div className="mt-6 pt-4 border-t border-white/5 text-center">
                                <p className="text-[10px] text-emerald-500/60 font-medium flex items-center justify-center gap-1.5">
                                    <Lock className="w-3 h-3" />
                                    Once signed, contract terms are locked and cannot be edited.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreatorSignPage;
