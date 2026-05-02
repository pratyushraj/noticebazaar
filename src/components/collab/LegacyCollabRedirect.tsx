
import { useParams, Navigate } from 'react-router-dom';
import { normalizeCollabHandle } from '@/lib/utils/collabLink';

/**
 * Legacy redirect component for /collab/:username → /:username
 * Keeps old shared links working while short links are primary.
 */
const LegacyCollabRedirect = () => {
  const { username } = useParams<{ username: string }>();
  
  if (!username) {
    return <Navigate to="/" replace />;
  }
  
  return <Navigate to={`/${normalizeCollabHandle(username)}`} replace />;
};

export default LegacyCollabRedirect;
