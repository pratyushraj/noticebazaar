import React from 'react';
import { motion } from 'framer-motion';
import { 
    ShieldCheck, ChevronRight, Link2, Landmark, TrendingUp, 
    Bell, User, Briefcase, Sun, Moon, LogOut 
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface AccountTabProps {
    isDark: boolean;
    textColor: string;
    secondaryTextColor: string;
    profile: any;
    username: string;
    avatarUrl: string;
    avatarFallbackUrl: string;
    isPushSubscribed: boolean;
    setActiveSettingsPage: (page: string | null) => void;
    setActiveTab: (tab: string) => void;
    triggerHaptic: () => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({
    isDark,
    textColor,
    secondaryTextColor,
    profile,
    username,
    avatarUrl,
    avatarFallbackUrl,
    isPushSubscribed,
    setActiveSettingsPage,
    setActiveTab,
    triggerHaptic
}) => {
    return (
        <motion.div 
            key="settings-main" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, x: -20 }} 
            className="w-full"
        >
            {/* ── HEADER ── */}
            <div className="px-5 pt-14 pb-6">
                <h1 className={cn("text-[30px] font-black tracking-tight", isDark ? "text-white" : "text-[#111827]")}>Account</h1>
            </div>

            <div className="space-y-4 pb-32">

                {/* ── PROFILE CARD ── */}
                <div className="px-5">
                    <button type="button" onClick={() => { triggerHaptic(); setActiveSettingsPage('personal'); }}
                        className={cn("w-full p-4 rounded-2xl border flex items-center gap-4 active:scale-[0.98] transition-all", isDark ? "bg-card border-border" : "bg-white border-[#E5E7EB] shadow-sm")}>
                        <img src={avatarUrl} alt="avatar" className="w-14 h-14 rounded-full object-cover shrink-0"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).onerror = null; (e.currentTarget as HTMLImageElement).src = avatarFallbackUrl; }} />
                        <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className={cn("text-[17px] font-black tracking-tight", isDark ? "text-white" : "text-[#111827]")}>{profile?.first_name || username || 'Creator'}</span>
                                <ShieldCheck className="w-4 h-4 text-blue-500" />
                            </div>
                            <p className={cn("text-[13px] mt-0.5 opacity-50", textColor)}>@{username || 'creator'} · Tap to edit profile</p>
                        </div>
                        <ChevronRight className={cn("w-4 h-4 opacity-30 shrink-0", textColor)} />
                    </button>
                </div>

                {/* ── 2×2 QUICK TILES ── */}
                <div className="px-5">
                    <p className={cn("text-[11px] font-black uppercase tracking-widest mb-3 px-0.5 opacity-40", textColor)}>Quick Settings</p>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { icon: <Link2 className="w-5 h-5" />, label: 'Collab Page', sub: 'Packages & links', iconBg: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600', onClick: () => setActiveSettingsPage('collab-link') },
                            { icon: <Landmark className="w-5 h-5" />, label: 'Payments', sub: 'Bank & UPI', iconBg: isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-600', onClick: () => { setActiveTab('payments'); triggerHaptic(); } },
                            { icon: <Bell className="w-5 h-5" />, label: 'Alerts', sub: isPushSubscribed ? 'Enabled' : 'Push notifications', iconBg: isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600', onClick: () => setActiveSettingsPage('notifications') },
                            { icon: <User className="w-5 h-5" />, label: 'Identity', sub: 'Personal info', iconBg: isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600', onClick: () => setActiveSettingsPage('personal') },
                        ].map((t, idx) => (
                            <button key={idx} type="button"
                                onClick={t.onClick}
                                className={cn("flex flex-col items-start gap-3 p-4 rounded-2xl border text-left active:scale-[0.97] transition-all", isDark ? "bg-card border-border" : "bg-white border-[#E5E7EB] shadow-sm")}>
                                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", t.iconBg)}>{t.icon}</div>
                                <div>
                                    <p className={cn("text-[14px] font-black leading-tight", textColor)}>{t.label}</p>
                                    <p className={cn("text-[11px] mt-0.5 opacity-45", textColor)}>{t.sub}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── MORE LIST ── */}
                <div className="px-5">
                    <p className={cn("text-[11px] font-black uppercase tracking-widest mb-3 px-0.5 opacity-40", textColor)}>Preferences</p>
                    <div className={cn("rounded-2xl border overflow-hidden", isDark ? "bg-card border-border" : "bg-white border-[#E5E7EB] shadow-sm")}>
                        {[
                            { icon: <ShieldCheck className="w-4 h-4" />, iconBg: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600', label: 'Armour Verification', sub: 'Identity secured', page: 'verification' },
                            { icon: isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />, iconBg: isDark ? 'bg-slate-500/15 text-slate-400' : 'bg-slate-100 text-slate-600', label: 'Visual Theme', sub: isDark ? 'Dark Mode' : 'Light Mode', page: 'dark-mode' },
                        ].map((row, i, arr) => (
                            <button key={row.page} type="button"
                                onClick={() => { triggerHaptic(); setActiveSettingsPage(row.page); }}
                                className={cn("w-full flex items-center gap-3 px-4 py-3.5 active:opacity-60 transition-opacity", i < arr.length - 1 ? (isDark ? "border-b border-border" : "border-b border-[#F3F4F6]") : "")}>
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", row.iconBg)}>{row.icon}</div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className={cn("text-[14px] font-bold leading-tight", textColor)}>{row.label}</p>
                                    <p className={cn("text-[11px] opacity-40 mt-0.5", textColor)}>{row.sub}</p>
                                </div>
                                <ChevronRight className={cn("w-4 h-4 opacity-25 shrink-0", textColor)} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── LOGOUT ── */}
                <div className="px-5 pt-2">
                    <button type="button" onClick={() => { triggerHaptic(); setActiveSettingsPage('logout'); }}
                        className={cn("w-full py-4 rounded-2xl border font-bold text-[15px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all", isDark ? "bg-card border-border text-destructive" : "bg-white border-[#E5E7EB] text-destructive shadow-sm")}>
                        <LogOut className="w-4 h-4" />
                        Log Out
                    </button>
                </div>

            </div>
        </motion.div>
    );
};
