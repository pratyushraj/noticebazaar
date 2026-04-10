import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ShieldCheck, Home, Search, Users, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this is an OAuth callback with malformed URL (missing #)
    const pathname = location.pathname;
    const search = location.search;
    const hash = location.hash;

    const hasOAuthParams =
      pathname.includes('access_token=') ||
      pathname.includes('refresh_token=') ||
      pathname.includes('expires_at=') ||
      search.includes('access_token=') ||
      hash.includes('access_token=') ||
      hash.includes('type=');

    if (hasOAuthParams) {
      if (pathname.includes('access_token=')) {
        const tokenPart = pathname.substring(pathname.indexOf('access_token='));
        window.history.replaceState({}, '', '/');
        window.location.hash = '#' + tokenPart;
        navigate('/login', { replace: true });
        return;
      }
      if (search.includes('access_token=')) {
        const searchParams = new URLSearchParams(search);
        const accessToken = searchParams.get('access_token');
        if (accessToken) {
          const hashParams = new URLSearchParams();
          for (const [key, value] of searchParams) hashParams.set(key, value);
          window.history.replaceState({}, '', '/');
          window.location.hash = '#' + hashParams.toString();
          navigate('/login', { replace: true });
          return;
        }
      }
      if (hash.includes('access_token=')) {
        navigate('/login', { replace: true });
        return;
      }
    }

    // If the user is intentionally on the reserved /404 route, don't spam an error log.
    if (location.pathname !== '/404') {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname, location.search, location.hash, navigate]);

  const popularPages = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Browse Creators', path: '/discover-creators', icon: Users },
    { label: 'Rate Calculator', path: '/rate-calculator', icon: Calculator },
    { label: 'Contract Analyzer', path: '/contract-analyzer', icon: Search },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-teal-50 px-4">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <ShieldCheck className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-lg font-black text-muted-foreground tracking-tight">Creator Armour</span>
        </div>

        <h1 className="text-6xl font-black text-muted-foreground mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-8">
          This page doesn't exist or has been moved.
        </p>

        {/* Popular pages */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {popularPages.map(({ label, path, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary hover:shadow-md transition-all text-left active:scale-[0.98]"
            >
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>

        <Button
          onClick={() => navigate('/')}
          className="bg-primary hover:bg-primary text-foreground rounded-full px-6"
        >
          Go to Homepage
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
