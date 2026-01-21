import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is an OAuth callback with malformed URL (missing #)
    const pathname = location.pathname;
    const search = location.search;
    const hash = location.hash;
    
    // Check if pathname or search contains OAuth parameters
    const hasOAuthParams = 
      pathname.includes('access_token=') ||
      pathname.includes('refresh_token=') ||
      pathname.includes('expires_at=') ||
      search.includes('access_token=') ||
      hash.includes('access_token=') ||
      hash.includes('type=');

    if (hasOAuthParams) {
      console.log('[NotFound] Detected OAuth callback with malformed URL, redirecting to handle OAuth...');
      
      // Extract tokens from pathname if present
      if (pathname.includes('access_token=')) {
        // Move tokens from pathname to hash
        const tokenPart = pathname.substring(pathname.indexOf('access_token='));
        const newHash = '#' + tokenPart;
        
        // Clean the URL and set hash
        window.history.replaceState({}, '', '/');
        window.location.hash = newHash;
        
        // Redirect to login page which will handle OAuth
        navigate('/login', { replace: true });
        return;
      }
      
      // If tokens are in search params, move to hash
      if (search.includes('access_token=')) {
        const searchParams = new URLSearchParams(search);
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const expiresAt = searchParams.get('expires_at');
        const expiresIn = searchParams.get('expires_in');
        const tokenType = searchParams.get('token_type');
        const type = searchParams.get('type');
        
        if (accessToken) {
          // Build hash with tokens
          const hashParams = new URLSearchParams();
          if (accessToken) hashParams.set('access_token', accessToken);
          if (refreshToken) hashParams.set('refresh_token', refreshToken);
          if (expiresAt) hashParams.set('expires_at', expiresAt);
          if (expiresIn) hashParams.set('expires_in', expiresIn);
          if (tokenType) hashParams.set('token_type', tokenType);
          if (type) hashParams.set('type', type);
          
          const newHash = '#' + hashParams.toString();
          
          // Clean the URL and set hash
          window.history.replaceState({}, '', '/');
          window.location.hash = newHash;
          
          // Redirect to login page which will handle OAuth
          navigate('/login', { replace: true });
          return;
        }
      }
      
      // If tokens are already in hash, just redirect to login
      if (hash.includes('access_token=')) {
        navigate('/login', { replace: true });
        return;
      }
    }
    
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname, location.search, location.hash, navigate]);

  return (
    <div className="nb-screen-height flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
