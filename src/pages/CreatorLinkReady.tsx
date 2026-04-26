

import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Copy, Instagram, Link2, MessageCircleMore, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/contexts/SessionContext";
import { useUpdateProfile } from "@/lib/hooks/useProfiles";
import { getCreatorProgressPatch } from "@/lib/creatorProfileCompletion";
import { OnboardingContainer } from "@/components/onboarding/OnboardingContainer";
import { Button } from "@/components/ui/button";

export default function CreatorLinkReady() {
  const { profile, user, loading: sessionLoading, refetchProfile } = useSession();
  const navigate = useNavigate();
  const updateProfileMutation = useUpdateProfile();
  const hasAutoCopiedLinkRef = useRef(false);

  useEffect(() => {
    document.title = "Share Your Collab Link | CreatorArmour";
  }, []);

  // Guard: must be signed in creator.
  useEffect(() => {
    if (sessionLoading) return;
    if (!profile || profile.role !== "creator") {
      navigate("/login", { replace: true });
      return;
    }
    const handle = String(profile.instagram_handle || profile.username || "").replace(/^@+/, "").trim();
    if (!handle) {
      navigate("/creator-onboarding", { replace: true });
    }
  }, [sessionLoading, profile, navigate]);

  const handle = useMemo(
    () => String(profile?.instagram_handle || profile?.username || "").replace(/^@+/, "").trim().toLowerCase(),
    [profile?.instagram_handle, profile?.username]
  );

  const collabUrl = useMemo(() => (handle ? `${window.location.origin}/${handle}` : ""), [handle]);

  const markShared = async () => {
    if (!profile?.id) return;
    if (profile.link_shared_at) return;
    try {
      const now = new Date().toISOString();
      const progressPatch = getCreatorProgressPatch({ ...(profile as any), link_shared_at: now });
      await updateProfileMutation.mutateAsync({ id: profile.id, link_shared_at: now, ...progressPatch } as any);
      await refetchProfile?.();
    } catch {
      // best effort only
    }
  };

  const handleCopyLink = async () => {
    if (!collabUrl) return;
    await navigator.clipboard.writeText(collabUrl);
    toast.success("Link copied");
    await markShared();
  };

  const handleShareWhatsApp = async () => {
    if (!collabUrl) return;
    const message = `Hi, you can send your offer here: ${collabUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    await handleCopyLink();
  };

  // Auto-copy once to make the "next step" feel instant.
  useEffect(() => {
    if (!collabUrl || hasAutoCopiedLinkRef.current) return;
    hasAutoCopiedLinkRef.current = true;
    void navigator.clipboard
      .writeText(collabUrl)
      .then(() => toast.success("Link copied. Paste it in your next brand DM."))
      .catch(() => {});
  }, [collabUrl]);

  if (sessionLoading || !profile || !user) {
    return (
      <OnboardingContainer theme="light" allowScroll>
        <div className="flex min-h-[100dvh] items-center justify-center" />
      </OnboardingContainer>
    );
  }

  return (
    <OnboardingContainer theme="light" allowScroll>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col justify-center px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[36px] border border-slate-200 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-100 bg-gradient-to-b from-emerald-50/80 to-white px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-600">Link ready</p>
              </div>
            </div>

            <div className="mt-5 max-w-xl">
              <h1 className="text-[2.15rem] font-black tracking-tight text-slate-950 leading-[0.95] sm:text-5xl">
                Your offer link is live
              </h1>
              <p className="mt-4 max-w-lg text-[15px] leading-7 text-slate-600 sm:text-base">
                Share this when a brand asks how to work with you. Keep your price, address, and UPI private until a deal actually needs them.
              </p>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                <Link2 className="h-3.5 w-3.5" />
                Your link
              </div>
              <div className="mt-3 rounded-[22px] bg-white px-4 py-4 ring-1 ring-slate-200">
                <p className="break-all text-xl font-black leading-snug text-slate-950 sm:text-[1.7rem]">{collabUrl.replace(/^https?:\/\//, "")}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <Button type="button" onClick={() => void handleShareWhatsApp()} className="h-14 rounded-2xl bg-emerald-600 text-white shadow-[0_16px_30px_-18px_rgba(16,185,129,0.9)] hover:bg-emerald-500">
                <MessageCircleMore className="mr-2 h-5 w-5" />
                Share on WhatsApp
              </Button>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => void handleCopyLink()} className="h-14 rounded-2xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50">
                  <Copy className="mr-2 h-5 w-5" />
                  Copy Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.open(collabUrl, "_blank", "noopener,noreferrer")}
                  className="h-14 rounded-2xl border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                >
                  <Instagram className="mr-2 h-5 w-5" />
                  Preview Page
                </Button>
              </div>

              <Button
                type="button"
                onClick={() => navigate("/creator-dashboard")}
                className="h-14 rounded-2xl bg-slate-950 text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-slate-800"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </OnboardingContainer>
  );
}
