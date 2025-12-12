// Fast2SMS OTP Service
// Handles sending OTP via Fast2SMS API

interface Fast2SMSSendOTPResponse {
  return: boolean;
  request_id: string;
  message?: string[];
}

/**
 * Send OTP via Fast2SMS API
 * @param phoneNumber - Phone number (10 digits, without country code)
 * @param otp - 6-digit OTP code
 * @returns Success status and request ID
 */
export async function sendOTP(
  phoneNumber: string,
  otp: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    
    if (!apiKey || apiKey === 'your_fast2sms_api_key_here' || apiKey.trim() === '') {
      console.error('[Fast2SMS] API key not configured or is placeholder');
      return {
        success: false,
        error: 'Fast2SMS API key is not configured. Please set FAST2SMS_API_KEY in server/.env with your actual API key from https://www.fast2sms.com',
      };
    }

    // Clean phone number (remove spaces, dashes, country code)
    const cleanPhone = phoneNumber.replace(/[\s\-+()]/g, '').replace(/^91/, '');
    
    if (cleanPhone.length !== 10) {
      return {
        success: false,
        error: `Invalid phone number format. Expected 10 digits, got ${cleanPhone.length}`,
      };
    }

    // Use DLT SMS API instead of OTP route (doesn't require website verification)
    const url = 'https://www.fast2sms.com/dev/bulkV2';
    
    // For DLT SMS, we need to use 'q' route with message template
    // Format: OTP message with the OTP code
    const message = `Your OTP for NoticeBazaar contract acceptance is ${otp}. This OTP is valid for 5 minutes. Do not share this OTP with anyone.`;
    
    const requestBody = {
      route: 'q', // DLT SMS route (doesn't require verification)
      message: message,
      numbers: cleanPhone,
    };

    console.log('[Fast2SMS] Sending OTP:', {
      url,
      phone: cleanPhone,
      otpLength: otp.length,
      hasApiKey: !!apiKey,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'authorization': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = `Fast2SMS API error: ${response.status} ${response.statusText}`;
      
      // Parse error response for better messages
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use as-is
      }
      
      // Provide helpful error messages for common issues
      if (response.status === 401) {
        errorMessage = 'Fast2SMS API authentication failed. Please check your FAST2SMS_API_KEY in server/.env. Get your API key from https://www.fast2sms.com';
      } else if (response.status === 402) {
        errorMessage = 'Fast2SMS account has insufficient balance. Please recharge your account.';
      } else if (response.status === 403) {
        errorMessage = 'Fast2SMS API access forbidden. Please check your API key permissions.';
      } else if (response.status === 400 && parsedError.message) {
        // Include Fast2SMS error message for 400 errors
        errorMessage = `Fast2SMS API error: ${parsedError.message}`;
      }
      
      console.error('[Fast2SMS] API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'missing',
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }

    const data: Fast2SMSSendOTPResponse = await response.json();
    
    console.log('[Fast2SMS] Response:', data);

    if (data.return === true) {
      return {
        success: true,
        requestId: data.request_id,
      };
    } else {
      return {
        success: false,
        error: data.message?.join(', ') || 'Failed to send OTP',
      };
    }
  } catch (error: any) {
    console.error('[Fast2SMS] Exception:', error);
    return {
      success: false,
      error: `Failed to send OTP: ${error.message || 'Unknown error'}`,
    };
  }
}

