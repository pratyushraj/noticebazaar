/**
 * Client-side contract validation utility
 * Validates if a document is a brand deal contract before processing
 */

/**
 * Validates if the document text is a brand deal contract
 * STRICT VALIDATION: Only accepts brand deal contracts, rejects all others
 * Returns validation result with reason if invalid
 */
export function isValidBrandDealContract(text: string): { isValid: boolean; reason?: string } {
  const lowerText = text.toLowerCase();
  
  // STRICT REJECTION: Reject if ANY of these patterns appear
  // These patterns are checked FIRST before any brand deal indicators
  const rejectionPatterns = [
    // Legal notices (including Zoomcar legal notices) - more comprehensive patterns
    { pattern: /legal notice|legal.*notice|cease and desist|court order|summons|subpoena|writ of|notice.*legal|under.*section.*138|section.*138|negotiable.*instrument|dishonour.*of.*cheque/i, reason: 'legal notice' },
    // Zoomcar specific patterns
    { pattern: /zoomcar|zoom.*car|booking.*id|booking.*number|vehicle.*number|rc.*number|registration.*number|chassis.*number|engine.*number/i, reason: 'legal notice' },
    // Notice patterns (if not in brand deal context)
    { pattern: /take.*notice|please.*take.*notice|you.*are.*hereby.*notified|notice.*is.*hereby|demand.*notice|legal.*demand/i, reason: 'legal notice' },
    // Common legal notice phrases
    { pattern: /whereas.*you.*have.*failed|you.*have.*failed.*to|default.*in.*payment|outstanding.*amount|due.*amount.*not.*paid/i, reason: 'legal notice' },
    // Vehicle/rental related (often in legal notices)
    { pattern: /vehicle.*damage|repair.*charges|towing.*charges|parking.*charges|rental.*charges/i, reason: 'legal notice' },
    // Consumer complaints
    { pattern: /consumer complaint|consumer forum|consumer court|consumer.*dispute|consumer.*redressal/i, reason: 'consumer complaint' },
    // Court documents
    { pattern: /case number|case no|petition|plaintiff|defendant|judgment|verdict|affidavit|fir|first information report/i, reason: 'court document' },
    // Car rental agreements or claims
    { pattern: /car rental|vehicle rental|rental agreement|lease.*vehicle|automobile.*rental|vehicle.*lease|booking id|registration no|repair estimate|vehicle/i, reason: 'car rental document' },
    // Insurance policies/claims
    { pattern: /insurance claim|claim form|insurance policy|premium|coverage.*insurance|policy number|insurance.*claim/i, reason: 'insurance document' },
    // Government forms
    { pattern: /government form|tax form|income tax|gst|pan|aadhaar|passport.*form|pan.*card|aadhaar.*card/i, reason: 'government form' },
    // Employment agreements
    { pattern: /employment.*agreement|employee.*contract|job.*offer|employment.*letter|offer.*letter/i, reason: 'employment agreement' },
    // Invoices, receipts, bills
    { pattern: /invoice|receipt|bill|statement|quotation|estimate|invoice.*number|bill.*number/i, reason: 'invoice/receipt document' },
    // Agreement for rent
    { pattern: /agreement.*for.*rent|rent.*agreement|lease.*agreement.*rent/i, reason: 'rental agreement' },
    // Additional aggressive patterns for legal documents
    { pattern: /whereas.*and.*whereas|whereas.*the.*parties|whereas.*the.*company|whereas.*the.*individual/i, reason: 'legal notice' }, // Legal notice format
    { pattern: /you.*are.*hereby.*directed|you.*are.*hereby.*informed|you.*are.*hereby.*requested/i, reason: 'legal notice' },
    { pattern: /failing.*which|failing.*to.*comply|failing.*to.*pay/i, reason: 'legal notice' },
    { pattern: /legal.*action|legal.*proceedings|legal.*remedy|legal.*consequences/i, reason: 'legal notice' },
  ];

  // Log extracted text for debugging (first 500 chars)
  console.log('[ContractValidation] Extracted text sample (first 500 chars):', text.substring(0, 500));
  console.log('[ContractValidation] Full text length:', text.length);
  
  // Check rejection patterns FIRST - if any match, immediately reject
  for (const { pattern, reason } of rejectionPatterns) {
    const match = pattern.test(text);
    if (match) {
      // Find the actual matching text
      const matchResult = text.match(pattern);
      console.log('[ContractValidation] ❌ REJECTION PATTERN MATCHED:', reason);
      console.log('[ContractValidation] Pattern:', pattern.toString());
      console.log('[ContractValidation] Matching text found:', matchResult ? matchResult[0] : 'pattern matched');
      console.log('[ContractValidation] Context around match:', text.substring(Math.max(0, text.indexOf(matchResult ? matchResult[0] : '') - 50), Math.min(text.length, text.indexOf(matchResult ? matchResult[0] : '') + 200)));
      return { isValid: false, reason };
    }
  }
  
  console.log('[ContractValidation] ✓ No rejection patterns found');
  
  // AGGRESSIVE: If document mentions "notice" at all, require strong brand deal context
  // Legal notices almost always use "notice" without brand deal terms
  if (/notice/i.test(text)) {
    // Require MULTIPLE brand deal indicators to override "notice" keyword
    const brandDealContextCount = [
      /brand|creator|influencer|collaboration|sponsorship/i,
      /deliverable|posts|videos|reels|stories|content/i,
      /payment|fee|compensation|amount payable/i,
      /campaign|timeline|deadline/i,
    ].filter(pattern => pattern.test(text)).length;
    
    // If "notice" appears but we don't have at least 2 brand deal context indicators, reject
    if (brandDealContextCount < 2) {
      console.log('[ContractValidation] Document contains "notice" with insufficient brand deal context - likely legal notice');
      console.log('[ContractValidation] Brand deal context count:', brandDealContextCount);
      console.log('[ContractValidation] Text sample:', text.substring(0, 500));
      return { isValid: false, reason: 'legal notice' };
    }
  }
  
  // Check for common legal notice phrases
  const legalNoticePhrases = [
    /you.*are.*hereby.*notified/i,
    /take.*notice.*that/i,
    /notice.*is.*hereby.*given/i,
    /whereas.*you.*have.*failed/i,
    /demand.*notice/i,
    /legal.*notice.*under/i,
  ];
  
  for (const phrase of legalNoticePhrases) {
    if (phrase.test(text)) {
      console.log('[ContractValidation] Legal notice phrase detected');
      return { isValid: false, reason: 'legal notice' };
    }
  }

  // Check for brand deal contract indicators - REQUIRE AT LEAST 2
  const brandDealIndicators = [
    // Deliverables
    /deliverable|posts|videos|reels|stories|content|deliverables/i,
    // Payment terms
    /payment|fee|compensation|amount payable|payment.*terms|payment.*schedule/i,
    // Campaign details
    /campaign|timeline|deadline|deliver by|term|campaign.*duration|campaign.*period/i,
    // Rights
    /usage rights|content rights|license|distribution rights|usage.*right|content.*right/i,
    // Exclusivity
    /exclusive|exclusivity|non-compete|non.*compete/i,
    // Collaboration terms
    /brand|creator|influencer|scope of work|collaboration|partnership|sponsorship/i,
  ];

  // Count how many brand deal indicators are present
  const indicatorCount = brandDealIndicators.filter(pattern => pattern.test(text)).length;

  // REQUIRE AT LEAST 2 indicators
  if (indicatorCount < 2) {
    console.log('[ContractValidation] Insufficient brand deal indicators found:', indicatorCount);
    console.log('[ContractValidation] Sample text:', text.substring(0, 500));
    return { 
      isValid: false, 
      reason: 'Document does not contain sufficient brand deal contract indicators (requires at least 2)' 
    };
  }

  console.log('[ContractValidation] Valid brand deal contract detected with', indicatorCount, 'indicators');
  return { isValid: true };
}

