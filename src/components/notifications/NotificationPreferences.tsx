"use client";

import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Monitor, Moon, Sun, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences';
import { CategoryPreference } from '@/types/notifications';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

/**
 * Notification Preferences Component
 * 
 * Granular notification preferences with:
 * - Email/Push/In-app toggles
 * - Category-level preferences
 * - Quiet hours
 * - Do Not Disturb mode
 * - iOS 17 design
 */
export const NotificationPreferences: React.FC = () => {
  const { preferences, isLoading, updatePreference, updateCategoryPreference, isUpdating } = useNotificationPreferences();

  const [quietHoursStart, setQuietHoursStart] = useState(
    preferences?.quiet_hours_start || '22:00'
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    preferences?.quiet_hours_end || '08:00'
  );

  // Default category preferences
  const categories = [
    {
      id: 'payment_received',
      name: 'Payment Received',
      description: 'Get notified when you receive payments',
      icon: '💰',
    },
    {
      id: 'payment_pending',
      name: 'Payment Pending',
      description: 'Reminders for pending payments',
      icon: '⏳',
    },
    {
      id: 'deal_approved',
      name: 'Deal Approved',
      description: 'When your deals are approved',
      icon: '✅',
    },
    {
      id: 'contract_expiring',
      name: 'Contract Expiring',
      description: 'Reminders for expiring contracts',
      icon: '📄',
    },
    {
      id: 'tax_deadline_approaching',
      name: 'Tax Deadlines',
      description: 'Tax filing and payment reminders',
      icon: '📊',
    },
    {
      id: 'message_received',
      name: 'New Messages',
      description: 'When you receive messages from advisors',
      icon: '💬',
    },
  ];

  const handleToggleGlobal = (key: 'email_enabled' | 'push_enabled' | 'in_app_enabled') => {
    if (!preferences) return;

    updatePreference({
      [key]: !preferences[key],
    });
  };

  const handleToggleCategory = (categoryId: string, method: 'email' | 'push' | 'in_app') => {
    if (!preferences) return;

    const currentPrefs = preferences.preferences || {};
    const categoryPref = currentPrefs[categoryId] || { email: true, push: true, in_app: true };

    updateCategoryPreference({
      category: categoryId,
      preference: {
        ...categoryPref,
        [method]: !categoryPref[method],
      },
    });
  };

  const handleSaveQuietHours = () => {
    if (!preferences) return;

    updatePreference({
      quiet_hours_start: `${quietHoursStart}:00`,
      quiet_hours_end: `${quietHoursEnd}:00`,
    });
  };

  const handleToggleDND = () => {
    if (!preferences) return;

    updatePreference({
      do_not_disturb: !preferences.do_not_disturb,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="text-white/60">Loading preferences...</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-8 text-center">
        <div className="text-white/60">Failed to load preferences</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-6 border border-white/15">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Global Notification Settings
        </h3>

        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-white">Email Notifications</div>
                <div className="text-sm text-white/60">Receive notifications via email</div>
              </div>
            </div>
            <button
              onClick={() => handleToggleGlobal('email_enabled')}
              disabled={isUpdating}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                preferences.email_enabled ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                preferences.email_enabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Push Notifications */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-white">Push Notifications</div>
                <div className="text-sm text-white/60">Browser push notifications</div>
              </div>
            </div>
            <button
              onClick={() => handleToggleGlobal('push_enabled')}
              disabled={isUpdating}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                preferences.push_enabled ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                preferences.push_enabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {/* In-App Notifications */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <div className="font-medium text-white">In-App Notifications</div>
                <div className="text-sm text-white/60">Notifications in the app</div>
              </div>
            </div>
            <button
              onClick={() => handleToggleGlobal('in_app_enabled')}
              disabled={isUpdating}
              className={`w-12 h-7 rounded-full transition-colors relative ${
                preferences.in_app_enabled ? 'bg-green-500' : 'bg-white/20'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
                preferences.in_app_enabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-6 border border-white/15">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Moon className="w-5 h-5" />
          Quiet Hours
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">Start Time</label>
              <input
                type="time"
                value={quietHoursStart}
                onChange={(e) => setQuietHoursStart(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-2 block">End Time</label>
              <input
                type="time"
                value={quietHoursEnd}
                onChange={(e) => setQuietHoursEnd(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white"
              />
            </div>
          </div>
          <Button
            onClick={handleSaveQuietHours}
            disabled={isUpdating}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          >
            Save Quiet Hours
          </Button>
        </div>
      </Card>

      {/* Do Not Disturb */}
      <Card className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-6 border border-white/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="font-semibold text-white">Do Not Disturb</div>
              <div className="text-sm text-white/60">Pause all notifications</div>
            </div>
          </div>
          <button
            onClick={handleToggleDND}
            disabled={isUpdating}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              preferences.do_not_disturb ? 'bg-red-500' : 'bg-white/20'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${
              preferences.do_not_disturb ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>
      </Card>

      {/* Category Preferences */}
      <Card className="bg-white/[0.08] backdrop-blur-[40px] saturate-[180%] rounded-[20px] p-6 border border-white/15">
        <h3 className="text-lg font-semibold text-white mb-4">Category Preferences</h3>

        <div className="space-y-4">
          {categories.map((category) => {
            const categoryPref = preferences.preferences?.[category.id] || {
              email: true,
              push: true,
              in_app: true,
            };

            return (
              <div key={category.id} className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-white">{category.name}</div>
                    <div className="text-sm text-white/60">{category.description}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleToggleCategory(category.id, 'email')}
                    disabled={isUpdating || !preferences.email_enabled}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      categoryPref.email && preferences.email_enabled
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => handleToggleCategory(category.id, 'push')}
                    disabled={isUpdating || !preferences.push_enabled}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      categoryPref.push && preferences.push_enabled
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    Push
                  </button>
                  <button
                    onClick={() => handleToggleCategory(category.id, 'in_app')}
                    disabled={isUpdating || !preferences.in_app_enabled}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      categoryPref.in_app && preferences.in_app_enabled
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10'
                    }`}
                  >
                    In-App
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default NotificationPreferences;

