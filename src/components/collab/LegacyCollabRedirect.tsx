import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * Legacy redirect component for /collab/:username → /:username
 * Keeps old shared links working while short links are primary.
 */
const LegacyCollabRedirect = () => {
  const { username } = useParams<{ username: string }>();
  
  if (!username) {
    return <Navigate to="/" replace />;
  }
  
  return <Navigate to={`/${username}`} replace />;
};

export default LegacyCollabRedirect;
