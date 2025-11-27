# 🚀 Quick Fix Implementation Guide

This document provides code-level fixes for the critical issues identified in the integration audit.

---

## 🔴 Critical Fixes (Implement First)

### Fix #1: Token Refresh Error Handling

**File:** `src/integrations/supabase/client.ts`

```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: getRedirectUrl(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ADD: Listen for auth state changes globally
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  } else if (event === 'SIGNED_OUT' && !session) {
    // Handle forced logout
    if (window.location.pathname !== '/login') {
      toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
    }
  }
});
```

---

### Fix #2: Global Logout

**File:** `src/lib/hooks/useAuth.ts`

```typescript
// Line 15 - Update signOut call:
const { error } = await supabase.auth.signOut({ scope: 'global' });
```

---

### Fix #3: Validate Platforms/Goals Format

**File:** `src/pages/CreatorOnboarding.tsx`

**Add validation function:**
```typescript
// Add before handleOnboardingComplete
const validateOnboardingData = () => {
  if (!onboardingData.name.trim()) {
    toast.error('Please enter your name');
    return false;
  }
  if (!onboardingData.userType) {
    toast.error('Please select your user type');
    return false;
  }
  return true;
};

// Update handleOnboardingComplete:
const handleOnboardingComplete = async () => {
  if (!validateOnboardingData()) {
    setIsSubmitting(false);
    return;
  }
  
  // ... rest of function
  // Ensure platforms/goals are sent as arrays (not JSON strings)
  await updateProfileMutation.mutateAsync({
    // ...
    platforms: onboardingData.platforms.length > 0 ? onboardingData.platforms : null,
    goals: onboardingData.goals.length > 0 ? onboardingData.goals : null,
  });
};
```

**Verify backend schema:**
```sql
-- Run this to check column types:
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('platforms', 'goals');

-- Expected: data_type should be 'ARRAY' or 'jsonb'
-- If 'text', need migration to convert
```

---

### Fix #4: Null-Safe Financial Calculations

**File:** `src/pages/CreatorDashboard.tsx`

**Replace line 131:**
```typescript
// OLD:
.reduce((sum, deal) => sum + (deal.deal_amount || 0), 0);

// NEW:
.reduce((sum, deal) => {
  const amount = Number(deal.deal_amount);
  return sum + (isNaN(amount) ? 0 : amount);
}, 0);
```

**Apply same fix to:**
- Line 135 (lastMonthEarnings)
- Line 139 (allTimeEarnings)
- Line 149 (pendingPayments)
- Line 184 (nextPayout)

---

### Fix #5: Payment Status Logic

**File:** `src/lib/hooks/useBrandDeals.ts`

**Update line 325-327:**
```typescript
// OLD:
if (payment_received_date) {
  finalStatus = 'Completed';
}

// NEW:
if (payment_received_date) {
  // Only auto-complete if not in draft state
  if (status !== 'Drafting') {
    finalStatus = 'Completed';
  }
}
```

**Also update line 473-478:**
```typescript
// OLD:
if (updates.payment_received_date) {
  updatePayload.status = 'Completed';
} else if (updates.payment_received_date === null && updatePayload.status === 'Completed') {
  updatePayload.status = 'Payment Pending';
}

// NEW:
if (updates.payment_received_date && updates.status !== 'Drafting') {
  updatePayload.status = 'Completed';
} else if (updates.payment_received_date === null) {
  // Only revert if status was auto-set to Completed
  if (updatePayload.status === 'Completed' && !updates.status) {
    updatePayload.status = 'Payment Pending';
  }
}
```

---

### Fix #6: Message Format Normalization

**File:** `src/pages/MessagesPage.tsx`

**Add utility function (before component):**
```typescript
interface UnifiedMessage {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  sent_at: string;
  author: 'user' | 'advisor';
  advisorId?: string;
}

const normalizeMessage = (
  msg: any,
  currentUserId: string,
  advisorId?: string
): UnifiedMessage => {
  // CometChat format
  if (msg.text && msg.sender) {
    return {
      id: msg.id,
      content: msg.text,
      sender_id: msg.sender.uid,
      receiver_id: msg.receiver?.uid || '',
      sent_at: new Date(msg.sentAt * 1000).toISOString(),
      author: msg.sender.uid === currentUserId ? 'user' : 'advisor',
      advisorId: advisorId,
    };
  }
  
  // Supabase format
  return {
    id: msg.id,
    content: typeof msg.content === 'string' ? msg.content : String(msg.content),
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    sent_at: msg.sent_at,
    author: msg.sender_id === currentUserId ? 'user' : 'advisor',
    advisorId: advisorId,
  };
};
```

