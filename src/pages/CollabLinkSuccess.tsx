import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/utils/api';

const CollabLinkSuccess = () => {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const [creatorName, setCreatorName] = useState<string>('the creator');
  const [loading, setLoading] = useState(true);
  const [reviewStep, setReviewStep] = useState(0);
  const [showProtectionBadge, setShowProtectionBadge] = useState(false);
  const state = (location.state as {
    creatorName?: string;
    submissionType?: 'request' | 'lead';
    confirmationMessage?: string;
  } | null) || null;
  const submissionType = state?.submissionType === 'lead' ? 'lead' : 'request';
  const confirmationMessageFromState = state?.confirmationMessage || '';

  // Get creator name from location state first, then fetch if needed
  useEffect(() => {
    const stateCreatorName = state?.creatorName;
    if (stateCreatorName) {
      setCreatorName(stateCreatorName);
      setLoading(false);
      return;
    }

    // Fallback: Fetch creator name from API
    const fetchCreatorName = async () => {
      if (!username) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/api/collab/${username}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.creator) {
            setCreatorName(data.creator.name || 'the creator');
          }
        }
      } catch (error) {
        console.error('[CollabLinkSuccess] Error fetching creator:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorName();
  }, [username, state?.creatorName]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setReviewStep((prev) => (prev + 1) % 3);
    }, 1400);
    const badgeTimer = window.setTimeout(() => {
      setShowProtectionBadge(true);
    }, 1000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(badgeTimer);
    };
  }, []);

  // Determine display name with fallback
  const displayName = loading
    ? 'the creator'
    : (creatorName && creatorName !== 'the creator' && creatorName.trim() !== '')
      ? creatorName
      : 'the creator';

  const confirmationText = confirmationMessageFromState
    || (submissionType === 'lead'
      ? 'Your request has been shared with the creator.'
      : (displayName === 'the creator'
        ? 'Your collaboration request has been securely delivered to the creator.'
        : `Your collaboration request has been securely delivered to ${displayName} via Creator Armour.`));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center px-4 py-8">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-lg w-full">
        <CardContent className="p-5 md:p-7">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-4 animate-in fade-in duration-500">
              <CheckCircle2 className="h-12 w-12 text-white" aria-hidden="true" />
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl font-bold text-white mb-4 text-center">
            Your Offer is Under Review
          </h1>

          {/* Confirmation Message */}
          <p className="text-lg text-purple-200 mb-6 text-center leading-relaxed">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Delivering your request...</span>
              </span>
            ) : (
              'Creators typically respond within 24 hrs'
            )}
          </p>

          {!loading && (
            <div className="mb-5 rounded-xl border border-white/15 bg-white/[0.04] p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white font-semibold animate-[pulse_2s_ease-in-out_infinite]">
                  {(displayName || 'C').trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white font-semibold">Review Flow</p>
                  <p className="text-xs text-purple-200/80">{confirmationText}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {['Offer delivered to creator', 'Review in progress', 'Response pending'].map((label, index) => {
                  const active = index <= reviewStep;
                  return (
                    <div key={label}>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full transition-colors ${active ? 'bg-emerald-400' : 'bg-white/30'}`} />
                        <span className={`text-sm transition-colors ${active ? 'text-white' : 'text-white/60'}`}>{label}</span>
                      </div>
                      {index < 2 && (
                        <div className="ml-[4px] mt-1.5 h-0.5 w-20 rounded-full bg-white/15 overflow-hidden">
                          <div className={`h-full rounded-full bg-emerald-400 transition-all duration-500 ${reviewStep > index ? 'w-full' : 'w-0'}`} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* What happens next section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 mb-5 text-left">
            <h2 className="text-lg font-semibold text-white mb-3">What happens next?</h2>
            <ul className="space-y-2 text-purple-200 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{submissionType === 'lead' ? 'We reach out and onboard the creator to Creator Armour' : 'The creator reviews your proposal'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{submissionType === 'lead' ? 'Your request is preserved and mapped to the creator once onboarded' : 'They may accept, counter, or decline'}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>{submissionType === 'lead' ? 'You get notified when the collaboration becomes active' : 'Payments and deliverables are tracked inside Creator Armour'}</span>
              </li>
            </ul>
          </div>

          {/* Trust Reinforcement */}
          <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-4 mb-5">
            <p className="text-purple-200 text-sm text-center leading-relaxed">
              All collaboration details, contracts, and payments are handled securely on Creator Armour — no DMs required.
            </p>
            {showProtectionBadge && (
              <p className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-emerald-200 text-xs animate-in fade-in duration-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Protected by CreatorArmour
              </p>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              asChild
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/30"
              aria-label="Go to Creator Armour Home"
            >
              <Link to="/">Go to Creator Armour Home</Link>
            </Button>

            {username && (
              <>
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  aria-label="Send another collaboration request"
                >
                  <Link to={`/collab/${username}`}>Send another collaboration request</Link>
                </Button>

                {/* Tertiary text link */}
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-white/10 text-purple-200/90 hover:bg-white/5"
                  aria-label="View this creator's collab link again"
                >
                  <Link to={`/collab/${username}`}>View this creator&apos;s collab link again</Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollabLinkSuccess;
