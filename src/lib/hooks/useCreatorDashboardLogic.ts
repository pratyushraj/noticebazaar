import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getApiBaseUrl } from '@/lib/utils/api';
import { normalizeDealStatus, getCreatorDealCardUX } from '@/lib/utils/creator-dashboard';
import { useUpdateDealProgress, DealStage } from '@/lib/hooks/useBrandDeals';
import { trackEvent } from '@/lib/utils/analytics';
import { triggerHaptic, HapticPatterns } from '@/lib/utils/haptics';

interface UseCreatorDashboardLogicProps {
    profile?: any;
    collabRequests?: any[];
    brandDeals?: any[];
    onRefresh?: () => Promise<void>;
}

export const useCreatorDashboardLogic = ({
    profile,
    collabRequests = [],
    brandDeals = [],
    onRefresh,
}: UseCreatorDashboardLogicProps) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const updateDealProgress = useUpdateDealProgress();
    const [searchParams, setSearchParams] = useSearchParams();

    // -- Tab State --
    const activeTab = (searchParams.get('tab') as 'dashboard' | 'deals' | 'payments' | 'profile') || 'dashboard';
    const setActiveTab = useCallback((tab: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('tab', tab);
        setSearchParams(next, { replace: true });
        triggerHaptic();
    }, [searchParams, setSearchParams]);

    // -- Sub-tab State --
    const subtabParam = (searchParams.get('subtab') as 'active' | 'pending' | 'completed' | null) || null;
    const [collabSubTab, setCollabSubTab] = useState<'active' | 'pending' | 'completed'>('active');

    // -- Selection State --
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [selectedType, setSelectedType] = useState<'deal' | 'offer' | null>(null);
    const [showItemMenu, setShowItemMenu] = useState(false);

    // -- Modal/Sheet States --
    const [showProgressSheet, setShowProgressSheet] = useState(false);
    const [showDeliverContentModal, setShowDeliverContentModal] = useState(false);
    const [showReportIssueModal, setShowReportIssueModal] = useState(false);
    const [isSubmittingContent, setIsSubmittingContent] = useState(false);
    const [isConfirmingReceived, setIsConfirmingReceived] = useState(false);
    const [isReportingIssue, setIsReportingIssue] = useState(false);

    // -- Deep Link Handling --
    const hasHandledDeepLinkRef = useRef(false);
    const requestIdParam = searchParams.get('requestId');
    const dealIdParam = searchParams.get('dealId');

    useEffect(() => {
        if (activeTab !== 'deals') return;

        // Deep-link for Pending Offers (requestId)
        if (requestIdParam && !hasHandledDeepLinkRef.current) {
            setCollabSubTab('pending');
            const match = collabRequests.find((r: any) => String(r?.id || r?.raw?.id || '') === requestIdParam);
            if (match) {
                hasHandledDeepLinkRef.current = true;
                setSelectedItem(match);
                setSelectedType('offer');

                const next = new URLSearchParams(searchParams);
                next.delete('requestId');
                next.set('tab', 'deals');
                next.set('subtab', 'pending');
                setSearchParams(next, { replace: true });
            }
            return;
        }

        // Deep-link for Active Deals (dealId)
        if (dealIdParam && !hasHandledDeepLinkRef.current) {
            setCollabSubTab('active');
            const match = brandDeals.find((d: any) => String(d?.id || d?.raw?.id || '') === dealIdParam);
            if (match) {
                hasHandledDeepLinkRef.current = true;
                setSelectedItem(match);
                setSelectedType('deal');

                const next = new URLSearchParams(searchParams);
                next.delete('dealId');
                next.set('tab', 'deals');
                next.set('subtab', 'active');
                setSearchParams(next, { replace: true });
            }
            return;
        }

        if (subtabParam === 'pending') setCollabSubTab('pending');
        else if (subtabParam === 'completed') setCollabSubTab('completed');
        else if (subtabParam === 'active') setCollabSubTab('active');
    }, [activeTab, requestIdParam, dealIdParam, subtabParam, collabRequests, brandDeals, searchParams, setSearchParams]);

    // -- Data Lists --
    const completedDealsList = useMemo(() => {
        return brandDeals.filter((d: any) => {
            const s = normalizeDealStatus(d);
            return s.includes('completed') || s === 'paid';
        });
    }, [brandDeals]);

    const activeDealsList = useMemo(() => {
        return brandDeals.filter((d: any) => {
            const s = normalizeDealStatus(d);
            return !(s.includes('completed') || s === 'paid');
        });
    }, [brandDeals]);

    const actionRequiredDealsList = useMemo(() => {
        return activeDealsList.filter((d: any) => Boolean(getCreatorDealCardUX(d).needsCreatorAction));
    }, [activeDealsList]);

    const pendingOffersCount = useMemo(() =>
        collabRequests.filter(req => req.status === 'pending').length,
        [collabRequests]);

    // -- Actions --
    const patchDealInCache = useCallback((dealId: string, patch: Record<string, any>) => {
        if (!dealId) return;

        queryClient.setQueriesData(
            { queryKey: ['brand_deals'], exact: false },
            (old: any) => {
                if (!Array.isArray(old)) return old;
                return old.map((d: any) => (String(d?.id || '') === dealId ? { ...d, ...patch } : d));
            }
        );

        queryClient.setQueriesData(
            { queryKey: ['brand_deal', dealId], exact: false },
            (old: any) => (old && typeof old === 'object' ? { ...old, ...patch } : old)
        );
    }, [queryClient]);

    const handleProgressStageSelect = async (stage: DealStage) => {
        if (stage === 'fully_executed' || stage === 'completed') {
            toast.message('This step is automatic.');
            return;
        }
        if (stage === 'content_delivered') {
            setShowProgressSheet(false);
            setShowDeliverContentModal(true);
            return;
        }
        if (!selectedItem?.id || !profile?.id) {
            toast.error('Cannot update progress: missing deal or profile');
            return;
        }

        try {
            await updateDealProgress.mutateAsync({
                dealId: selectedItem.id,
                stage,
                creator_id: profile.id,
            });
            toast.success('Progress updated');
            setShowProgressSheet(false);
            await onRefresh?.();
        } catch (e: any) {
            toast.error(e?.message || 'Failed to update progress');
        }
    };

    return {
        // Tab State
        activeTab,
        setActiveTab,
        collabSubTab,
        setCollabSubTab,

        // Selection State
        selectedItem,
        setSelectedItem,
        selectedType,
        setSelectedType,
        showItemMenu,
        setShowItemMenu,

        // Modal States
        showProgressSheet,
        setShowProgressSheet,
        showDeliverContentModal,
        setShowDeliverContentModal,
        showReportIssueModal,
        setShowReportIssueModal,
        isSubmittingContent,
        setIsSubmittingContent,
        isConfirmingReceived,
        setIsConfirmingReceived,
        isReportingIssue,
        setIsReportingIssue,

        // Data Lists
        completedDealsList,
        activeDealsList,
        actionRequiredDealsList,
        pendingOffersCount,

        // Actions
        handleProgressStageSelect,
        patchDealInCache,
    };
};
