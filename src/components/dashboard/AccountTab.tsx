import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheck, ChevronRight, Link2, Landmark, 
    Bell, User, Sun, Moon, LogOut, CheckCircle2,
    ExternalLink, Trash2, MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { withCacheBuster } from '@/lib/utils/image';
import { ImageWithPlaceholder } from '../ui/ImageWithPlaceholder';

interface AccountTabProps {
    isDark: boolean;
    textColor: string;
    secondaryTextColor: string;
    profile: any;
    username: string;
    avatarUrl: string;
    avatarFallbackUrl: string;
    avatarCacheKey?: string | number | null;
    isPushSubscribed: boolean;
    setActiveSettingsPage: (page: string | null) => void;
    setActiveTab: (tab: string) => void;
    triggerHaptic: () => void;
}

export const AccountTab = React.memo(({
    isDark,
    textColor,
    secondaryTextColor,
    profile,
    username,
    avatarUrl,
    avatarFallbackUrl,
    avatarCacheKey,
    isPushSubscribed,
    setActiveSettingsPage,
    setActiveTab,
    triggerHaptic
}: AccountTabProps) => {
    const navigate = useNavigate();
    const formatCompactNumber = (value: any) => {
        if (value === undefined || value === null || value === '') return '—';
        const num = Number(value);
        if (isNaN(num)) return String(value);
        if (num === 0) return '0';
        return new Intl.NumberFormat('en-US', {
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(num);
    };

    const followersCount = 
        profile?.instagram_followers ||
        profile?.followers_count ||
        profile?.followers ||
        profile?.follower_range ||
        0;

    const responseHours = Number(
        profile?.collab_response_hours_override ??
        profile?.response_hours ??
        0
    );

    const responseLabel = Number.isFinite(responseHours) && responseHours > 0
        ? `${Math.round(responseHours)}h`
        : responseHours === 0 ? 'Instant' : '—';
    const profileAvatarSrc = withCacheBuster(avatarUrl, avatarCacheKey, { width: 128, height: 128 }) || avatarUrl || avatarFallbackUrl;

    return (
        <motion.div 
            key="settings-main" 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, x: -20 }} 
            className={cn(
                "w-full px-5 pt-8 pb-32 relative",
                isDark ? "bg-transparent" : "bg-slate-50"
            )}
        >
            {/* Header */}
            <div className="mb-8 relative z-10">
                <h1 className={cn("text-4xl font-black italic uppercase tracking-tighter", isDark ? "text-white" : "text-slate-900")}>Account</h1>
                <p className={cn("text-[11px] font-black uppercase tracking-[0.2em] mt-1.5 opacity-40 leading-tight", textColor)}>Manage your professional identity</p>
            </div>

            {/* Profile Hero Card */}
            <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => { triggerHaptic(); setActiveSettingsPage('personal'); }}
                className={cn(
                    "p-5 rounded-[2rem] border mb-10 flex flex-col gap-6 cursor-pointer group transition-all duration-300 relative z-10",
                    isDark ? "bg-[#0B1324] border-white/5 shadow-2xl" : "bg-white border-slate-200 shadow-xl shadow-slate-200/40"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <ImageWithPlaceholder
                            src={profileAvatarSrc}
                            alt="avatar"
                            fallback={avatarFallbackUrl}
                            className={cn(
                                "w-14 h-14 rounded-full ring-2",
                                isDark ? "ring-white/10" : "ring-green-100 shadow-sm"
                            )}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className={cn("text-[20px] font-black tracking-tight", isDark ? "text-white" : "text-slate-900")}>
                                {profile?.full_name || profile?.first_name || username || 'Creator'}
                            </h2>
                            <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                isDark ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-600 border-blue-100"
                            )}>Verified</span>
                        </div>
                        <p className={cn("text-sm font-medium", isDark ? "text-slate-400" : "text-slate-500")}>@{username || 'creator'}</p>
                    </div>
                    <ChevronRight className={cn("w-5 h-5 transition-transform group-hover:translate-x-1", isDark ? "text-white/20" : "text-slate-300")} />
                </div>

                <div className={cn("h-[1px] w-full", isDark ? "bg-white/10" : "bg-slate-100")} />

                <div className="flex items-center justify-between px-2">
                    <div className="text-center">
                        <p className={cn("text-2xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                            {formatCompactNumber(followersCount)}
                        </p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", isDark ? "text-slate-400" : "text-slate-500")}>Followers</p>
                    </div>
                    <div className={cn("w-[1px] h-8", isDark ? "bg-white/10" : "bg-slate-100")} />
                    <div className="text-center">
                        <p className={cn("text-2xl font-black tracking-tighter", isDark ? "text-white" : "text-slate-900")}>
                            {responseLabel}
                        </p>
                        <p className={cn("text-[10px] font-black uppercase tracking-widest opacity-40", isDark ? "text-slate-400" : "text-slate-500")}>Response</p>
                    </div>
                </div>
            </motion.div>

            {/* Business Priority Section */}
            <div className="mb-10 relative z-10">
                <h4 className={cn("text-xs font-bold uppercase tracking-[0.2em] mb-4 px-1", isDark ? "text-slate-400" : "text-slate-400")}>Business Identity</h4>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { 
                            id: 'collab-link', 
                            icon: <Link2 className="w-5 h-5" />, 
                            label: 'Collab Page', 
                            status: 'Live', 
                            accent: isDark ? 'text-green-400' : 'text-emerald-600',
                            bgAccent: isDark ? 'bg-green-500/10' : 'bg-emerald-50',
                            onClick: () => setActiveSettingsPage('collab-link')
                        },
                        { 
                            id: 'payments', 
                            icon: <Landmark className="w-5 h-5" />, 
                            label: 'Payments', 
                            status: 'UPI Linked', 
                            accent: isDark ? 'text-blue-400' : 'text-blue-600',
                            bgAccent: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
                            onClick: () => { setActiveTab('payments'); triggerHaptic(); }
                        },
                        { 
                            id: 'personal', 
                            icon: <User className="w-5 h-5" />, 
                            label: 'Identity', 
                            status: 'Verified', 
                            accent: isDark ? 'text-purple-400' : 'text-purple-600',
                            bgAccent: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
                            onClick: () => setActiveSettingsPage('personal')
                        },
                        { 
                            id: 'notifications', 
                            icon: <Bell className="w-5 h-5" />, 
                            label: 'Alerts', 
                            status: isPushSubscribed ? 'On' : 'Off', 
                            accent: isPushSubscribed ? (isDark ? 'text-orange-400' : 'text-orange-600') : 'text-slate-500',
                            bgAccent: isPushSubscribed ? (isDark ? 'bg-orange-500/10' : 'bg-orange-50') : (isDark ? 'bg-white/5' : 'bg-slate-50'),
                            onClick: () => setActiveSettingsPage('notifications')
                        },
                    ].map((item) => (
                        <motion.button 
                            key={item.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={item.onClick}
                            className={cn(
                                "p-4 rounded-3xl border text-left flex flex-col gap-4 transition-all duration-200",
                                isDark 
                                    ? "bg-[#0B1324] border-white/5 hover:bg-white/5" 
                                    : "bg-white border-slate-200 shadow-sm hover:bg-slate-50"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm",
                                item.bgAccent,
                                item.accent
                            )}>
                                {item.icon}
                            </div>
                            <div>
                                <p className={cn("text-[15px] font-bold", isDark ? "text-white" : "text-slate-900")}>{item.label}</p>
                                <p className={cn("text-[11px] font-bold uppercase tracking-wider mt-1", item.accent)}>
                                    {item.status}
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Preferences */}
            <div className="mb-10 relative z-10">
                <h4 className={cn("text-xs font-bold uppercase tracking-[0.2em] mb-4 px-1", isDark ? "text-slate-400" : "text-slate-400")}>Legal Support</h4>
                <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        triggerHaptic();
                        window.open(`https://wa.me/916207479248?text=I%20need%20help%20with%20a%20legal%20issue`, '_blank');
                    }}
                    className={cn(
                        "w-full p-5 rounded-[2rem] border flex items-center justify-between transition-all relative overflow-hidden group",
                        isDark ? "bg-[#0B1324] border-white/5" : "bg-white border-slate-200 shadow-sm"
                    )}
                >
                    <div className="flex items-center gap-4 relative z-10">
                        <div className={cn(
                            "w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500"
                        )}>
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className={cn("text-[15px] font-black", isDark ? "text-white" : "text-slate-900")}>Contact Lawyer</p>
                            <p className={cn("text-xs font-medium opacity-40", textColor)}>Direct support via WhatsApp</p>
                        </div>
                    </div>
                    <ChevronRight className={cn("w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity relative z-10", isDark ? "text-white" : "text-slate-400")} />
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 translate-x-[-100%] group-hover:translate-x-[0%] transition-transform duration-500" />
                </motion.button>
            </div>

            {/* Preferences */}
            <div className="mb-12 relative z-10">
                <h4 className={cn("text-xs font-bold uppercase tracking-[0.2em] mb-4 px-1", isDark ? "text-slate-400" : "text-slate-400")}>System & Privacy</h4>
                <div className={cn(
                    "rounded-[2rem] border overflow-hidden",
                    isDark ? "bg-[#0B1324] border-white/5 divide-y divide-white/10" : "bg-white border-slate-200 shadow-sm divide-y divide-slate-100"
                )}>
                    <button 
                        onClick={() => { triggerHaptic(); setActiveSettingsPage('verification'); }}
                        className="w-full p-5 flex items-center justify-between active:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center",
                                isDark ? "bg-white/5 text-slate-300" : "bg-slate-50 text-slate-600"
                            )}>
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className={cn("text-[15px] font-bold", isDark ? "text-white" : "text-slate-900")}>Armour Verification</p>
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                    isDark ? "bg-green-500/10 text-green-400 border-green-500/10" : "bg-emerald-50 text-emerald-600 border-green-100"
                                )}>Protected</span>
                            </div>
                        </div>
                        <ChevronRight className={cn("w-5 h-5", isDark ? "text-white/20" : "text-slate-300")} />
                    </button>

                    <button 
                        onClick={() => { triggerHaptic(); setActiveSettingsPage('dark-mode'); }}
                        className="w-full p-5 flex items-center justify-between active:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center",
                                isDark ? "bg-white/5 text-slate-300" : "bg-slate-50 text-slate-600"
                            )}>
                                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </div>
                            <div className="text-left">
                                <p className={cn("text-[15px] font-bold", isDark ? "text-white" : "text-slate-900")}>Visual Theme</p>
                                <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-400")}>{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                            </div>
                        </div>
                        {/* Custom ToggleSwitch Style Switch */}
                        <div className={cn(
                            "w-10 h-6 rounded-full relative transition-all duration-300 p-1 flex items-center",
                            isDark ? "bg-blue-500 shadow-inner" : "bg-slate-200"
                        )}>
                            <motion.div 
                                animate={{ x: isDark ? 16 : 0 }}
                                className="w-4 h-4 bg-white rounded-full shadow-md"
                            />
                        </div>
                    </button>
                    
                    <button 
                        onClick={() => { triggerHaptic(); setActiveSettingsPage('personal'); }}
                        className="w-full p-5 flex items-center justify-between active:bg-white/5 transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center",
                                isDark ? "bg-white/5 text-slate-300" : "bg-slate-50 text-slate-600"
                            )}>
                                <ExternalLink className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className={cn("text-[15px] font-bold", isDark ? "text-white" : "text-slate-900")}>Privacy Policy</p>
                                <p className={cn("text-xs font-medium", isDark ? "text-slate-400" : "text-slate-400")}>Terms & Data</p>
                            </div>
                        </div>
                        <ChevronRight className={cn("w-5 h-5", isDark ? "text-white/20" : "text-slate-300")} />
                    </button>
                </div>
            </div>

            {/* Logout & Deletion */}
            <div className="flex flex-col items-center gap-4 relative z-10">
                <button 
                    onClick={() => { triggerHaptic(); setActiveSettingsPage('logout'); }}
                    className={cn(
                        "w-full flex items-center justify-center gap-2 font-bold text-sm active:scale-95 transition-all py-4 px-8 rounded-full",
                        isDark ? "text-red-400 bg-red-500/5 hover:bg-red-500/10" : "text-red-500 bg-red-50 hover:bg-red-100"
                    )}
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out Account
                </button>

                <button 
                    onClick={() => { triggerHaptic(); navigate('/delete-account'); }}
                    className={cn(
                        "text-[11px] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity flex items-center gap-2 py-2 px-4",
                        isDark ? "text-red-400" : "text-red-600"
                    )}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete My Account
                </button>
            </div>
        </motion.div>
    );
});

AccountTab.displayName = 'AccountTab';
