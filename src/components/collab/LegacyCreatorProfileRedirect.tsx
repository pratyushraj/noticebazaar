import { useParams, Navigate } from 'react-router-dom';
import { normalizeCollabHandle } from '@/lib/utils/collabLink';

/**
 * Legacy redirect component for /creator/:username → /:username
 * The short public creator URL is the canonical route now.
 */
const LegacyCreatorProfileRedirect = () => {
  const { username } = useParams<{ username: string }>();

  if (!username) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/${normalizeCollabHandle(username)}`} replace />;
};

export default LegacyCreatorProfileRedirect;
