import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * Legacy redirect component for /collab/:username → /:username
 * Provides 301-style redirect for SEO and backward compatibility
 */
const LegacyCollabRedirect = () => {
  const { username } = useParams<{ username: string }>();
  
  if (!username) {
    return <Navigate to="/" replace />;
  }
  
  // Redirect to new Instagram-style route
  return <Navigate to={`/${username}`} replace />;
};

export default LegacyCollabRedirect;

