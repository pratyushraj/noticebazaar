import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * Legacy redirect component for /:username → /collab/:username
 * Provides 301-style redirect for SEO and backward compatibility
 * Redirects old hash-based URLs to clean SEO-friendly URLs
 */
const LegacyCollabRedirect = () => {
  const { username } = useParams<{ username: string }>();
  
  if (!username) {
    return <Navigate to="/" replace />;
  }
  
  // Redirect to clean SEO-friendly route
  // This handles old links like /rahul_creates → /collab/rahul_creates
  return <Navigate to={`/collab/${username}`} replace />;
};

export default LegacyCollabRedirect;

