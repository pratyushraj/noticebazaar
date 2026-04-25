
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getApiBaseUrl } from '@/lib/utils/api';

export default function DeleteAccount() {
  const { session } = useSession();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || err.error || 'Failed to delete account');
      }
      toast.success('Account deleted successfully');
      
      // Sign out locally to clear the session
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.auth.signOut({ scope: 'local' });
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing local session:', e);
      }
      
      // Redirect to login after a short delay
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 nb-screen-height bg-background">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Delete Account</h1>
          <p className="text-muted-foreground mt-2">
            Permanently remove your account and all associated data.
          </p>
        </div>

        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-lg space-y-6">
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 p-4 rounded-xl text-sm">
            <p className="font-bold mb-1">⚠️ This action is irreversible</p>
            <p className="opacity-80">
              Once deleted, all your profile information, deals, messages, and payment history will be permanently erased.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-bold text-muted-foreground">
              To confirm, type <code className="bg-muted px-2 py-1 rounded text-foreground font-mono">DELETE</code>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-base focus:border-primary outline-none transition-colors"
            />
          </div>

          <Button
            variant="destructive"
            className="w-full h-12 text-base font-black"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting Account...' : 'Permanently Delete My Account'}
          </Button>
        </div>
      </div>
    </div>
  );
}
