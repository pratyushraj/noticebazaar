

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkValid, setIsLinkValid] = useState(true);

  // If the recovery link is invalid or expired, there will be no session
  // We add a small delay to allow Supabase to process hash tokens if they are present
  useEffect(() => {
    const checkValidity = async () => {
      // Check if there's a recovery token in the hash
      const hasHashToken = window.location.hash.includes('access_token') || 
                          window.location.hash.includes('type=recovery');
      
      if (loading) return;

      // If we have a hash token but no session yet, wait a bit longer for SessionContext to catch up
      if (hasHashToken && !session) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        // If still no session after wait, then it's likely invalid
      } else if (!session) {
        setIsLinkValid(false);
      }
    };

    checkValidity();
  }, [loading, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast.error("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("[ResetPassword] Failed to update password:", error);
        toast.error("Failed to update password: " + error.message);
        return;
      }

      toast.success("Your password has been updated. Welcome to Creator Armour!");

      // End the recovery session and send user to the welcome page with install instructions
      await supabase.auth.signOut();
      navigate("/welcome", { replace: true });
    } catch (err: any) {
      console.error("[ResetPassword] Exception while updating password:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="nb-screen-height flex flex-col items-center justify-center bg-[#0F0F1A] relative overflow-hidden font-sans p-4">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
      
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div
        className="w-full max-w-md p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 relative z-10"
        style={{
          backdropFilter: "blur(40px)",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-400/20 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-white/60 text-sm font-medium animate-pulse">
              Verifying security tokens...
            </p>
          </div>
        ) : !isLinkValid ? (
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
              <ShieldCheck className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Link Expired
            </h2>
            <p className="text-white/50 text-sm mb-8 leading-relaxed">
              This security token is no longer valid. For your protection, please request a new reset link.
            </p>
            <Button
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl h-14"
              onClick={() => navigate("/login", { replace: true })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              BACK TO SIGN IN
            </Button>
          </div>
        ) : (
          <>
            {/* Branding */}
            <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/20 border border-white/10">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
              <h1 className="text-3xl font-bold text-white tracking-tight text-center">
                Set a New Password
              </h1>
              <p className="text-white/50 mt-2 text-center text-sm font-medium uppercase tracking-widest">
                Securing Your Armoury
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/40 tracking-widest uppercase ml-1">
                  New Password
                </Label>
                <div className="relative group">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 h-14 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-white/40 tracking-widest uppercase ml-1">
                  Confirm Password
                </Label>
                <div className="relative group">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 h-14 text-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-500/20 transform active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-8 h-14 text-base tracking-widest"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={20} />
                    UPDATE PASSWORD
                  </>
                )}
              </Button>
            </form>

            <p className="mt-8 text-center text-white/20 text-[10px] font-bold tracking-[0.2em] uppercase">
              End-To-End Encrypted Session
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;




