

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error("Failed to send reset email: " + error.message);
      } else {
        setSent(true);
        toast.success("Password reset email sent! Check your inbox.");
      }
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to send reset email."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#0B0F14] p-4 font-inter">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
            <ShieldCheck className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">NoticeBazaar</span>
        </div>

        {/* Back link */}
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </button>

        {/* Form card */}
        <div className="bg-[#131920] border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <h1 className="text-xl font-black text-white">Reset your password</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {sent
                ? "Check your inbox — we sent a reset link to your email."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {sent ? (
            <div className="space-y-3">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-400 text-center">
                Check your inbox — we sent a reset link to your email.
              </div>
              <Button
                onClick={() => navigate("/login")}
                className="w-full bg-primary hover:bg-primary text-foreground rounded-xl"
              >
                Back to Sign In
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground rounded-xl"
                autoComplete="email"
                autoFocus
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
