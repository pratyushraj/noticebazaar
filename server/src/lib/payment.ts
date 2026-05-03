/**
 * Payment fee calculator — single source of truth.
 * All amounts in PAISE (integers) for Razorpay, converted to rupees for display.
 *
 * PLATFORM_FEE_PCT:   10%  (charged to brand on top of deal amount)
 * GST_PCT:            18%  (on platform fee only — per GST rules)
 * RAZORPAY_MDR_PCT:   2%   (Razorpay's MDR, absorbed by platform)
 * RAZORPAY_GST_PCT:   18%  (GST on MDR — also absorbed by platform)
 * HOLD_HOURS:         72   (3-day safety window before manual payout)
 */

export const PLATFORM_FEE_PCT   = 0.10;  // 10%
export const GST_PCT            = 0.18;  // 18% on platform fee
export const RAZORPAY_MDR_PCT   = 0.02;  // 2%  — platform absorbs
export const RAZORPAY_MDR_GST   = 0.18;  // 18% on MDR — platform absorbs
export const HOLD_HOURS         = 72;

export interface PaymentBreakdown {
  /** What the brand agreed to pay the creator */
  dealAmount: number;
  /** Platform fee (10% of deal) */
  platformFee: number;
  /** GST on platform fee (18%) */
  gstOnFee: number;
  /** Total the brand must pay */
  brandTotal: number;
  /** What you collect into your Razorpay account */
  razorpayChargeAmount: number;
  /** Razorpay's MDR cut (platform absorbs) */
  razorpayMdr: number;
  /** GST on MDR (platform absorbs) */
  razorpayMdrGst: number;
  /** What creator gets (deal amount, held by you) */
  creatorPayout: number;
  /** What platform nets after MDR */
  platformNet: number;
  /** Amount in PAISE for Razorpay API */
  amountPaise: number;
}

/**
 * Calculate exact payment breakdown for a deal.
 * Performs all calculations in PAISE to ensure precision for small amounts.
 */
export function calculatePaymentBreakdown(dealAmountRupees: number): PaymentBreakdown {
  const dealPaise        = Math.round(dealAmountRupees * 100);
  const platformFeePaise = Math.round(dealPaise * PLATFORM_FEE_PCT);
  const gstOnFeePaise    = Math.round(platformFeePaise * GST_PCT);
  const brandTotalPaise  = dealPaise + platformFeePaise + gstOnFeePaise;

  // Razorpay MDR is charged on the total collected amount (in Paise)
  const mdrPaise         = Math.round(brandTotalPaise * RAZORPAY_MDR_PCT);
  const mdrGstPaise      = Math.round(mdrPaise * RAZORPAY_MDR_GST);
  const platformNetPaise = platformFeePaise - mdrPaise - mdrGstPaise;

  return {
    dealAmount:            dealPaise / 100,
    platformFee:           platformFeePaise / 100,
    gstOnFee:              gstOnFeePaise / 100,
    brandTotal:            brandTotalPaise / 100,
    razorpayChargeAmount:  brandTotalPaise / 100,
    razorpayMdr:           mdrPaise / 100,
    razorpayMdrGst:        mdrGstPaise / 100,
    creatorPayout:         dealPaise / 100, 
    platformNet:           platformNetPaise / 100,
    amountPaise:           brandTotalPaise,
  };
}

/**
 * Calculate when payment can be released after content approval.
 * Returns ISO timestamp.
 */
export function calculatePayoutReleaseAt(approvedAt: Date = new Date()): string {
  const release = new Date(approvedAt);
  release.setHours(release.getHours() + HOLD_HOURS);
  return release.toISOString();
}

/**
 * Returns true if the payout hold period has elapsed and no dispute is open.
 */
export function isPayoutReleasable(
  payoutReleaseAt: string | null | undefined,
  hasOpenDispute: boolean,
): boolean {
  if (hasOpenDispute) return false;
  if (!payoutReleaseAt) return false;
  return new Date() >= new Date(payoutReleaseAt);
}
