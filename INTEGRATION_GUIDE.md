# Quick Integration Guide

## 1. Run Database Migration

```sql
-- Copy and paste the contents of:
-- supabase/migrations/2025_01_15_create_issues_and_action_logs.sql
-- Into Supabase SQL Editor and execute
```

## 2. Update DealDetailPage to Use DealContext

```tsx
// In App.tsx or DealDetailPage wrapper
import { DealProvider } from '@/contexts/DealContext';

<DealProvider dealId={dealId}>
  <DealDetailPage />
</DealProvider>

// Inside DealDetailPage.tsx
import { useDeal } from '@/contexts/DealContext';

const { deal, issues, actionLogs, refreshAll } = useDeal();
// Replace useBrandDealById with deal from context
```

## 3. Wire Up Issue Reporting

```tsx
import { useCreateIssue, useCreateActionLog } from '@/lib/hooks/useIssues';
import { generateIssueMessage } from '@/components/deals/IssueTypeModal';
import { trackEvent } from '@/lib/utils/analytics';

const createIssue = useCreateIssue();
const createActionLog = useCreateActionLog();

const handleIssueTypeSelect = async (type: IssueType) => {
  if (!brandDeal) return;
  
  const message = generateIssueMessage(
    type,
    dealData.title,
    Number(brandDeal.deal_amount || 0),
    brandDeal.due_date || undefined
  );

  try {
    // Create issue
    const issue = await createIssue.mutateAsync({
      deal_id: brandDeal.id,
      category: type,
      message,
    });

    // Create action log
    await createActionLog.mutateAsync({
      deal_id: brandDeal.id,
      event: 'issue_reported',
      metadata: { issue_id: issue.id, category: type },
    });

    // Track analytics
    trackEvent('issue_reported', { dealId: brandDeal.id, category: type });

    setReportIssueMessage(message);
    setShowMessageModal(true);
  } catch (error) {
    toast.error('Failed to create issue');
  }
};
```

## 4. Add Analytics Tracking

```tsx
// In ContractPreviewModal - already added ✅
// In PaymentDetailPage
import { trackEvent } from '@/lib/utils/analytics';

// In handleMarkAsReceived
trackEvent('payment_marked_received', { dealId: brandDeal.id });

// In handleUndoPayment
trackEvent('payment_undo_clicked', { dealId: brandDeal.id });

// In handleDownloadAllDocuments
trackEvent('zip_bundle_downloaded', { dealId: brandDeal.id });

// In handleAddToCalendar
trackEvent('calendar_sync_added', { dealId: brandDeal.id, type: 'deliverable' });
```

## 5. Add Lazy Loading for Performance

```tsx
// At top of DealDetailPage.tsx
import { lazy, Suspense } from 'react';

const ContractPreviewModal = lazy(() => import('@/components/deals/ContractPreviewModal'));
const ActionLog = lazy(() => import('@/components/deals/ActionLog'));
const IssueStatusCard = lazy(() => import('@/components/deals/IssueStatusCard'));
const IssueTypeModal = lazy(() => import('@/components/deals/IssueTypeModal'));

// Wrap components with Suspense
<Suspense fallback={<div className="text-white/60">Loading...</div>}>
  <ContractPreviewModal ... />
</Suspense>
```

## 6. Add Duplicate Deal Feature

```tsx
// Create hook: src/lib/hooks/useDuplicateDeal.ts
import { useSupabaseMutation } from './useSupabaseQuery';
import { useBrandDeals } from './useBrandDeals';

export function useDuplicateDeal() {
  const queryClient = useQueryClient();
  
  return useSupabaseMutation({
    table: 'brand_deals',
    method: 'insert',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brand-deals'] });
    },
  });
}

// In DealDetailPage
const duplicateDeal = useDuplicateDeal();

const handleDuplicateDeal = async () => {
  if (!brandDeal) return;
  
  const newDueDate = brandDeal.due_date 
    ? new Date(new Date(brandDeal.due_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null;
  
  const newPaymentDate = brandDeal.payment_expected_date
    ? new Date(new Date(brandDeal.payment_expected_date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null;

  await duplicateDeal.mutateAsync({
    ...brandDeal,
    id: undefined, // Let DB generate new ID
    status: 'Drafting',
    due_date: newDueDate,
    payment_expected_date: newPaymentDate,
    payment_received_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  
  trackEvent('deal_duplicated', { dealId: brandDeal.id });
  toast.success('Deal duplicated!');
  navigate(`/deal/${newDealId}/edit`);
};
```

## 7. Add Manual Deliverable Completion

```tsx
// In Deliverables section
import { Switch } from '@/components/ui/switch';

const [markAllCompleted, setMarkAllCompleted] = useState(false);
const updateDeal = useUpdateBrandDeal();
const createActionLog = useCreateActionLog();

const handleMarkAllCompleted = async () => {
  if (!brandDeal || !dealData.deliverables) return;
  
  const updatedDeliverables = dealData.deliverables.map(d => ({
    ...d,
    status: 'completed',
  }));
  
  await updateDeal.mutateAsync({
    id: brandDeal.id,
    creator_id: profile?.id,
    deliverables: JSON.stringify(updatedDeliverables),
  });
  
  await createActionLog.mutateAsync({
    deal_id: brandDeal.id,
    event: 'deliverables_marked_completed',
    metadata: { count: updatedDeliverables.length },
  });
  
  trackEvent('deliverable_marked_completed', { dealId: brandDeal.id });
  toast.success('All deliverables marked as completed!');
};
```

---

## Testing Checklist

Run these tests manually or via Playwright:

- [ ] Undo payment works (5-minute window)
- [ ] Issues can be created
- [ ] Action logs appear
- [ ] Contract metadata displays
- [ ] Analytics events fire
- [ ] Lazy loading works
- [ ] Duplicate deal creates new deal
- [ ] Manual completion toggles deliverables

---

## Files Created

1. ✅ `supabase/migrations/2025_01_15_create_issues_and_action_logs.sql`
2. ✅ `src/types/issues.ts`
3. ✅ `src/lib/hooks/useIssues.ts`
4. ✅ `src/lib/hooks/useActionLogs.ts`
5. ✅ `src/lib/utils/analytics.ts`
6. ✅ `src/contexts/DealContext.tsx`
7. ✅ `src/lib/utils/contractMetadata.ts`
8. ✅ Updated `src/pages/PaymentDetailPage.tsx` (undo feature)
9. ✅ Updated `src/components/deals/ContractPreviewModal.tsx` (metadata)

---

## Next Steps

1. Run database migration
2. Wire up DealContext in DealDetailPage
3. Add analytics tracking calls
4. Add lazy loading
5. Implement duplicate deal
6. Add manual deliverable completion
7. Write Playwright tests

