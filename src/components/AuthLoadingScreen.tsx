"use client";

import { Loader2, ShieldCheck } from 'lucide-react';

const AuthLoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F14]">
      <div className="flex flex-col items-center justify-center space-y-8 text-center px-4 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#1E293B] border border-[#334155] shadow-lg flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-white" />
        </div>

        {/* Loading details */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
            <h2 className="text-[14px] font-semibold text-white tracking-widest uppercase">
              Authenticating
            </h2>
          </div>
          <p className="text-[13px] text-slate-500 font-medium">
            Loading your secure workspace...
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-10 left-0 right-0 text-center">
        <p className="text-[10px] uppercase font-bold tracking-[0.08em] text-slate-600">
          CreatorArmour OS
        </p>
      </div>
    </div>
  );
};

export default AuthLoadingScreen;
