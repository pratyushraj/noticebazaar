import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { useSupabaseQuery } from '@/lib/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import BrandMobileDashboard from './BrandMobileDashboard';

const buildProfilesById = (profiles: any[] | null | undefined) => {
  const map = new Map<string, any>();
  (profiles || []).forEach((p) => {
    if (!p?.id) return;
    map.set(String(p.id), p);
  });
  return map;
};

const isMissingColumnError = (err: any, column: string) => {
  const msg = String(err?.message || err?.details || err?.hint || '').toLowerCase();
  const col = String(column || '').toLowerCase();
  return (
    msg.includes(`could not find the '${col}' column`) ||
    msg.includes(`could not find the \"${col}\" column`) ||
    msg.includes(`column ${col} does not exist`) ||
    msg.includes(`column "${col}" does not exist`) ||
    msg.includes(`${col} does not exist`) ||
    (msg.includes('column') && msg.includes(col) && msg.includes('does not exist')) ||
    (msg.includes('schema cache') && msg.includes(col))
  );
};

const BrandDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, user } = useSession();

  const initialTab = useMemo(() => {
    if (location.pathname.includes('/brand/collaborations')) return 'creators' as const;
    if (location.pathname.includes('/brand/analytics')) return 'analytics' as const;
    return 'dashboard' as const;
  }, [location.pathname]);

  const { data: requests = [], isLoading: isLoadingRequests } = useSupabaseQuery(
    ['brandRequests', user?.id],
    async () => {
      if (!user?.id) return [];

      const selectV2 = `
          id, 
          brand_name, 
          brand_email, 
          collab_type, 
          status, 
          created_at, 
          budget_range, 
          exact_budget, 
          barter_value,
          barter_description,
          deliverables,
          deadline,
          creator_id,
          counter_offer,
          brand_id
        `;

      const selectV1 = `
          id, 
          brand_name, 
          brand_email, 
          collab_type, 
          status, 
          created_at, 
          budget_range, 
          exact_budget, 
          barter_value,
          barter_description,
          deliverables,
          deadline,
          creator_id,
          counter_offer
        `;

      const run = async (select: string, canUseBrandId: boolean) => {
        const baseQuery = supabase
          .from('collab_requests')
          .select(select)
          .order('created_at', { ascending: false }) as any;

        if (canUseBrandId) {
          const query = (user.email
            ? baseQuery.or(`brand_id.eq.${user.id},brand_email.eq.${user.email}`)
            : baseQuery.eq('brand_id', user.id)) as any;
          const { data, error } = await query;
          if (error) throw error;
          return (data || []) as any[];
        }

        if (!user.email) return [] as any[];
        const { data, error } = await baseQuery.eq('brand_email', user.email);
        if (error) throw error;
        return (data || []) as any[];
      };

      let rows: any[] = [];
      try {
        rows = await run(selectV2, true);
      } catch (err: any) {
        if (isMissingColumnError(err, 'brand_id')) rows = await run(selectV1, false);
        else throw err;
      }

      const creatorIds = Array.from(new Set(rows.map((r) => String(r.creator_id || '')).filter(Boolean)));
      if (creatorIds.length === 0) return rows;

      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, business_name, avatar_url')
        .in('id' as any, creatorIds as any[]);

      if (profErr) return rows;
      const byId = buildProfilesById(profs);
      return rows.map((r) => ({ ...r, profiles: byId.get(String(r.creator_id)) || null }));
    },
    { enabled: !!user?.id }
  );

  const { data: deals = [], isLoading: isLoadingDeals } = useSupabaseQuery(
    ['brandDeals', user?.id],
    async () => {
      if (!user?.id) return [];

      const selectV2 = `
          id,
          creator_id,
          status,
          created_at,
          deal_amount,
          due_date,
          brand_id,
          brand_email
        `;

      const selectV1 = `
          id,
          creator_id,
          status,
          created_at,
          deal_amount,
          due_date,
          brand_email
        `;

      const run = async (select: string, canUseBrandId: boolean) => {
        const baseQuery = supabase
          .from('brand_deals')
          .select(select)
          .order('created_at', { ascending: false }) as any;

        if (canUseBrandId) {
          const query = (user.email
            ? baseQuery.or(`brand_id.eq.${user.id},brand_email.eq.${user.email}`)
            : baseQuery.eq('brand_id', user.id)) as any;
          const { data, error } = await query;
          if (error) throw error;
          return (data || []) as any[];
        }

        if (!user.email) return [] as any[];
        const { data, error } = await baseQuery.eq('brand_email', user.email);
        if (error) throw error;
        return (data || []) as any[];
      };

      let rows: any[] = [];
      try {
        rows = await run(selectV2, true);
      } catch (err: any) {
        if (isMissingColumnError(err, 'brand_id')) rows = await run(selectV1, false);
        else throw err;
      }

      const creatorIds = Array.from(new Set(rows.map((r) => String(r.creator_id || '')).filter(Boolean)));
      if (creatorIds.length === 0) return rows;

      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('id, username, first_name, last_name, business_name, avatar_url')
        .in('id' as any, creatorIds as any[]);

      if (profErr) return rows;
      const byId = buildProfilesById(profs);
      return rows.map((r) => ({ ...r, profiles: byId.get(String(r.creator_id)) || null }));
    },
    { enabled: !!user?.id }
  );

  const isLoading = Boolean(isLoadingRequests || isLoadingDeals);

  const stats = useMemo(() => {
    const totalSent = requests.length;
    const activeDeals = deals.filter((d: any) => d.status !== 'completed' && d.status !== 'cancelled').length;
    const totalInvestment = deals.reduce((acc: number, d: any) => acc + (Number(d?.deal_amount) || 0), 0);
    const needsAction = requests.filter((r: any) => String(r?.status || '').toLowerCase() === 'countered').length;
    return { totalSent, activeDeals, totalInvestment, needsAction };
  }, [requests, deals]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <BrandMobileDashboard
      profile={profile}
      requests={requests}
      deals={deals}
      stats={stats}
      initialTab={initialTab}
      isLoading={isLoading}
      onLogout={handleLogout}
    />
  );
};

export default BrandDashboard;
