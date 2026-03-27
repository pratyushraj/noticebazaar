/**
 * Utility functions for Indian pincode lookup
 * Fetches city and state information from pincode
 */

export interface PincodeData {
  pincode: string;
  city: string;
  state: string;
  district?: string;
  country: string;
}

/**
 * Fetch city and state from Indian pincode
 * Uses India Post API (free, no authentication required)
 */
/**
 * Fetch city and state from Indian pincode
 * Uses India Post API (free, no authentication required)
 * Added robust common NCR pincodes fallback
 */
export async function fetchPincodeData(pincode: string): Promise<PincodeData | null> {
  const cleanPincode = pincode.replace(/\D/g, '');

  if (cleanPincode.length !== 6) {
    return null;
  }

  // Hotfix: Common NCR pincodes fallback (in case API is flaky)
  const commonNcrPincodes: Record<string, Partial<PincodeData>> = {
    '201301': { city: 'Noida', state: 'Uttar Pradesh' },
    '201302': { city: 'Noida', state: 'Uttar Pradesh' },
    '201303': { city: 'Noida', state: 'Uttar Pradesh' },
    '201304': { city: 'Noida', state: 'Uttar Pradesh' },
    '201305': { city: 'Noida', state: 'Uttar Pradesh' },
    '201306': { city: 'Noida', state: 'Uttar Pradesh' },
    '201307': { city: 'Noida', state: 'Uttar Pradesh' },
    '201308': { city: 'Greater Noida', state: 'Uttar Pradesh' },
    '201309': { city: 'Greater Noida', state: 'Uttar Pradesh' },
    '201310': { city: 'Greater Noida', state: 'Uttar Pradesh' },
    '110001': { city: 'New Delhi', state: 'Delhi' },
    '110002': { city: 'New Delhi', state: 'Delhi' },
    '110045': { city: 'South West Delhi', state: 'Delhi' },
    '110091': { city: 'East Delhi', state: 'Delhi' },
    '110092': { city: 'East Delhi', state: 'Delhi' },
    '122001': { city: 'Gurgaon', state: 'Haryana' },
    '122002': { city: 'Gurgaon', state: 'Haryana' },
    '122003': { city: 'Gurgaon', state: 'Haryana' },
    '122018': { city: 'Gurgaon', state: 'Haryana' },
  };

  try {
    // Attempt API call first
    const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPincode}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (data && Array.isArray(data) && data.length > 0) {
        const postOffice = data[0];

        if (postOffice.Status === 'Success' && postOffice.PostOffice && postOffice.PostOffice.length > 0) {
          const firstOffice = postOffice.PostOffice[0];
          const district = (firstOffice.District || '').trim();
          const state = (firstOffice.State || '').trim();

          // Improved city selection: Block/Pincode is often better than broad District for Noida
          let city = district;
          if (district === 'Gautam Buddha Nagar' && cleanPincode.startsWith('2013')) {
            city = 'Noida'; // Prefer Noida for this district if pincode matches
          }

          return {
            pincode: cleanPincode,
            city: city,
            state: state,
            district: district,
            country: 'India',
          };
        }
      }
    }

    // Fallback to local data if API fails or returns no results
    if (commonNcrPincodes[cleanPincode]) {
      console.log('[PincodeLookup] Using local fallback for:', cleanPincode);
      return {
        pincode: cleanPincode,
        city: commonNcrPincodes[cleanPincode].city || 'City',
        state: commonNcrPincodes[cleanPincode].state || 'State',
        country: 'India',
      };
    }

    return null;
  } catch (error) {
    console.error('[PincodeLookup] Error fetching pincode data:', error);

    // Catch-all fallback even on network error
    if (commonNcrPincodes[cleanPincode]) {
      return {
        pincode: cleanPincode,
        city: commonNcrPincodes[cleanPincode].city || 'City',
        state: commonNcrPincodes[cleanPincode].state || 'State',
        country: 'India',
      };
    }

    return null;
  }
}

/**
 * Parse existing location string to extract address components
 * Attempts to extract city, state, and pincode from a formatted address string
 * Improved to handle structured addresses like "address, city, state, pincode"
 */
