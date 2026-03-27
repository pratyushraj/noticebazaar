"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Scale, ArrowLeft } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinkValid, setIsLinkValid] = useState(true);

  // If the recovery link is invalid or expired, there will be no session
  useEffect(() => {
    if (!loading && !session) {
      setIsLinkValid(false);
    }
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
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CreatorArmour</h1>
        </div>

        {!isLinkValid ? (
          <>
            <h2 className="text-3xl font-bold text-white mb-3">
              Link expired or invalid
            </h2>
            <p className="text-white/80 text-sm mb-6">
              This password reset link is no longer valid. Please request a new
              reset email from the sign-in page.
            </p>
            <Button
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10"
              onClick={() => navigate("/login", { replace: true })}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sign In
            </Button>
          </>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">
                Set a New Password
              </h2>
              <p className="text-white/80 text-sm">
                Enter a new password for your CreatorArmour account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label
                  htmlFor="new-password"
                  className="text-white text-sm mb-2 block"
                >
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter a new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/60 text-base h-12 rounded-xl"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="confirm-password"
                  className="text-white text-sm mb-2 block"
                >
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-200/60 text-base h-12 rounded-xl"
                  autoComplete="new-password"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold h-12 rounded-xl shadow-lg mt-2"
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




