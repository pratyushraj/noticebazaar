"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Scale, ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { useSession } from '@/contexts/SessionContext';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button'; // Import Button component
import BiometricLogin from '@/components/auth/BiometricLogin';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  useEffect(() => {
    // If session loading is finished and a session exists, redirect.
    if (!loading && session) {
      navigate('/', { replace: true });
    }
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#2A40A0] p-4">
      <div 
        className="w-full max-w-md p-8 rounded-lg shadow-lg border border-blue-400/30" 
        style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      >
        <div className="flex flex-col items-center mb-6">
          <Scale className="h-12 w-12 text-blue-300 mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Law Client Portal</h1>
          <p className="text-center text-blue-200 mb-8">Access your cases securely</p>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={['google']}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
        />
        
        {/* Biometric Login */}
        <div className="mt-6">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-blue-200">Or continue with</span>
            </div>
          </div>
          <BiometricLogin 
            onSuccess={async () => {
              // For now, this is a demo - in production you'd verify the credential
              // and then authenticate with Supabase
              toast.success('Biometric authentication successful!');
              // Navigate to dashboard - actual auth would happen via Supabase
              navigate('/', { replace: true });
            }} 
          />
        </div>
        
        <div className="mt-6">
          <Button variant="link" asChild className="w-full text-blue-200 hover:text-white">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Homepage
            </Link>
          </Button>
        </div>
      </div>
      <div className="p-4 text-center">
        <a
          href="https://www.dyad.sh/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-200 hover:text-blue-100"
        >
          Made with Dyad
        </a>
      </div>
    </div>
  );
};

export default Login;