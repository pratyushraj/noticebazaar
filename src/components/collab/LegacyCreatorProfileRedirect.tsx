import { useParams, Navigate } from 'react-router-dom';

/**
 * Legacy redirect component for /creator/:username → /:username
 * The short public creator URL is the canonical route now.
 */
const LegacyCreatorProfileRedirect = () => {
  const { username } = useParams<{ username: string }>();

  if (!username) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/${username}`} replace />;
};

export default LegacyCreatorProfileRedirect;

