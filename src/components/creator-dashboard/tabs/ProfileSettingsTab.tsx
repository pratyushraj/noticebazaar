import React from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Bell,
    ShieldCheck,
    Smartphone,
    LogOut,
    ChevronRight,
    Instagram,
    Landmark,
    MessageSquare,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ios, typography } from '@/lib/design-system';

interface ProfileSettingsTabProps {
    profile: any;
    onLogout: () => void;
}

const SettingsGroup = ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div className="space-y-2 mb-8">
        {title && (
            <p className="px-4 text-[11px] font-bold uppercase tracking-wider text-white/30">
                {title}
            </p>
        )}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
            {children}
        </div>
    </div>
);

const SettingsRow = ({
    icon: Icon,
    label,
    subtext,
    iconBg,
    onClick,
    rightElement
}: any) => (
    <div
        onClick={onClick}
        className="flex items-center gap-4 py-4 px-4 active:bg-white/5 transition-all cursor-pointer group"
    >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shadow-sm shrink-0", iconBg)}>
            <Icon size={18} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[15px] font-medium text-white leading-tight">{label}</p>
            {subtext && <p className="text-[12px] text-white/40 mt-0.5">{subtext}</p>}
        </div>
        {rightElement || <ChevronRight className="w-4 h-4 text-white/20" />}
    </div>
);

const ProfileSettingsTab = ({ profile, onLogout }: ProfileSettingsTabProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="pb-20"
        >
            {/* Profile Header */}
            <div className="flex flex-col items-center py-8">
                <div className="w-24 h-24 rounded-full border-2 border-blue-500/30 p-1 mb-4">
                    <img
                        src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.first_name || 'Creator'}`}
                        alt="Profile"
                        className="w-full h-full rounded-full object-cover"
                    />
                </div>
                <h2 className={typography.h2}>{profile?.first_name} {profile?.last_name}</h2>
                <p className="text-white/40 text-sm mt-1">{profile?.instagram_handle || 'Content Creator'}</p>
            </div>

            <SettingsGroup title="Account">
                <SettingsRow
                    icon={User}
                    label="Edit Profile"
                    subtext="Update your bio, rates and niches"
                    iconBg="bg-blue-500/20 text-blue-400"
                />
                <SettingsRow
                    icon={Instagram}
                    label="Social Accounts"
                    subtext="Manage connected platforms"
                    iconBg="bg-pink-500/20 text-pink-400"
                />
                <SettingsRow
                    icon={Landmark}
                    label="Payout Settings"
                    subtext="Manage bank accounts and UPI"
                    iconBg="bg-emerald-500/20 text-emerald-400"
                />
            </SettingsGroup>

            <SettingsGroup title="Preferences">
                <SettingsRow
                    icon={Bell}
                    label="Notifications"
                    subtext="Manage alerts and emails"
                    iconBg="bg-orange-500/20 text-orange-400"
                />
                <SettingsRow
                    icon={Smartphone}
                    label="App Settings"
                    subtext="PWA, haptics and theme"
                    iconBg="bg-purple-500/20 text-purple-400"
                />
            </SettingsGroup>

            <SettingsGroup title="Security & Support">
                <SettingsRow
                    icon={ShieldCheck}
                    label="Security"
                    subtext="Password and active sessions"
                    iconBg="bg-slate-500/20 text-slate-400"
                />
                <SettingsRow
                    icon={MessageSquare}
                    label="Help & Support"
                    iconBg="bg-info/20 text-info"
                />
                <SettingsRow
                    icon={Globe}
                    label="Privacy Policy"
                    iconBg="bg-white/5 text-white/60"
                />
            </SettingsGroup>

            <button
                onClick={onLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 py-4 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl border border-red-500/20 transition-all font-semibold"
            >
                <LogOut size={18} />
                Sign Out
            </button>
        </motion.div>
    );
};

export default ProfileSettingsTab;
