import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2 } from 'lucide-react';

const CollabLinkSuccess = () => {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const [creatorName, setCreatorName] = useState<string>('the creator');
  const [loading, setLoading] = useState(true);

  // Get creator name from location state first, then fetch if needed
  useEffect(() => {
    const stateCreatorName = (location.state as any)?.creatorName;
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
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/collab/${username}`);
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
  }, [username, location.state]);

  // Determine display name with fallback
  const displayName = loading 
    ? 'the creator'
    : (creatorName && creatorName !== 'the creator' && creatorName.trim() !== '') 
      ? creatorName 
      : 'the creator';

  const confirmationText = displayName === 'the creator'
    ? 'Your collaboration request has been securely delivered to the creator.'
    : `Your collaboration request has been securely delivered to ${displayName} via Creator Armour.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white flex items-center justify-center px-4 py-8">
      <Card className="bg-white/10 backdrop-blur-md border-white/20 max-w-lg w-full">
        <CardContent className="p-6 md:p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-4 animate-in fade-in duration-500">
              <CheckCircle2 className="h-12 w-12 text-white" aria-hidden="true" />
            </div>
          </div>
          
          {/* Headline */}
          <h1 className="text-3xl font-bold text-white mb-4 text-center">
            Request Sent Successfully!
          </h1>
          
          {/* Confirmation Message */}
          <p className="text-lg text-purple-200 mb-6 text-center leading-relaxed">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Delivering your request...</span>
              </span>
            ) : (
              confirmationText
            )}
          </p>

          {/* What happens next section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-5 mb-6 text-left">
            <h2 className="text-lg font-semibold text-white mb-3">What happens next?</h2>
            <ul className="space-y-2 text-purple-200 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>The creator reviews your proposal</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>They may accept, counter, or decline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>If accepted, a contract is generated automatically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <span>Payments and deliverables are tracked inside Creator Armour</span>
              </li>
            </ul>
          </div>

          {/* Trust Reinforcement */}
          <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-4 mb-6">
            <p className="text-purple-200 text-sm text-center leading-relaxed">
              All collaboration details, contracts, and payments are handled securely on Creator Armour — no DMs required.
          </p>
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
                  <Link to={`/${username}`}>Send another collaboration request</Link>
              </Button>
                
                {/* Tertiary text link */}
                <div className="text-center pt-2">
                  <Link
                    to={`/${username}`}
                    className="text-purple-300 hover:text-white text-sm underline underline-offset-2 transition-colors"
                    aria-label="View this creator's collab link again"
                  >
                    View this creator's collab link again
                  </Link>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollabLinkSuccess;

