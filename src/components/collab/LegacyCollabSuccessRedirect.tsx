import { useParams, Navigate } from 'react-router-dom';

/**
 * Legacy redirect component for /collab/:username/success → /:username/success
 */
const LegacyCollabSuccessRedirect = () => {
  const { username } = useParams<{ username: string }>();
  
  if (!username) {
    return <Navigate to="/" replace />;
  }
  
  return <Navigate to={`/${username}/success`} replace />;
};

export default LegacyCollabSuccessRedirect;