export function parseLocationString(location: string): {
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
} {
  if (!location || typeof location !== 'string') {
    return { addressLine: '', city: '', state: '', pincode: '' };
  }

  const trimmedLocation = location.trim();

  // Try to extract pincode (6 digits, usually at the end)
  const pincodeMatch = trimmedLocation.match(/\b(\d{6})\b/);
  const pincode = pincodeMatch ? pincodeMatch[1] : '';

  // Try to extract state (common Indian state names) - check for full state names
  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh'
  ];

  let state = '';
  for (const stateName of states) {
    // Use word boundary to match full state name
    const stateRegex = new RegExp(`\\b${stateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (stateRegex.test(trimmedLocation)) {
      state = stateName;
      break;
    }
  }

  // Improved city extraction: Try structured format first (comma-separated)
  // Format is usually: "address, city, state, pincode" or "address, city, state"
  let city = '';
  let addressLine = trimmedLocation;

  // If location has commas, try to parse as structured address
  if (trimmedLocation.includes(',')) {
    const parts = trimmedLocation.split(',').map(p => p.trim()).filter(p => p);

    // Last part is usually pincode (if it's 6 digits)
    // Second-to-last is usually state (if it matches a state name)
    // Third-to-last is usually city
    // Everything before that is address line

    if (parts.length >= 3) {
      // Check if last part is pincode
      const lastPart = parts[parts.length - 1];
      const isPincode = /^\d{6}$/.test(lastPart);

      // Check if second-to-last is state
      let stateIndex = -1;
      for (let i = parts.length - 1; i >= 0; i--) {
        for (const stateName of states) {
          if (parts[i] === stateName) {
            stateIndex = i;
            state = stateName; // Use the matched state
            break;
          }
        }
        if (stateIndex !== -1) break;
      }

      // City is usually the part before state
      if (stateIndex > 0) {
        city = parts[stateIndex - 1];
        // Address line is everything before city
        addressLine = parts.slice(0, stateIndex - 1).join(', ');
      } else if (parts.length >= 2) {
        // If no state found, assume second-to-last is city (if last is pincode)
        if (isPincode && parts.length >= 3) {
          city = parts[parts.length - 2];
          addressLine = parts.slice(0, parts.length - 2).join(', ');
        }
      }
    }
  }

  // Fallback: Try to extract city from common city names if not found yet
  if (!city) {
    const commonCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
      'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur',
      'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
      'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot',
      'Varanasi', 'Srinagar', 'Amritsar', 'Noida', 'Gurgaon', 'Chandigarh',
      'Gautam Buddha Nagar', 'Greater Noida', 'Faridabad', 'Gurugram'];

    for (const cityName of commonCities) {
      const cityRegex = new RegExp(`\\b${cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      if (cityRegex.test(trimmedLocation)) {
        city = cityName;
        break;
      }
    }
  }

  // If city was found but addressLine wasn't updated, clean it up
  if (city && !addressLine.includes(',')) {
    // Address line is everything except city, state, and pincode
    addressLine = trimmedLocation;
    if (city) {
      const cityRegex = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      addressLine = addressLine.replace(cityRegex, '').trim();
    }
    if (state) {
      const stateRegex = new RegExp(`\\b${state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      addressLine = addressLine.replace(stateRegex, '').trim();
    }
    if (pincode) {
      addressLine = addressLine.replace(pincode, '').trim();
    }
  }

  // Clean up extra commas and spaces in addressLine
  addressLine = addressLine.replace(/,\s*,+/g, ',').replace(/^,\s*|\s*,$/g, '').trim();

  // Log for debugging
  console.log('[PincodeLookup] Parsed location:', {
    original: trimmedLocation,
    addressLine,
    city,
    state,
    pincode
  });

  return { addressLine, city, state, pincode };
}

/**
 * Format address components into a single location string
 */
export function formatLocationString(
  addressLine: string,
  city: string,
  state: string,
  pincode: string
): string {
  const parts: string[] = [];

  if (addressLine.trim()) parts.push(addressLine.trim());
  if (city.trim()) parts.push(city.trim());
  if (state.trim()) parts.push(state.trim());
  if (pincode.trim()) parts.push(pincode.trim());

  return parts.join(', ');
}

