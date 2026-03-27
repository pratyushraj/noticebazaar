import { TablesInsert } from '@/types/supabase';

type TaxFilingInsert = TablesInsert<'tax_filings'>;

/**
 * Determines the current Indian Financial Year (FY) based on the current date.
 * FY starts April 1st and ends March 31st.
 * Returns the start year of the FY (e.g., 2025 for FY 2025-26).
 */
const getCurrentFinancialYearStart = (date: Date = new Date()): number => {
  const currentMonth = date.getMonth(); // 0 = Jan, 3 = Apr
  const currentYear = date.getFullYear();

  // If current month is Jan, Feb, or Mar (0, 1, 2), the FY started in the previous year.
  if (currentMonth < 3) {
    return currentYear - 1;
  }
  // Otherwise, the FY started in the current year (Apr-Dec).
  return currentYear;
};

/**
 * Generates a list of mandatory tax filings for a given Financial Year (FY).
 * @param creatorId The ID of the creator.
 * @param fyStartYear The starting year of the Financial Year (e.g., 2025 for FY 2025-26).
 * @returns Array of TaxFilingInsert objects.
 */
export const generateTaxFilingsForFY = (creatorId: string, fyStartYear: number): TaxFilingInsert[] => {
  const fyEndYear = fyStartYear + 1;

  const filings: TaxFilingInsert[] = [];

  // --- Annual Filing: ITR ---
  // Due Date: July 31st of the succeeding FY (e.g., 2026-07-31 for FY 2025-26)
  filings.push({
    creator_id: creatorId,
    filing_type: 'itr_annual',
    due_date: `${fyEndYear}-07-31`,
    period_start: `${fyStartYear}-04-01`,
    period_end: `${fyEndYear}-03-31`,
    details: 'Annual Income Tax Return (ITR) Filing',
    status: 'pending',
  });

  // --- Quarterly Filings: GST and TDS ---
  const quarters = [
    { name: 'Q1', start: `${fyStartYear}-04-01`, end: `${fyStartYear}-06-30`, due: `${fyStartYear}-07-31` },
    { name: 'Q2', start: `${fyStartYear}-07-01`, end: `${fyStartYear}-09-30`, due: `${fyStartYear}-10-31` },
    { name: 'Q3', start: `${fyStartYear}-10-01`, end: `${fyStartYear}-12-31`, due: `${fyEndYear}-01-31` },
    { name: 'Q4', start: `${fyEndYear}-01-01`, end: `${fyEndYear}-03-31`, due: `${fyEndYear}-04-30` },
  ];

  quarters.forEach((q) => {
    // GST Filing (Quarterly)
    filings.push({
      creator_id: creatorId,
      filing_type: `gst_${q.name.toLowerCase()}`,
      due_date: q.due,
      period_start: q.start,
      period_end: q.end,
      details: `Quarterly GST Filing (${q.name})`,
      status: 'pending',
    });

    // TDS Payment (Quarterly)
    filings.push({
      creator_id: creatorId,
      filing_type: `tds_${q.name.toLowerCase()}`,
      due_date: q.due,
      period_start: q.start,
      period_end: q.end,
      details: `Quarterly TDS Payment (${q.name})`,
      status: 'pending',
    });
  });

  return filings;
};

/**
 * Generates tax filings for the current FY and the next FY (to ensure continuity).
 * @param creatorId The ID of the creator.
 * @returns Array of TaxFilingInsert objects.
 */
export const generateInitialTaxFilings = (creatorId: string): TaxFilingInsert[] => {
    const currentFYStart = getCurrentFinancialYearStart();
    const nextFYStart = currentFYStart + 1;

    const currentFYFilings = generateTaxFilingsForFY(creatorId, currentFYStart);
    const nextFYFilings = generateTaxFilingsForFY(creatorId, nextFYStart);

    // Combine and filter out any filings whose due date has already passed in the current FY
    const today = new Date().toISOString().split('T')[0];
    
    const allFilings = [...currentFYFilings, ...nextFYFilings].filter(filing => {
        // Only keep filings that are due today or in the future
        return filing.due_date >= today;
    });

    return allFilings;
};