/**
 * Extracts text from a PDF file using FileReader and pdf.js
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error('File is empty or could not be read');
        }
        
        // Dynamically import pdf.js
        const pdfjsLib = await import('pdfjs-dist');
        
        // Try to set worker source - use multiple fallback options
        const pdfjsVersion = '5.4.449'; // Match installed version
        try {
          // Try CDN first
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
        } catch (workerError) {
          console.warn('[ContractValidation] Failed to set worker from CDN, trying alternative:', workerError);
          // Fallback to unpkg
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;
        }
        
        console.log('[ContractValidation] Loading PDF, size:', arrayBuffer.byteLength, 'bytes');
        
        // Load PDF with error handling
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          verbosity: 0 // Suppress warnings
        });
        
        const pdf = await loadingTask.promise;
        console.log('[ContractValidation] PDF loaded, pages:', pdf.numPages);
        
        // Extract text from all pages (limit to first 5 pages for performance)
        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 5);
        
        for (let i = 1; i <= maxPages; i++) {
          try {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str || '')
              .filter((str: string) => str.trim().length > 0)
              .join(' ');
            fullText += pageText + '\n';
            console.log(`[ContractValidation] Page ${i} extracted, text length:`, pageText.length);
          } catch (pageError) {
            console.warn(`[ContractValidation] Error extracting page ${i}:`, pageError);
            // Continue with other pages
          }
        }
        
        if (!fullText || fullText.trim().length === 0) {
          throw new Error('No text could be extracted from PDF. The PDF may contain only images.');
        }
        
        console.log('[ContractValidation] Total extracted text length:', fullText.length);
        resolve(fullText);
      } catch (error: any) {
        console.error('[ContractValidation] PDF extraction error:', error);
        reject(new Error(`PDF extraction failed: ${error.message || 'Unknown error'}`));
      }
    };
    
    reader.onerror = (e) => {
      console.error('[ContractValidation] FileReader error:', e);
      reject(new Error('Failed to read file. Please ensure the file is a valid PDF.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validates a PDF file to check if it's a brand deal contract
 */
