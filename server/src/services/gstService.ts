import { supabase } from '../index.js';

export interface GSTCompanyData {
  legalName: string;
  tradeName?: string;
  address: string;
  state: string;
  gstStatus: 'Active' | 'Cancelled' | 'Suspended';
}

interface GSTCacheRecord {
  gstin: string;
  legal_name: string;
  trade_name: string | null;
  address: string;
  state: string;
  status: string;
  fetched_at: string;
}

/**
 * Validate GSTIN format (15 characters, uppercase alphanumeric)
 */
function validateGSTIN(gstin: string): boolean {
  if (!gstin || typeof gstin !== 'string') {
    return false;
  }
  const cleaned = gstin.trim().toUpperCase();
  // GSTIN is 15 characters: 2 state code + 10 PAN + 3 entity + 1 check digit
  return /^[0-9A-Z]{15}$/.test(cleaned);
}

/**
 * Normalize GSTIN (uppercase, trimmed)
 */
function normalizeGSTIN(gstin: string): string {
  return gstin.trim().toUpperCase();
}

/**
 * Check cache for GSTIN data
 * Returns cached data if it exists and is less than 30 days old
 */
async function getCachedGSTData(gstin: string): Promise<GSTCompanyData | null> {
  try {
    const normalizedGstin = normalizeGSTIN(gstin);
    
    const { data, error } = await supabase
      .from('gst_company_cache')
      .select('*')
      .eq('gstin', normalizedGstin)
      .single();

    if (error || !data) {
      return null;
    }

    const cacheRecord = data as GSTCacheRecord;
    const fetchedAt = new Date(cacheRecord.fetched_at);
    const now = new Date();
    const daysSinceFetch = (now.getTime() - fetchedAt.getTime()) / (1000 * 60 * 60 * 24);

    // Return cached data if less than 30 days old
    if (daysSinceFetch < 30) {
      return {
        legalName: cacheRecord.legal_name,
        tradeName: cacheRecord.trade_name || undefined,
        address: cacheRecord.address,
        state: cacheRecord.state,
        gstStatus: cacheRecord.status as 'Active' | 'Cancelled' | 'Suspended',
      };
    }

    return null;
  } catch (error) {
    console.error('[GSTService] Cache lookup error:', error);
    return null;
  }
}

/**
 * Save GST data to cache
 */
