import { useParams, Navigate } from 'react-router-dom';

/**
 * Legacy redirect component for /:username/success → /collab/:username/success
 * Provides 301-style redirect for SEO and backward compatibility
 * Redirects old hash-based URLs to clean SEO-friendly URLs
 */
const LegacyCollabSuccessRedirect = () => {
  const { username } = useParams<{ username: string }>();
  
  if (!username) {
    return <Navigate to="/" replace />;
  }
  
  // Redirect to clean SEO-friendly route
  return <Navigate to={`/collab/${username}/success`} replace />;
};

export default LegacyCollabSuccessRedirect;

