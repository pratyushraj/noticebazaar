"use client";

import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Monitor, Moon, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNotificationPreferences } from '@/lib/hooks/useNotificationPreferences';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Notification Preferences Component
 * 
 * Simplified notification preferences with:
 * - Top-level Notification Mode selector
 * - Collapsed category preferences by default
 * - Merged Quiet Hours + DND
 * - Grouped by intent (Money, Deals, Messages)
 */
export const NotificationPreferences: React.FC = () => {
  const { preferences, isLoading, updatePreference, updateCategoryPreference, isUpdating } = useNotificationPreferences();

  const [notificationMode, setNotificationMode] = useState<'all' | 'important' | 'minimal' | 'dnd'>(
    preferences?.do_not_disturb ? 'dnd' : 'all'
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [quietHoursStart, setQuietHoursStart] = useState(
    preferences?.quiet_hours_start || '22:00'
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    preferences?.quiet_hours_end || '08:00'
  );
  const [allowPaymentAlerts, setAllowPaymentAlerts] = useState(true);

  // Group categories by intent
  const categoryGroups = {
    money: [
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
        id: 'tax_deadline_approaching',
        name: 'Tax Deadlines',
        description: 'Tax filing and payment reminders',
        icon: '📊',
      },
    ],
    deals: [
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
    ],
    messages: [
      {
        id: 'message_received',
        name: 'New Messages',
        description: 'When you receive messages from advisors',
        icon: '💬',
      },
    ],
  };

  const handleModeChange = (mode: 'all' | 'important' | 'minimal' | 'dnd') => {
    setNotificationMode(mode);
    
    if (mode === 'dnd') {
      updatePreference({
        do_not_disturb: true,
      });
    } else {
      updatePreference({
        do_not_disturb: false,
      });
      
      // Apply mode-specific settings
      if (mode === 'minimal') {
        // Only enable payment notifications
        updatePreference({
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
        });
      } else if (mode === 'important') {
        // Enable all channels, but category preferences will filter
        updatePreference({
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
        });
      } else {
        // All notifications - enable everything
        updatePreference({
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
        });
      }
    }
  };

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
    toast.success('Quiet hours saved');
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="text-white/60 text-sm">Loading preferences...</div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-4 text-center">
        <div className="text-white/60 text-sm">Failed to load preferences</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notification Mode Selector */}
      <Card className="bg-white/5 rounded-xl p-4 border border-white/10">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notification Mode
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleModeChange('all')}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
              notificationMode === 'all'
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            All notifications
          </button>
          <button
            onClick={() => handleModeChange('important')}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
              notificationMode === 'important'
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            Only important
          </button>
          <button
            onClick={() => handleModeChange('minimal')}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
              notificationMode === 'minimal'
                ? "bg-purple-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            Minimal
          </button>
          <button
            onClick={() => handleModeChange('dnd')}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
              notificationMode === 'dnd'
                ? "bg-red-600 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10"
            )}
          >
            Do Not Disturb
          </button>
        </div>
      </Card>

      {/* Do Not Disturb Schedule - Merged Quiet Hours + DND */}
      {notificationMode === 'dnd' && (
        <Card className="bg-white/5 rounded-xl p-4 border border-white/10">
          <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Moon className="w-4 h-4" />
            Do Not Disturb Schedule
          </h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">Start Time</label>
                <input
                  type="time"
                  value={quietHoursStart}
                  onChange={(e) => setQuietHoursStart(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1.5 block">End Time</label>
                <input
                  type="time"
                  value={quietHoursEnd}
                  onChange={(e) => setQuietHoursEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
            </div>
            
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={allowPaymentAlerts}
                onChange={(e) => setAllowPaymentAlerts(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-600 focus:ring-purple-500"
              />
              <span>Allow payment alerts during DND</span>
            </label>
            
            <Button
              onClick={handleSaveQuietHours}
              disabled={isUpdating}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm py-2"
            >
              Save Schedule
            </Button>
          </div>
        </Card>
      )}

      {/* Customize Advanced Notifications - Collapsed by default */}
      <Card className="bg-white/5 rounded-xl p-4 border border-white/10">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between"
        >
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Customize advanced notifications
          </h3>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-white/60" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/60" />
          )}
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-3 border-t border-white/10 mt-3">
                {/* Global Channel Toggles */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/80">Email</span>
                    </div>
                    <button
                      onClick={() => handleToggleGlobal('email_enabled')}
                      disabled={isUpdating}
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        preferences.email_enabled ? "bg-purple-600" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                        preferences.email_enabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/80">Push</span>
                    </div>
                    <button
                      onClick={() => handleToggleGlobal('push_enabled')}
                      disabled={isUpdating}
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        preferences.push_enabled ? "bg-purple-600" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                        preferences.push_enabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/80">In-App</span>
                    </div>
                    <button
                      onClick={() => handleToggleGlobal('in_app_enabled')}
                      disabled={isUpdating}
                      className={cn(
                        "w-10 h-6 rounded-full transition-colors relative",
                        preferences.in_app_enabled ? "bg-purple-600" : "bg-white/20"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 bg-white rounded-full absolute top-1 transition-all",
                        preferences.in_app_enabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>

                {/* Category Preferences - Collapsed by default */}
                <div className="pt-3 border-t border-white/10">
                  <button
                    onClick={() => setShowCategories(!showCategories)}
                    className="w-full flex items-center justify-between mb-2"
                  >
                    <span className="text-sm font-medium text-white/80">Category Preferences</span>
                    {showCategories ? (
                      <ChevronUp className="w-4 h-4 text-white/60" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-white/60" />
                    )}
                  </button>

                  <AnimatePresence>
                    {showCategories && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden space-y-4"
                      >
                        {/* Money Group */}
                        <div>
                          <div className="text-xs font-medium text-white/60 mb-2 uppercase tracking-wide">Money</div>
                          <div className="space-y-2">
                            {categoryGroups.money.map((category) => {
                              const categoryPref = preferences.preferences?.[category.id] || {
                                email: true,
                                push: true,
                                in_app: true,
                              };
                              return (
                                <div key={category.id} className="p-2.5 bg-white/5 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{category.icon}</span>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-white">{category.name}</div>
                                      <div className="text-xs text-white/60">{category.description}</div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'email')}
                                      disabled={isUpdating || !preferences.email_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.email && preferences.email_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      Email
                                    </button>
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'push')}
                                      disabled={isUpdating || !preferences.push_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.push && preferences.push_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      Push
                                    </button>
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'in_app')}
                                      disabled={isUpdating || !preferences.in_app_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.in_app && preferences.in_app_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      In-App
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Deals Group */}
                        <div>
                          <div className="text-xs font-medium text-white/60 mb-2 uppercase tracking-wide">Deals</div>
                          <div className="space-y-2">
                            {categoryGroups.deals.map((category) => {
                              const categoryPref = preferences.preferences?.[category.id] || {
                                email: true,
                                push: true,
                                in_app: true,
                              };
                              return (
                                <div key={category.id} className="p-2.5 bg-white/5 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{category.icon}</span>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-white">{category.name}</div>
                                      <div className="text-xs text-white/60">{category.description}</div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'email')}
                                      disabled={isUpdating || !preferences.email_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.email && preferences.email_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      Email
                                    </button>
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'push')}
                                      disabled={isUpdating || !preferences.push_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.push && preferences.push_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      Push
                                    </button>
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'in_app')}
                                      disabled={isUpdating || !preferences.in_app_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.in_app && preferences.in_app_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      In-App
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Messages Group */}
                        <div>
                          <div className="text-xs font-medium text-white/60 mb-2 uppercase tracking-wide">Messages</div>
                          <div className="space-y-2">
                            {categoryGroups.messages.map((category) => {
                              const categoryPref = preferences.preferences?.[category.id] || {
                                email: true,
                                push: true,
                                in_app: true,
                              };
                              return (
                                <div key={category.id} className="p-2.5 bg-white/5 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{category.icon}</span>
                                    <div className="flex-1">
                                      <div className="text-sm font-medium text-white">{category.name}</div>
                                      <div className="text-xs text-white/60">{category.description}</div>
                                    </div>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'email')}
                                      disabled={isUpdating || !preferences.email_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.email && preferences.email_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      Email
                                    </button>
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'push')}
                                      disabled={isUpdating || !preferences.push_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.push && preferences.push_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      Push
                                    </button>
                                    <button
                                      onClick={() => handleToggleCategory(category.id, 'in_app')}
                                      disabled={isUpdating || !preferences.in_app_enabled}
                                      className={cn(
                                        "flex-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                                        categoryPref.in_app && preferences.in_app_enabled
                                          ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                                          : "bg-white/5 text-white/40 border border-white/10"
                                      )}
                                    >
                                      In-App
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default NotificationPreferences;
