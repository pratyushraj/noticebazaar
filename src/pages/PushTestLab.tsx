import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Bug, Copy, Send, ShieldCheck, Zap } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { useDealAlertNotifications } from '@/hooks/useDealAlertNotifications';
import { getApiBaseUrl } from '@/lib/utils/api';

type JsonValue = Record<string, unknown> | string | number | boolean | null;

const PushTestLab = () => {
  const { user } = useSession();
  const {
    isSupported,
    hasVapidKey,
    permission,
    isSubscribed,
    isBusy,
    enableNotifications,
    refreshStatus,
  } = useDealAlertNotifications();

  const [debugResult, setDebugResult] = useState<JsonValue | null>(null);
  const [testResult, setTestResult] = useState<JsonValue | null>(null);
  const [directResult, setDirectResult] = useState<JsonValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [loadingTest, setLoadingTest] = useState(false);
  const [loadingDirect, setLoadingDirect] = useState(false);
  const [loadingCopyCurl, setLoadingCopyCurl] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);
  const pushApiBase = useMemo(() => {
    if (typeof window === 'undefined') return apiBaseUrl;
    const host = window.location.hostname.toLowerCase();
    const isPublicHost =
      host.endsWith('creatorarmour.com') ||
      host.endsWith('noticebazaar.com') ||
      host.endsWith('vercel.app');
    // Hard-pin push test traffic to known-good backend to avoid edge rewrite drift.
    return isPublicHost ? 'https://noticebazaar-api.onrender.com' : apiBaseUrl;
  }, [apiBaseUrl]);

  const getToken = async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  };

  const ensureBrowserSubscription = async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service worker not supported');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    let subscription = await registration.pushManager.getSubscription();
    if (subscription) return subscription;

    // Auto-attempt provisioning via existing hook flow.
    const result = await enableNotifications();
    if (!result.success) {
      throw new Error(result.reason || 'subscription_enable_failed');
    }

    subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      throw new Error('No browser subscription found after enabling notifications.');
    }
    return subscription;
  };

  const handleEnable = async () => {
    setError(null);
    const result = await enableNotifications();
    if (!result.success) {
      setError(`Enable failed: ${result.reason || 'unknown'}`);
      return;
    }
    await refreshStatus();
  };

  const fetchDebugStatus = async () => {
    setError(null);
    setLoadingDebug(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const response = await fetch(`${pushApiBase}/api/push/debug-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await response.json();
      setDebugResult(json);
      if (!response.ok) throw new Error(json?.error || `HTTP ${response.status}`);
    } catch (e: any) {
      setError(`Debug status failed: ${e?.message || 'unknown error'}`);
    } finally {
      setLoadingDebug(false);
    }
  };

  const sendTestPush = async () => {
    setError(null);
    setLoadingTest(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const response = await fetch(`${pushApiBase}/api/push/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'CreatorArmour Push Test',
          body: 'If you see this, push delivery is working.',
          url: '/creator-dashboard',
        }),
      });
      const json = await response.json();
      setTestResult(json);
      if (!response.ok) throw new Error(json?.error || `HTTP ${response.status}`);
    } catch (e: any) {
      setError(`Test push failed: ${e?.message || 'unknown error'}`);
    } finally {
      setLoadingTest(false);
    }
  };

  const sendDirectPush = async () => {
    setError(null);
    setLoadingDirect(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No auth token');

      const subscription = await ensureBrowserSubscription();

      const response = await fetch(`${pushApiBase}/api/push/direct-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          title: 'Direct Push Test (No DB)',
          body: 'This test bypasses Supabase reads and sends directly.',
          url: '/push-test',
        }),
      });
      const json = await response.json();
      setDirectResult(json);
      if (!response.ok) throw new Error(json?.error || `HTTP ${response.status}`);
    } catch (e: any) {
      setError(`Direct push failed: ${e?.message || 'unknown error'}`);
    } finally {
      setLoadingDirect(false);
    }
  };

  const copyAuthCurl = async () => {
    setError(null);
    setCopyMessage(null);
    setLoadingCopyCurl(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('No auth token');
      const subscription = await ensureBrowserSubscription();

      const payload = {
        subscription: subscription.toJSON(),
        title: 'Direct Push Test (No DB)',
        body: 'This test bypasses Supabase reads and sends directly.',
        url: '/push-test',
      };
      const resolvedApiBaseUrl = pushApiBase || window.location.origin;

      const escapedPayload = JSON.stringify(payload).replace(/'/g, `'\"'\"'`);
      const curl = [
        `curl -X POST "${resolvedApiBaseUrl}/api/push/direct-test"`,
        `  -H "Content-Type: application/json"`,
        `  -H "Authorization: Bearer ${token}"`,
        `  -d '${escapedPayload}'`,
      ].join(' \\\n');

      await navigator.clipboard.writeText(curl);
      setCopyMessage('Auth curl copied. Paste into terminal to test direct push API.');
    } catch (e: any) {
      setError(`Copy curl failed: ${e?.message || 'unknown error'}`);
    } finally {
      setLoadingCopyCurl(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#120623] text-white p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Push Test Lab</h1>
          <Link to="/creator-profile?section=account" className="text-sm text-violet-300 underline">
            Back to Profile
          </Link>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2">
          <p className="text-sm text-white/80">User: {user?.email || 'Not logged in'}</p>
          <p className="text-sm text-white/80">API: {pushApiBase || '(same origin)'}</p>
          <p className="text-sm text-white/80">Browser support: {isSupported ? 'yes' : 'no'}</p>
          <p className="text-sm text-white/80">VAPID key loaded: {hasVapidKey ? 'yes' : 'no'}</p>
          <p className="text-sm text-white/80">Permission: {permission}</p>
          <p className="text-sm text-white/80">Browser subscribed: {isSubscribed ? 'yes' : 'no'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <button
            onClick={handleEnable}
            disabled={isBusy}
            className="rounded-xl px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Bell className="h-4 w-4" />
            {isBusy ? 'Enabling...' : 'Enable / Refresh'}
          </button>
          <button
            onClick={fetchDebugStatus}
            disabled={loadingDebug}
            className="rounded-xl px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Bug className="h-4 w-4" />
            {loadingDebug ? 'Checking...' : 'Fetch Debug Status'}
          </button>
          <button
            onClick={sendTestPush}
            disabled={loadingTest}
            className="rounded-xl px-4 py-3 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send className="h-4 w-4" />
            {loadingTest ? 'Sending...' : 'Send Test Push'}
          </button>
          <button
            onClick={sendDirectPush}
            disabled={loadingDirect}
            className="rounded-xl px-4 py-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {loadingDirect ? 'Sending...' : 'Send Direct Push'}
          </button>
          <button
            onClick={copyAuthCurl}
            disabled={loadingCopyCurl}
            className="rounded-xl px-4 py-3 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Copy className="h-4 w-4" />
            {loadingCopyCurl ? 'Copying...' : 'Copy Auth Test curl'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
        {copyMessage && (
          <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 text-sm text-cyan-200">
            {copyMessage}
          </div>
        )}

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Backend debug-status response
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words text-white/80">
            {JSON.stringify(debugResult, null, 2)}
          </pre>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Send className="h-4 w-4 text-violet-300" />
            Test push response
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words text-white/80">
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Zap className="h-4 w-4 text-amber-300" />
            Direct push response (no Supabase DB read)
          </div>
          <pre className="text-xs whitespace-pre-wrap break-words text-white/80">
            {JSON.stringify(directResult, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PushTestLab;
