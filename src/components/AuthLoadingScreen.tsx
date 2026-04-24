

import { Loader2, ShieldCheck } from 'lucide-react';

const AuthLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020D0A]">
      {/* Emerald Background Accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="flex flex-col items-center justify-center space-y-8 text-center px-4 relative z-10">
        {/* Brand Icon with Glow */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 shadow-2xl flex items-center justify-center relative z-20 backdrop-blur-sm">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* Loading details */}
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
              <h2 className="text-[13px] font-black text-white tracking-[0.2em] uppercase">
                Authenticating
              </h2>
            </div>
            <p className="text-[13px] text-emerald-100/50 font-medium max-w-[200px] leading-relaxed">
              Securing your professional workspace...
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-emerald-500/30">
          CreatorArmour OS
        </p>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
