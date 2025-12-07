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
  
  // Log extracted text for debugging (first 500 chars)
  console.log('[ContractValidation] Extracted text sample (first 500 chars):', text.substring(0, 500));
  console.log('[ContractValidation] Full text length:', text.length);
  
  // FIRST: Check for strong brand deal title/header (within first 300 chars)
  // If document title clearly says "brand deal" or "influencer agreement", prioritize that
  const titleText = text.substring(0, 300).toLowerCase();
  const hasStrongBrandDealTitle = /brand.*deal|influencer.*brand|creator.*brand|brand.*collaboration|influencer.*agreement|creator.*agreement|brand.*deal.*agreement|influencer.*collaboration/i.test(titleText);
  
  // STRICT REJECTION: Reject if ANY of these patterns appear
  // But be more lenient if we have a strong brand deal title
  const rejectionPatterns = [
    // Legal notices (including Zoomcar legal notices) - more comprehensive patterns
    { pattern: /legal notice|legal.*notice|cease and desist|court order|summons|subpoena|writ of|notice.*legal|under.*section.*138|section.*138|negotiable.*instrument|dishonour.*of.*cheque/i, reason: 'legal notice', skipIfStrongTitle: false },
    // Zoomcar specific patterns
    { pattern: /zoomcar|zoom.*car|booking.*id|booking.*number|vehicle.*number|rc.*number|registration.*number|chassis.*number|engine.*number/i, reason: 'legal notice', skipIfStrongTitle: false },
    // Notice patterns (if not in brand deal context)
    { pattern: /take.*notice|please.*take.*notice|you.*are.*hereby.*notified|notice.*is.*hereby|demand.*notice|legal.*demand/i, reason: 'legal notice', skipIfStrongTitle: true },
    // Common legal notice phrases
    { pattern: /whereas.*you.*have.*failed|you.*have.*failed.*to|default.*in.*payment|outstanding.*amount|due.*amount.*not.*paid/i, reason: 'legal notice', skipIfStrongTitle: false },
    // Vehicle/rental related (often in legal notices) - more specific
    { pattern: /vehicle.*damage.*charges|repair.*charges.*vehicle|towing.*charges|parking.*charges.*violation|rental.*charges.*outstanding/i, reason: 'legal notice', skipIfStrongTitle: false },
    // Consumer complaints
    { pattern: /consumer complaint|consumer forum|consumer court|consumer.*dispute|consumer.*redressal/i, reason: 'consumer complaint', skipIfStrongTitle: false },
    // Court documents
    { pattern: /case number|case no|petition|plaintiff|defendant|judgment|verdict|affidavit|fir|first information report/i, reason: 'court document', skipIfStrongTitle: false },
    // Car rental agreements or claims - more specific patterns
    { pattern: /car rental.*agreement|vehicle rental.*agreement|rental agreement.*vehicle|automobile.*rental.*agreement|vehicle.*lease.*agreement|booking id.*vehicle|registration no.*vehicle|repair estimate.*vehicle/i, reason: 'car rental document', skipIfStrongTitle: false },
    // Insurance policies/claims
    { pattern: /insurance claim|claim form|insurance policy|premium|coverage.*insurance|policy number|insurance.*claim/i, reason: 'insurance document', skipIfStrongTitle: false },
    // Government forms - CONTEXT-AWARE: only reject if clearly a form, not contract tax clauses
    { 
      pattern: /government form|tax form|income tax.*form|gst.*certificate|gst.*registration|pan.*card|aadhaar.*card|passport.*form/i, 
      reason: 'government form', 
      skipIfStrongTitle: true,
      contextCheck: (matchText: string, fullText: string) => {
        // Allow GST/TDS/PAN in contract contexts (tax compliance clauses)
        const contextLower = fullText.toLowerCase();
        const matchLower = matchText.toLowerCase();
        
        // Allow "GST/TDS" or "GST and TDS" - these are contract clauses
        if (/gst.*tds|gst\/tds|gst and tds|tds.*gst/i.test(contextLower)) {
          return false; // Don't reject - it's a contract tax clause
        }
        
        // Allow "PAN" or "GST" in payment/tax section contexts
        if (/payment.*gst|tax.*gst|gst.*standard|tds.*deduction|pan.*number|gst.*inclusive|tds.*applicable/i.test(contextLower)) {
          return false; // Don't reject - it's contract language about taxes
        }
        
        // Only reject if it's clearly about government forms/certificates
        if (/gst.*certificate|gst.*registration|pan.*card|aadhaar.*card|government form|tax form/i.test(contextLower)) {
          return true; // Reject - clearly a government form reference
        }
        
        // Default: allow through if context is ambiguous (might be contract clause)
        return false;
      }
    },
    // Employment agreements
    { pattern: /employment.*agreement|employee.*contract|job.*offer|employment.*letter|offer.*letter/i, reason: 'employment agreement', skipIfStrongTitle: false },
    // Invoices, receipts, bills - CONTEXT-AWARE: only reject if clearly a document type, not contract language
    { 
      pattern: /\b(invoice|receipt|bill|statement|quotation|estimate)\b|invoice.*number|bill.*number|payment.*receipt|tax.*receipt/i, 
      reason: 'invoice/receipt document', 
      skipIfStrongTitle: true,
      contextCheck: (matchText: string, fullText: string) => {
        // Allow "receipt" in contexts like "product receipt", "upon receipt", "delivery receipt"
        const contextLower = fullText.toLowerCase();
        const matchLower = matchText.toLowerCase();
        const matchIndex = contextLower.indexOf(matchLower);
        
        // If we can't find the match (shouldn't happen), be safe and allow through
        if (matchIndex === -1) return false; // Don't reject if we can't verify
        
        const beforeContext = contextLower.substring(Math.max(0, matchIndex - 40), matchIndex);
        const afterContext = contextLower.substring(matchIndex + matchLower.length, Math.min(contextLower.length, matchIndex + matchLower.length + 40));
        const fullContext = (beforeContext + ' [' + matchLower + '] ' + afterContext).toLowerCase();
        
        // If "receipt" appears in contract language context (product receipt, delivery receipt, etc.), allow it
        if (/product.*receipt|delivery.*receipt|upon.*receipt|after.*receipt|within.*receipt|days.*of.*receipt|of.*product.*receipt/i.test(fullContext)) {
          return false; // Don't reject - it's contract language
        }
        
        // If it's a word like "invoice" or "bill" as standalone terms, likely a document type
        if (/^\s*invoice\s*$|^\s*bill\s*$|^\s*statement\s*$|^\s*quotation\s*$|^\s*estimate\s*$/i.test(matchText.trim())) {
          return true; // Reject - standalone document type word
        }
        
        // Only reject if it's clearly about invoices/receipts as document types (not in contract context)
        if (/invoice.*number|bill.*number|payment.*receipt|tax.*receipt|invoice.*receipt|receipt.*number/i.test(fullContext)) {
          return true; // Reject - clearly a document type reference
        }
        
        // Default: allow through if context is ambiguous
        return false;
      }
    },
    // Agreement for rent
    { pattern: /agreement.*for.*rent|rent.*agreement|lease.*agreement.*rent/i, reason: 'rental agreement', skipIfStrongTitle: false },
    // Additional aggressive patterns for legal documents - only specific legal notice patterns
    { pattern: /whereas.*you.*have.*failed|whereas.*and.*whereas.*failed|whereas.*default/i, reason: 'legal notice', skipIfStrongTitle: false }, // Legal notice format (NOT normal contract "whereas the parties")
    { pattern: /you.*are.*hereby.*directed|you.*are.*hereby.*informed|you.*are.*hereby.*requested/i, reason: 'legal notice', skipIfStrongTitle: false },
    { pattern: /failing.*which|failing.*to.*comply|failing.*to.*pay/i, reason: 'legal notice', skipIfStrongTitle: false },
    { pattern: /legal.*action|legal.*proceedings|legal.*remedy|legal.*consequences/i, reason: 'legal notice', skipIfStrongTitle: false },
  ];
  
  // First, check for strong positive brand deal signals
  // If we have strong signals, be more lenient with rejection patterns
  const hasPayment = /payment|fee|compensation|amount payable|rupees|dollars|paid|payable/i.test(text);
  const hasDeliverables = /deliverable|posts|videos|reels|stories|content|instagram|youtube|tiktok|social.*media/i.test(text);
  const hasCollaboration = /brand|creator|influencer|collaboration|sponsorship|content creator/i.test(text);
  const hasStrongPositiveSignals = hasPayment && hasDeliverables && hasCollaboration;

  // Check rejection patterns - but skip certain ones if we have a strong brand deal title or strong positive signals
  for (const { pattern, reason, skipIfStrongTitle, contextCheck } of rejectionPatterns) {
    // Skip context-sensitive patterns if we have a strong brand deal title
    if (hasStrongBrandDealTitle && skipIfStrongTitle) {
      console.log(`[ContractValidation] Skipping pattern check for "${reason}" due to strong brand deal title`);
      continue;
    }
    
    const match = pattern.test(text);
    if (match) {
      // Find the actual matching text
      const matchResult = text.match(pattern);
      const matchText = matchResult ? matchResult[0] : '';
      
      // If there's a context check function, use it
      if (contextCheck) {
        const shouldReject = contextCheck(matchText, text);
        if (!shouldReject) {
          console.log(`[ContractValidation] Pattern matched "${matchText}" but context check passed - allowing`);
          continue;
        }
      }
      
      // If we have strong positive signals (payment + deliverables + collaboration),
      // be more lenient - only reject for very clear non-brand-deal documents
      if (hasStrongPositiveSignals && skipIfStrongTitle) {
        console.log(`[ContractValidation] Pattern matched "${matchText}" but strong positive signals detected - allowing`);
        continue;
      }
      
      // If we have a strong brand deal title, be more lenient with certain rejections
      // Allow GST/TDS/PAN in contract contexts even if pattern matches
      if (hasStrongBrandDealTitle && (reason === 'government form' || reason === 'invoice/receipt document')) {
        // Check if it's in a contract clause context (GST/TDS, payment terms, etc.)
        const matchIndex = text.toLowerCase().indexOf(matchText.toLowerCase());
        if (matchIndex !== -1) {
          const context = text.substring(Math.max(0, matchIndex - 30), Math.min(text.length, matchIndex + matchText.length + 30)).toLowerCase();
          if (/gst.*tds|gst\/tds|payment.*gst|tax.*gst|gst.*standard|tds.*standard|pan.*number/i.test(context)) {
            console.log(`[ContractValidation] Pattern matched "${matchText}" but it's a contract tax clause - allowing`);
            continue;
          }
        }
      }
      
      console.log('[ContractValidation] ❌ REJECTION PATTERN MATCHED:', reason);
      console.log('[ContractValidation] Pattern:', pattern.toString());
      console.log('[ContractValidation] Matching text found:', matchText);
      console.log('[ContractValidation] Context around match:', text.substring(Math.max(0, text.indexOf(matchText) - 50), Math.min(text.length, text.indexOf(matchText) + 200)));
      return { isValid: false, reason };
    }
  }
  
  console.log('[ContractValidation] ✓ No rejection patterns found');
  
  // Smart check: Only reject "notice" if it's in legal notice context, not normal contract language
  // Normal contracts use "written notice", "30 days notice", etc. which are fine
  // Legal notices use phrases like "take notice", "you are hereby notified", etc.
  const hasLegalNoticePhrases = [
    /you.*are.*hereby.*notified/i,
    /take.*notice.*that/i,
    /notice.*is.*hereby.*given/i,
    /legal.*notice/i,
    /demand.*notice/i,
  ].some(pattern => pattern.test(text));
  
  // Only check for "notice" if it's in legal notice context
  if (hasLegalNoticePhrases || (/notice/i.test(text) && !/written.*notice|days.*notice|advance.*notice|prior.*notice/i.test(text))) {
    // Check if it's clearly a contract with brand deal terms (not a legal notice)
    const hasContractIndicators = [
      /agreement|contract|terms.*and.*conditions/i,
      /brand|creator|influencer|collaboration|sponsorship/i,
      /deliverable|posts|videos|reels|stories|content/i,
      /payment|fee|compensation|amount payable/i,
    ].filter(pattern => pattern.test(text)).length;
    
    // Only reject if it looks like a legal notice (no contract indicators)
    if (hasContractIndicators < 2 && hasLegalNoticePhrases) {
      console.log('[ContractValidation] Document contains legal notice phrases without contract indicators');
      return { isValid: false, reason: 'legal notice' };
    }
  }
  
  // Check for common legal notice phrases (but allow if we have strong brand deal signals)
  const legalNoticePhrases = [
    /you.*are.*hereby.*notified/i,
    /take.*notice.*that/i,
    /notice.*is.*hereby.*given/i,
    /whereas.*you.*have.*failed/i,
    /demand.*notice/i,
    /legal.*notice.*under/i,
  ];
  
  // Check if any legal notice phrases are present
  const hasLegalNoticePhrase = legalNoticePhrases.some(phrase => phrase.test(text));
  
  if (hasLegalNoticePhrase) {
    // If it's clearly a brand deal contract, don't reject based on legal notice phrases alone
    const isClearBrandDeal = /brand.*deal|influencer.*brand|creator.*brand|brand.*collaboration/i.test(text.substring(0, 500));
    if (!isClearBrandDeal) {
      console.log('[ContractValidation] Legal notice phrase detected without clear brand deal context');
      return { isValid: false, reason: 'legal notice' };
    } else {
      console.log('[ContractValidation] Legal notice phrase found but document is clearly a brand deal contract - allowing');
    }
  }

  // If we have a strong brand deal title, validate it quickly
  if (hasStrongBrandDealTitle) {
    console.log('[ContractValidation] Strong brand deal title detected in document header');
    // If it has a strong title, require at least ONE additional indicator
    const hasAnyIndicator = /payment|deliverable|posts|videos|reels|campaign|content|compensation|fee|collaboration|sponsorship/i.test(text);
    if (hasAnyIndicator) {
      console.log('[ContractValidation] ✅ Valid brand deal contract - strong title + indicators');
      return { isValid: true };
    }
  }

  // Check for brand deal contract indicators - REQUIRE AT LEAST 2 (or 1 if we have clear signals)
  const brandDealIndicators = [
    // Deliverables (strong indicator)
    /deliverable|posts|videos|reels|stories|content|deliverables|instagram|youtube|tiktok|social.*media/i,
    // Payment terms (strong indicator)
    /payment|fee|compensation|amount payable|payment.*terms|payment.*schedule|rupees|dollars|paid|payable/i,
    // Campaign details
    /campaign|timeline|deadline|deliver by|term|campaign.*duration|campaign.*period|duration|timeline/i,
    // Rights
    /usage rights|content rights|license|distribution rights|usage.*right|content.*right|intellectual property/i,
    // Exclusivity
    /exclusive|exclusivity|non-compete|non.*compete/i,
    // Collaboration terms (this is very common, so count it)
    /brand|creator|influencer|scope of work|collaboration|partnership|sponsorship|content creator/i,
    // Additional common terms
    /agreement|contract|terms and conditions|clause|section/i,
  ];

  // Count how many brand deal indicators are present
  const indicatorCount = brandDealIndicators.filter(pattern => pattern.test(text)).length;

  // If we have payment + deliverables + collaboration terms, it's very likely a valid brand deal
  // Even if rejection patterns matched something minor
  if (hasPayment && hasDeliverables && hasCollaboration) {
    console.log('[ContractValidation] ✅ Strong positive signals: payment + deliverables + collaboration - valid brand deal');
    return { isValid: true };
  }

  // REQUIRE AT LEAST 2 indicators (more lenient)
  // Or if we have payment + deliverables (2 strong signals), accept it
  if (indicatorCount < 2 && !hasStrongBrandDealTitle) {
    // But allow if we have the two strongest indicators: payment + deliverables
    if (hasPayment && hasDeliverables) {
      console.log('[ContractValidation] ✅ Payment + Deliverables found - valid brand deal');
      return { isValid: true };
    }
    
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
        
        // Configure PDF.js worker with proper fallback
        // Version 5.x uses .mjs extension, try that first
        const pdfjsVersion = pdfjsLib.version || '5.4.449';
        
        // Use unpkg CDN - most reliable for PDF.js
        // For version 5.x, the worker is in build/pdf.worker.min.mjs
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;
        
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

