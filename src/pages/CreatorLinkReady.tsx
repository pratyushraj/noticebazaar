"use client";

import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Copy, Instagram, MessageCircleMore } from "lucide-react";
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
    document.title = "Share Your Collab Link | Creator Armour";
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
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-emerald-600">Link ready</p>
              <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Your offer link is live</h1>
              <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">
                Share this when a brand asks how to work with you. You can fill price, address, or UPI only when a deal needs it.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Your link</p>
            <p className="mt-3 break-all text-2xl font-black text-slate-900">{collabUrl.replace(/^https?:\/\//, "")}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Button type="button" onClick={() => void handleShareWhatsApp()} className="h-14 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500">
              <MessageCircleMore className="mr-2 h-5 w-5" />
              Share on WhatsApp
            </Button>
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
            className="mt-8 h-14 w-full rounded-2xl bg-slate-900 text-xs font-black uppercase tracking-[0.18em] text-white hover:bg-slate-800"
          >
            Go to dashboard
          </Button>
        </div>
      </div>
    </OnboardingContainer>
  );
}

