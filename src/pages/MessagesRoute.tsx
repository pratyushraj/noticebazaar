"use client";

import { Navigate, useLocation } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';

/**
 * Role-aware messages entrypoint.
 * We don't expose a standalone messages UI yet; this normalizes deep-links.
 */
export default function MessagesRoute() {
  const { profile } = useSession();
  const location = useLocation();
  const role = profile?.role || 'creator';

  // Preserve conversation id if provided.
  const match = location.pathname.match(/^\/messages\/([^/]+)$/);
  const conversationId = match?.[1] ? String(match[1]) : null;

  if (role === 'brand') {
    // Brand message UX is currently inside brand dashboard.
    return <Navigate to="/brand-dashboard" replace />;
  }
  if (role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }
  if (role === 'lawyer') {
    return <Navigate to="/lawyer-dashboard" replace />;
  }
  if (role === 'chartered_accountant') {
    return <Navigate to="/ca-dashboard" replace />;
  }

  // Creator: route into creator dashboard deals tab; keep params minimal.
  return <Navigate to={conversationId ? `/creator-dashboard?tab=deals&conversationId=${encodeURIComponent(conversationId)}` : '/creator-dashboard?tab=deals'} replace />;
}

