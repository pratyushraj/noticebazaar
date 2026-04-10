import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSession } from '@/contexts/SessionContext';
import { getApiBaseUrl } from '@/lib/utils/api';
import { cn } from '@/lib/utils';

type BrandProfilePayload = {
  name: string;
  website_url?: string | null;
  industry?: string | null;
  description?: string | null;
  logo_url?: string | null;
};

export const BrandSettingsPanel = ({
  embedded = false,
  onLogout,
}: {
  embedded?: boolean;
  onLogout?: () => void | Promise<void>;
}) => {
  const navigate = useNavigate();
  const { profile, session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');

  const canCallApi = !!session?.access_token;
  const apiBase = useMemo(() => getApiBaseUrl(), []);

  useEffect(() => {
    const seed =
      String((profile as any)?.business_name || '').trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
      '';
    if (seed && !name) setName(seed);
  }, [profile?.id, profile?.first_name, profile?.last_name, (profile as any)?.business_name, name]);

  const saveProfile = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      toast.error('Brand name is required');
      return;
    }
    if (!canCallApi) {
      toast.error('Please log in again');
      return;
    }

    setIsSaving(true);
    try {
      const payload: BrandProfilePayload = {
        name: cleanName,
        website_url: website.trim() || null,
        industry: industry.trim() || null,
        description: description.trim() || null,
      };

      const res = await fetch(`${apiBase}/api/brand-dashboard/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session!.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to save brand profile');
      }

      toast.success('Saved');
    } catch (err: any) {
      toast.error(err?.message || 'Could not save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={cn(embedded ? 'p-0' : 'min-h-[100dvh] p-5 sm:p-8', 'w-full')}>
      {!embedded && (
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Brand Settings</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground">Your brand profile</h1>
          </div>
          <Button type="button" variant="outline" onClick={() => navigate('/brand-dashboard')}>
            Back
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brand-name">Brand name</Label>
          <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your brand name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-website">Website (optional)</Label>
          <Input
            id="brand-website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-industry">Industry (optional)</Label>
          <Input id="brand-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="E.g. Beauty" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand-desc">Description (optional)</Label>
          <Input id="brand-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What do you sell?" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={saveProfile} disabled={isSaving} className="sm:min-w-[160px]">
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void onLogout?.();
            }}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default function BrandSettings() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <BrandSettingsPanel />
      <div className="p-5">
        <Button type="button" variant="outline" onClick={() => navigate('/brand-dashboard')}>
          Back to dashboard
        </Button>
      </div>
    </div>
  );
}