**Update messages computation (line 635):**
```typescript
const messages: Message[] = useMemo(() => {
  // ... existing CometChat logic ...
  
  // Normalize all messages
  const allMessages = [
    ...(cometChat.messages || []).map(m => normalizeMessage(m, currentUserId, selectedAdvisorId)),
    ...(realMessages || []).map(m => normalizeMessage(m, currentUserId, selectedAdvisorId)),
  ];
  
  // Remove duplicates by ID
  const uniqueMessages = Array.from(
    new Map(allMessages.map(m => [m.id, m])).values()
  );
  
  // Sort by sent_at
  return uniqueMessages.sort((a, b) => 
    new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
  );
}, [/* dependencies */]);
```

---

### Fix #7: Add Error Boundary

**File:** `src/components/ErrorBoundary.tsx` (NEW FILE)

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    // Log to error tracking service (e.g., Sentry)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900 p-4">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-white/70 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Wrap App in ErrorBoundary:**
**File:** `src/App.tsx`

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* ... rest of app */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

---

### Fix #8: Network Timeout & Retry

**File:** `src/lib/hooks/useSupabaseQuery.ts`

**Add timeout wrapper:**
```typescript
const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number = 30000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ]);
};

// Update useSupabaseQuery:
export const useSupabaseQuery = <TQueryFnData, TError, TData = TQueryFnData>(
  queryKey: TQueryKey,
  queryFn: () => Promise<TQueryFnData>,
  options?: SupabaseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) => {
  const { errorMessage, retry = 3, retryDelay, ...restOptions } = options || {};

  const queryResult = useQuery<TQueryFnData, TError, TData, TQueryKey>({
    queryKey,
    queryFn: async () => {
      try {
        return await withTimeout(queryFn(), 30000);
      } catch (error: any) {
        if (error.message === 'Request timeout') {
          throw new Error('Request took too long. Please check your connection.');
        }
        throw error;
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false;
      // Retry up to retry times for 5xx errors
      return failureCount < (typeof retry === 'number' ? retry : 3);
    },
    retryDelay: retryDelay || ((attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)),
    ...restOptions,
  });

  // ... rest of hook
};
```

---

## 🟡 High Priority Fixes

### Fix #9: Currency Formatting Utility

**File:** `src/lib/utils/currency.ts` (UPDATE)

```typescript
export const formatCurrency = (
  amount: number | null | undefined,
  options?: { showZero?: boolean; symbol?: string }
): string => {
  const { showZero = true, symbol = '₹' } = options || {};
  
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showZero ? `${symbol}0` : '—';
  }
  
  return `${symbol}${amount.toLocaleString('en-IN')}`;
};

export const parseCurrency = (value: string): number => {
  const cleaned = value.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};
```

**Update all currency displays:**
```typescript
// Replace: `₹${amount}`
// With: formatCurrency(amount)
```

---

### Fix #10: Date Comparison Utility

**File:** `src/lib/utils/date.ts` (UPDATE)

```typescript
export const isSameMonth = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

export const getStartOfMonth = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date = new Date()): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};
```

**Update dashboard calculations:**
```typescript
// Replace: date.getMonth() === currentMonth && date.getFullYear() === currentYear
// With: isSameMonth(date, new Date())
```

---

## 📋 Testing Checklist

After implementing fixes, test:

- [ ] Login/logout flow works correctly
- [ ] Token refresh doesn't cause unexpected logouts
- [ ] Onboarding saves all fields correctly
- [ ] Dashboard stats match expected values
- [ ] Messages display correctly (CometChat + Supabase)
- [ ] Payment calculations are accurate
- [ ] Error states show helpful messages
- [ ] Network timeout shows user-friendly error
- [ ] Empty states display correctly
- [ ] Currency formatting is consistent

---

## 🚀 Deployment Notes

1. **Database Migrations:** Run any required migrations before deploying frontend fixes
2. **Environment Variables:** Ensure all new env vars are set in production
3. **Backward Compatibility:** Ensure fixes don't break existing data
4. **Monitoring:** Add error tracking for new error boundaries

---

**Last Updated:** 2025-01-XX

