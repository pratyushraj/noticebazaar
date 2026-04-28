import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Copy, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { validateUpiId, type UpiValidationResult } from '@/lib/utils/upiValidation';

interface UpiIdInputProps {
  /** Current saved/committed value (from DB) */
  value: string;
  /** Read-only mode (display only) */
  readOnly?: boolean;
  /** Called with the normalised UPI ID when the user commits a valid entry */
  onChange: (normalisedValue: string, isVerified: false) => void;
  /** Dark mode flag */
  isDark?: boolean;
  className?: string;
}

export function UpiIdInput({
  value,
  readOnly = false,
  onChange,
  isDark = true,
  className,
}: UpiIdInputProps) {
  const [draft, setDraft] = useState(value || '');
  const [confirmDraft, setConfirmDraft] = useState(value || '');
  const [showConfirm, setShowConfirm] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Sync external value changes (e.g. profile reload)
  useEffect(() => {
    setDraft(value || '');
    setConfirmDraft(value || '');
  }, [value]);

  const validation: UpiValidationResult = validateUpiId(draft);

  const confirmValidation: UpiValidationResult = validateUpiId(confirmDraft);
  const confirmMismatch = showConfirm && confirmDraft.length > 0 && confirmDraft !== draft;
  const confirmMatch = showConfirm && confirmDraft === draft && validation.valid;

  const handleDraftChange = useCallback((raw: string) => {
    // Strip spaces, force lowercase
    const cleaned = raw.replace(/\s/g, '').toLowerCase();
    setDraft(cleaned);
    setShowConfirm(false);
    setConfirmDraft('');
  }, []);

  const handleDraftBlur = () => {
    if (validation.valid && draft !== value) {
      // Show confirm field
      setShowConfirm(true);
    }
  };

  const handleConfirmBlur = () => {
    if (confirmMatch) {
      // Commit the change — mark as unverified (changed)
      onChange(validation.normalised, false);
      setShowConfirm(false);
    }
  };

  const handleCommit = () => {
    if (!confirmMatch) return;
    onChange(validation.normalised, false);
    setShowConfirm(false);
    toast.success('UPI ID saved');
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setHasCopied(true);
      toast.success('UPI ID copied');
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const inputBase = cn(
    'w-full bg-transparent outline-none font-semibold text-[15px] p-0 border-none focus:ring-0 tracking-tight',
    isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400'
  );

  if (readOnly) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <span className={cn('font-semibold text-[15px] tracking-tight truncate', isDark ? 'text-white' : 'text-slate-900')}>
          {value || <span className="opacity-30 italic font-normal">Not set</span>}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* ── Main input ── */}
      <div className="relative group">
        <input
          className={inputBase}
          value={draft}
          onChange={e => handleDraftChange(e.target.value)}
          onBlur={handleDraftBlur}
          onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
          enterKeyHint="done"
          placeholder="yourname@okaxis"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="email"
          aria-label="UPI ID"
          aria-describedby="upi-hint"
        />
        {/* Copy icon */}
        {draft && (
          <button
            type="button"
            onClick={handleCopyUpi}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
            tabIndex={-1}
            aria-label="Copy UPI ID"
          >
            {hasCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {/* ── Real-time validation feedback ── */}
      {draft.length > 3 && (
        <div id="upi-hint" className="space-y-1">
          {validation.error && (
            <p className="flex items-center gap-1.5 text-[11px] text-red-400 font-medium">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {validation.error}
            </p>
          )}
          {!validation.error && validation.warning && (
            <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {validation.warning}
            </p>
          )}
          {validation.valid && !validation.warning && (
            <p className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              Valid format
            </p>
          )}
        </div>
      )}

      {/* ── Confirm-entry field ── */}
      {showConfirm && (
        <div className={cn(
          'rounded-2xl px-4 py-3.5 space-y-3 border-l-2',
          isDark
            ? 'bg-white/[0.03] border border-white/[0.08] border-l-amber-400/60'
            : 'bg-slate-50 border border-slate-200 border-l-amber-400'
        )}>
          <p className={cn('text-[11px] font-semibold flex items-center gap-1.5', isDark ? 'text-white/60' : 'text-slate-600')}>
            <Eye className="h-3 w-3 shrink-0 opacity-70" />
            Re-enter to confirm — typos mean brands can't pay you
          </p>
          <input
            className={cn(
              'w-full bg-transparent outline-none font-semibold text-[14px] p-0 border-none focus:ring-0 tracking-tight',
              confirmMismatch
                ? (isDark ? 'text-red-400' : 'text-red-600')
                : confirmMatch
                  ? (isDark ? 'text-emerald-400' : 'text-emerald-600')
                  : (isDark ? 'text-white placeholder:text-white/20' : 'text-slate-900 placeholder:text-slate-400')
            )}
            value={confirmDraft}
            onChange={e => setConfirmDraft(e.target.value.replace(/\s/g, '').toLowerCase())}
            onBlur={handleConfirmBlur}
            onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
            enterKeyHint="done"
            placeholder="Re-enter your UPI ID"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            inputMode="email"
            aria-label="Confirm UPI ID"
          />
          {confirmMismatch && (
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Doesn't match — check for typos
            </p>
          )}
          {confirmMatch && (
            <button
              type="button"
              onClick={handleCommit}
              className={cn(
                'w-full text-center text-[12px] font-bold rounded-xl py-2 transition-colors',
                isDark
                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15'
                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
              )}
            >
              ✓ Confirm & Save
            </button>
          )}
        </div>
      )}
    </div>
  );
}
