
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { authService } from '@/lib/services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.updatePassword({ newPassword });
      if (result.success) {
        toast.success('Password updated successfully');
        onClose();
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(result.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border rounded-[2rem] overflow-hidden">
        <DialogHeader className="pt-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-black tracking-tight">Security Upgrade</DialogTitle>
          <DialogDescription className="text-sm font-medium opacity-60">
            Enter your new password below. We recommend using a mix of letters, numbers, and symbols.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdatePassword} className="space-y-6 py-4">
          <div className="space-y-2 group">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground group-focus-within:text-primary transition-colors">
              New Password
            </Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2 group">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-1 text-muted-foreground group-focus-within:text-primary transition-colors">
              Confirm New Password
            </Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-muted/50 border-border focus:bg-background transition-all"
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[13px] shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </div>
              ) : (
                "Update Password"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
