

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, ArrowLeft, Eye, EyeOff } from "lucide-react";
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

      toast.success("Your password has been updated. Please sign in again.");

      // End the recovery session and send user back to login with fresh credentials
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err: any) {
      console.error("[ResetPassword] Exception while updating password:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="nb-screen-height flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4">
      <div
        className="w-full max-w-md p-8 rounded-3xl shadow-2xl border border-purple-400/20"
        style={{
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(139, 92, 246, 0.15)",
        }}
      >
        {/* Branding */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
            <Scale className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Creator Armour</h1>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-400/20 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-foreground/60 text-sm font-medium animate-pulse">
              Verifying security tokens...
            </p>
          </div>
        ) : !isLinkValid ? (
          <>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Link expired or invalid
            </h2>
            <p className="text-foreground/80 text-sm mb-6">
              This password reset link is no longer valid. Please request a new
              reset email from the sign-in page.
            </p>
            <Button
              variant="outline"
              className="w-full border-border text-foreground hover:bg-secondary/50"
              onClick={() => navigate("/login", { replace: true })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Set a New Password
              </h2>
              <p className="text-foreground/80 text-sm">
                Enter a new password for your Creator Armour account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label
                  htmlFor="new-password"
                  className="text-foreground text-sm mb-2 block"
                >
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter a new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-secondary/50 border-border text-foreground placeholder:text-secondary/60 text-base h-12 rounded-xl pr-12"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>
              <div>
                <Label
                  htmlFor="confirm-password"
                  className="text-foreground text-sm mb-2 block"
                >
                  Confirm new password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary/50 border-border text-foreground placeholder:text-secondary/60 text-base h-12 rounded-xl pr-12"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-foreground font-semibold h-12 rounded-xl shadow-lg mt-2"
              >
                {isSubmitting ? "Updating password..." : "Update Password"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;