async function saveGSTDataToCache(gstin: string, data: GSTCompanyData): Promise<void> {
  try {
    const normalizedGstin = normalizeGSTIN(gstin);
    
    const cacheData = {
      gstin: normalizedGstin,
      legal_name: data.legalName,
      trade_name: data.tradeName || null,
      address: data.address,
      state: data.state,
      status: data.gstStatus,
      fetched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert (insert or update)
    const { error } = await supabase
      .from('gst_company_cache')
      .upsert(cacheData, {
        onConflict: 'gstin',
      });

    if (error) {
      console.error('[GSTService] Cache save error:', error);
      // Don't throw - caching failure shouldn't break the lookup
    }
  } catch (error) {
    console.error('[GSTService] Cache save error:', error);
    // Don't throw - caching failure shouldn't break the lookup
  }
}

/**
 * Call external GST API (gstincheck.co.in)
 * Maps API response to normalized format
 */
async function fetchGSTDataFromAPI(gstin: string): Promise<GSTCompanyData> {
  const apiKey = process.env.GSTINCHECK_API_KEY;
  if (!apiKey) {
    throw new Error('GST API key not configured');
  }

  const normalizedGstin = normalizeGSTIN(gstin);
  
  // Correct API endpoint format from Postman documentation:
  // GET https://sheet.gstincheck.co.in/check/{api-key}/{gstin-number}
  // API key and GSTIN are path parameters, not headers or query params
  const apiUrl = `https://sheet.gstincheck.co.in/check/${apiKey}/${normalizedGstin}`;
  
  console.log('[GSTService] Calling API:', apiUrl.replace(apiKey, '***'));
  
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Log response details for debugging
    console.log('[GSTService] API Response Status:', response.status);

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `GST API error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.text();
        console.error('[GSTService] API Error Response:', errorData);
        if (errorData && !errorData.includes('<!DOCTYPE')) {
          const parsed = JSON.parse(errorData);
          errorMessage = parsed.message || parsed.error || errorMessage;
        }
      } catch (e) {
        // Ignore parsing errors
      }

      if (response.status === 404) {
        throw new Error('GSTIN not found');
      }
      
      if (response.status === 401 || response.status === 403) {
        throw new Error('GST API authentication failed. Please check your API key.');
      }
      
      throw new Error(errorMessage);
    }

    // Success! Parse the response
    const apiData = await response.json();
    console.log('[GSTService] Successful API call');
    console.log('[GSTService] API response structure:', JSON.stringify(apiData).substring(0, 500));

    // Map API response to normalized format
    // Based on actual API response: { flag: true, message: "...", data: { lgnm, tradeNam, pradr: { adr, addr: { stcd } }, sts } }
    if (!apiData.flag || !apiData.data) {
      throw new Error(apiData.message || 'GSTIN not found');
    }
    
    const responseData = apiData.data;
    
    // Address: Use full address string from pradr.adr, or build from address object
    const addr = responseData.pradr?.addr || {};
    const fullAddress = responseData.pradr?.adr || 
      [
        addr.bno, // Door Number
        addr.bnm, // Building Name
        addr.st,  // Street
        addr.loc, // Location
        addr.city, // City
        addr.dst, // District
        addr.stcd, // State
        addr.pncd ? `- ${addr.pncd}` : '' // Pin Code
      ].filter(Boolean).join(', ') || '';
    
    // State: Extract from address object or parse from jurisdiction
    const state = addr.stcd || 
      (responseData.stj ? responseData.stj.split(',')[0]?.replace('State -', '').trim() : '') || 
      '';
    
    const normalizedData: GSTCompanyData = {
      legalName: responseData.lgnm || '', // Legal name
      tradeName: responseData.tradeNam || undefined, // Trade name
      address: fullAddress, // Full address string
      state: state, // State from address object
      gstStatus: responseData.sts === 'Active' || responseData.sts === 'ACTIVE'
        ? 'Active' 
        : responseData.sts === 'Cancelled' || responseData.sts === 'CANCELLED'
        ? 'Cancelled'
        : responseData.sts === 'Suspended' || responseData.sts === 'SUSPENDED'
        ? 'Suspended'
        : 'Active', // Default to Active
    };

    // Validate required fields
    if (!normalizedData.legalName || !normalizedData.address || !normalizedData.state) {
      console.error('[GSTService] Invalid API response - missing required fields:', {
        legalName: normalizedData.legalName,
        address: normalizedData.address,
        state: normalizedData.state,
        rawResponse: apiData
      });
      throw new Error('Invalid API response: missing required fields');
    }

    return normalizedData;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch GST data from API');
  }
}

/**
 * Main function to lookup GST company data
 * Checks cache first, then API if needed
 */
export async function lookupGSTCompany(gstin: string): Promise<GSTCompanyData> {
  // Validate GSTIN format
  if (!validateGSTIN(gstin)) {
    throw new Error('Invalid GSTIN format. Must be 15 characters (uppercase alphanumeric).');
  }

  const normalizedGstin = normalizeGSTIN(gstin);

  // Check cache first
  const cachedData = await getCachedGSTData(normalizedGstin);
  if (cachedData) {
    console.log(`[GSTService] Cache hit for GSTIN: ${normalizedGstin}`);
    return cachedData;
  }

  // Cache miss or expired - fetch from API
  console.log(`[GSTService] Cache miss for GSTIN: ${normalizedGstin}, fetching from API`);
  const apiData = await fetchGSTDataFromAPI(normalizedGstin);

  // Save to cache (async, don't wait)
  saveGSTDataToCache(normalizedGstin, apiData).catch(err => {
    console.error('[GSTService] Failed to cache GST data:', err);
  });

  return apiData;
}