export async function validateContractFile(file: File): Promise<{ isValid: boolean; error?: string }> {
  // Only validate PDFs
  if (file.type !== 'application/pdf') {
    // For non-PDF files, we can't validate client-side, but backend will validate
    // For now, reject non-PDFs to ensure only PDFs are accepted
    return { 
      isValid: false, 
      error: '⚠️ Only PDF files are supported for contract validation.\n\nPlease upload a PDF brand collaboration contract.' 
    };
  }
  
  try {
    console.log('[ContractValidation] Starting validation for file:', file.name, file.type, file.size);
    
    // Extract text from PDF
    let text: string;
    try {
      text = await extractTextFromPDF(file);
      console.log('[ContractValidation] Extracted text length:', text?.length || 0);
    } catch (extractionError: any) {
      console.error('[ContractValidation] PDF extraction failed:', extractionError);
      // If extraction fails, allow through to backend for validation
      // Backend has better PDF processing capabilities and can handle image-based PDFs
      // This prevents blocking valid brand deal contracts that might have extraction issues
      console.warn('[ContractValidation] Extraction failed, allowing through for backend validation');
      return {
        isValid: true, // Allow through, backend will validate
      };
    }
    
    // Check if we got any text
    if (!text || text.trim().length < 20) {
      console.warn('[ContractValidation] Insufficient text extracted:', text?.length || 0);
      // If we have some text (even minimal), STRICTLY check for rejection patterns
      if (text && text.trim().length > 0) {
        // AGGRESSIVE: Check for legal notice patterns even with minimal text
        const quickCheck = isValidBrandDealContract(text);
        if (!quickCheck.isValid) {
          console.warn('[ContractValidation] Rejected based on minimal text:', quickCheck.reason);
          return {
            isValid: false,
            error: '⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.'
          };
        }
        // Even if no rejection patterns, require at least ONE brand deal indicator with minimal text
        const hasAnyBrandDealIndicator = /brand|creator|influencer|collaboration|sponsorship|deliverable|payment|campaign|content|social.*media|posts|videos|reels|stories/i.test(text);
        if (!hasAnyBrandDealIndicator) {
          console.warn('[ContractValidation] Minimal text with no brand deal indicators - rejecting to be safe');
          return {
            isValid: false,
            error: '⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.'
          };
        }
        // If minimal text has brand deal indicators and no rejection patterns, allow through
        console.warn('[ContractValidation] Minimal text with brand deal indicators - allowing through for backend validation');
        return {
          isValid: true, // Allow through, backend will do full validation
        };
      } else {
        // If we truly can't extract any text, allow through to backend
        // Backend has better PDF processing and can handle image-based PDFs
        console.warn('[ContractValidation] No text extracted - allowing through for backend validation');
        return {
          isValid: true, // Allow through, backend will validate
        };
      }
    }
    
    // Validate
    const validation = isValidBrandDealContract(text);
    
    if (!validation.isValid) {
      console.warn('[ContractValidation] Validation failed:', validation.reason);
      console.log('[ContractValidation] Sample text:', text.substring(0, 500));
      return {
        isValid: false,
        error: '⚠️ This document does not appear to be a brand deal contract.\n\nThe Contract Scanner only supports influencer–brand collaboration agreements.\n\nPlease upload a brand deal contract.'
      };
    }
    
    console.log('[ContractValidation] Validation passed');
    return { isValid: true };
  } catch (error: any) {
    // If validation throws an unexpected error, reject to be safe
    // Don't allow potentially invalid documents through
    console.error('[ContractValidation] Unexpected validation error:', error);
    return {
      isValid: false,
      error: '⚠️ Failed to validate this PDF file.\n\nPlease ensure the file is a valid PDF with readable text.\n\nIf this is a brand deal contract, please try again or contact support.'
    };
  }
}

