

import { FullScreenLoader } from './FullScreenLoader';

interface AuthLoadingScreenProps {
  message?: string;
}

const AuthLoadingScreen = ({ message = "Securing Session" }: AuthLoadingScreenProps) => {
  return <FullScreenLoader message={message} />;
};

export default AuthLoadingScreen;
