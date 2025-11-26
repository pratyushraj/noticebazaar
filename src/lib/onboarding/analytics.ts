/**
 * Onboarding Analytics Tracking
 * Tracks user behavior during onboarding and first-time experience
 */

export interface OnboardingEvent {
  event: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

class OnboardingAnalytics {
  private events: OnboardingEvent[] = [];
  private startTime: number = Date.now();

  /**
   * Track an onboarding event
   */
  track(event: string, metadata?: Record<string, any>) {
    const eventData: OnboardingEvent = {
      event,
      timestamp: Date.now(),
      metadata
    };

    this.events.push(eventData);

    // Also send to analytics service (if configured)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event, {
        event_category: 'onboarding',
        ...metadata
      });
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Onboarding Analytics]', event, metadata);
    }
  }

  /**
   * Track onboarding step completion
   */
  trackStep(step: string, stepNumber: number, totalSteps: number, timeSpent?: number) {
    this.track('onboarding_step_completed', {
      step,
      step_number: stepNumber,
      total_steps: totalSteps,
      time_spent: timeSpent,
      progress: (stepNumber / totalSteps) * 100
    });
  }

  /**
   * Track onboarding completion
   */
  trackCompletion(totalTime: number, skippedSteps?: string[]) {
    const timeToComplete = Date.now() - this.startTime;
    
    this.track('onboarding_completed', {
      total_time: totalTime,
      time_to_complete: timeToComplete,
      skipped_steps: skippedSteps,
      total_steps: this.events.length
    });
  }

  /**
   * Track drop-off point
   */
  trackDropOff(step: string, reason?: string) {
    const timeSpent = Date.now() - this.startTime;
    
    this.track('onboarding_dropoff', {
      step,
      reason,
      time_spent: timeSpent,
      progress: this.events.length
    });
  }

  /**
   * Track first action after onboarding
   */
  trackFirstAction(action: string, timeAfterOnboarding: number) {
    this.track('first_action_after_onboarding', {
      action,
      time_after_onboarding: timeAfterOnboarding
    });
  }

  /**
   * Track achievement unlock
   */
  trackAchievement(achievementId: string, timeToUnlock?: number) {
    this.track('achievement_unlocked', {
      achievement_id: achievementId,
      time_to_unlock: timeToUnlock
    });
  }

  /**
   * Get all tracked events
   */
  getEvents(): OnboardingEvent[] {
    return [...this.events];
  }

  /**
   * Reset analytics
   */
  reset() {
    this.events = [];
    this.startTime = Date.now();
  }
}

// Singleton instance
export const onboardingAnalytics = new OnboardingAnalytics();

