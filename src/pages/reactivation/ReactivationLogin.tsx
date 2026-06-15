import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const ReactivationLogin: React.FC = () => {
  const navigate = useNavigate();
  const { session, loading, profile } = useSession();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If session exists, redirect to appropriate page based on role
  useEffect(() => {
    if (session && !loading && !isLoading) {
      const userRole = profile?.role;
      if (userRole === 'dentist' || userRole === 'receptionist') {
        navigate('/reactivation/customers', { replace: true });
      } else if (userRole) {
        // If logged in as non-dentist (e.g. creator, brand), redirect to their own dashboard
        const target = userRole === 'brand' ? '/brand-dashboard' : '/creator-dashboard';
        navigate(target, { replace: true });
      }
    }
  }, [session, loading, profile, navigate, isLoading]);

  useEffect(() => {
    document.title = 'Dentist Portal Login | Reactivation';
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = identifier.trim();
    if (!val || !password.trim()) {
      toast.error('Please enter your email or phone number, and password');
      return;
    }
    
    setIsLoading(true);
    try {
      // Check if the identifier is a phone number (e.g. only digits or + sign, and longer than 8 chars)
      const cleanPhone = val.replace(/\s+/g, '');
      const isPhone = /^\+?[0-9]{8,15}$/.test(cleanPhone);

      let loginCreds: { email?: string; phone?: string; password: string } = {
        password,
      };

      if (isPhone) {
        // Ensure phone has country code. Default to +91 if 10 digits and no +
        let formattedPhone = cleanPhone;
        if (cleanPhone.length === 10 && !cleanPhone.startsWith('+')) {
          formattedPhone = `+91${cleanPhone}`;
        }
        loginCreds.phone = formattedPhone;
      } else {
        loginCreds.email = val;
      }

      const { data, error } = await supabase.auth.signInWithPassword(loginCreds);

      if (error || !data.session) {
        throw error || new Error('Failed to create session');
      }

      toast.success('Welcome back, Doctor!');
      navigate('/reactivation/customers', { replace: true });
    } catch (err: any) {
      console.error('Dentist login error:', err);
      toast.error(err.message || 'Invalid email/phone or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative premium gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="sm:mx-auto w-full max-w-md z-10 px-4">
        {/* Top Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 rounded-2xl shadow-xl shadow-teal-500/15 mb-4">
            <Stethoscope size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dentist Clinic Portal
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage patients, follow ups, and prescriptions
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 bg-slate-900/80 backdrop-blur-md border border-slate-800/90 py-8 px-6 shadow-2xl rounded-2xl sm:px-10"
        >
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Email or Phone Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Email or Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail size={16} />
                </span>
                <input
                  type="text"
                  placeholder="doctor@clinic.com or 9876543210"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
                  required
                />
              </div>
            </div>


            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Password
                </label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock size={16} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-teal-400 to-emerald-500 hover:opacity-90 active:scale-[0.98] text-slate-950 font-bold rounded-xl text-sm transition-all duration-150 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  Enter Portal <ArrowRight size={16} />
                </>
              )}
            </button>

          </form>

          {/* Bottom security assurance */}
          <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-500 border-t border-slate-800/60 pt-4">
            <ShieldCheck size={14} className="text-teal-500" />
            <span>Secure 256-bit encrypted doctor portal</span>
          </div>

        </motion.div>
      </div>
    </div>
  );
};

export default ReactivationLogin;
