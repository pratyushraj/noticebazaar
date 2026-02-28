// @ts-nocheck
// Leegality eSign API Service
// Handles document upload, signing invitations, and webhook verification

import crypto from 'crypto';
import { supabase } from '../lib/supabase.js';

// Read environment variables dynamically (not at module load time)
function getLeegalityConfig() {
  return {
    baseUrl: process.env.LEEGALITY_BASE_URL || 'https://sandbox.leegality.com/api/v3',
    authToken: process.env.LEEGALITY_AUTH_TOKEN || '',
    privateSalt: process.env.LEEGALITY_PRIVATE_SALT || '',
    webhookSecret: process.env.LEEGALITY_WEBHOOK_SECRET || '',
  };
}

export interface LeegalitySigner {
  name: string;
  phone: string;
  email?: string;
  authenticationType?: 'AADHAAR' | 'OTP' | 'DIGITAL_SIGNATURE';
}

export interface LeegalityUploadResponse {
  success: boolean;
  fileId?: string;
  error?: string;
}

export interface LeegalityInviteResponse {
  success: boolean;
  invitationId?: string;
  signUrl?: string;
  error?: string;
}

export interface LeegalityInviteStatus {
  success: boolean;
  status?: string;
  data?: any;
  error?: string;
}

export interface LeegalitySignedPDF {
  success: boolean;
  pdfBuffer?: Buffer;
  error?: string;
}

/**
 * Upload PDF to Leegality
 * POST https://sandbox.leegality.com/api/v3/upload
 */
export async function uploadPDF(
  buffer: Buffer,
  fileName: string
): Promise<LeegalityUploadResponse> {
  try {
    const config = getLeegalityConfig();
    
    if (!config.authToken || !config.privateSalt) {
      return {
        success: false,
        error: 'Leegality eSign is not configured. Please set LEEGALITY_AUTH_TOKEN and LEEGALITY_PRIVATE_SALT environment variables.',
      };
    }

    // Use form-data for multipart/form-data upload
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: fileName,
      contentType: 'application/pdf',
    });
    formData.append('fileName', fileName);

    // Ensure baseUrl doesn't have trailing slash
    const baseUrl = config.baseUrl.replace(/\/$/, '');
    const uploadUrl = `${baseUrl}/upload`;
    
    // Get form-data headers (includes Content-Type with boundary)
    const formHeaders = formData.getHeaders();
    const headers = {
      'Authorization': `token ${config.authToken}`,
      'salt': config.privateSalt,
      ...formHeaders,
    };

    console.log('[Leegality] Uploading PDF:', {
      url: uploadUrl,
      baseUrl: config.baseUrl,
      fileName,
      size: buffer.length,
      hasAuthToken: !!config.authToken,
      hasSalt: !!config.privateSalt,
      headers: Object.keys(headers),
      contentType: formHeaders['content-type'],
      authHeader: headers['Authorization']?.substring(0, 20) + '...',
    });

    // Use axios for better form-data handling (Node.js fetch has issues with form-data)
    const axios = (await import('axios')).default;
    
    let response: any;
    try {
      const axiosResponse = await axios.post(uploadUrl, formData, {
        headers: headers as any,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000, // 60 second timeout
      });
      
      // Convert axios response to fetch-like response for consistency
      response = {
        ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
        status: axiosResponse.status,
        statusText: axiosResponse.statusText || 'OK',
        json: async () => axiosResponse.data,
        text: async () => typeof axiosResponse.data === 'string' ? axiosResponse.data : JSON.stringify(axiosResponse.data),
        headers: new Headers(axiosResponse.headers as any),
      };
    } catch (axiosError: any) {
      // Handle axios errors
      const status = axiosError.response?.status || 500;
      const statusText = axiosError.response?.statusText || axiosError.message || 'Unknown error';
      const errorData = axiosError.response?.data || {};
      const errorText = typeof errorData === 'string' ? errorData : JSON.stringify(errorData);
      
      console.error('[Leegality] Axios upload error:', {
        status,
        statusText,
        error: axiosError.message,
        responseData: errorData,
        url: uploadUrl,
      });
      
      // Create a response-like object for error handling
      response = {
        ok: false,
        status,
        statusText,
        json: async () => errorData,
        text: async () => errorText,
        headers: new Headers(axiosError.response?.headers || {}),
      };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = response.statusText || 'Unknown error';
      
      // Log full response for debugging
      console.error('[Leegality] Upload failed - Full response:', {
        status: response.status,
        statusText: response.statusText,
        statusCode: response.status,
        url: uploadUrl,
        baseUrl: config.baseUrl,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText.substring(0, 1000),
        bodyLength: errorText.length,
        authTokenPrefix: config.authToken ? config.authToken.substring(0, 10) + '...' : 'missing',
        hasSalt: !!config.privateSalt,
      });
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorData.detail || errorData.error_message || errorMessage;
        console.error('[Leegality] Parsed error data:', errorData);
      } catch (e) {
        errorMessage = errorText || errorMessage;
        console.error('[Leegality] Error text (not JSON):', errorText.substring(0, 200));
      }

      // If 404, provide more specific guidance
      if (response.status === 404) {
        return {
          success: false,
          error: `Upload endpoint not found (404). URL: ${uploadUrl}. Please verify:
1. LEEGALITY_BASE_URL is correct (current: ${config.baseUrl})
2. The endpoint /upload exists at this base URL
3. Your Leegality account has access to the sandbox API
4. Check Leegality API documentation for the correct endpoint`,
        };
      }

      return {
        success: false,
        error: `Upload failed: ${errorMessage} (Status: ${response.status})`,
      };
    }

    const data = await response.json();
    console.log('[Leegality] Upload successful:', {
      fileId: data.fileId || data.id || data.file_id,
      response: data,
    });

    return {
      success: true,
      fileId: data.fileId || data.id || data.file_id || data.data?.fileId,
    };
  } catch (error: any) {
    console.error('[Leegality] Upload exception:', error);
    return {
      success: false,
      error: `Upload failed: ${error.message || error.toString()}`,
    };
  }
}

/**
 * Create eSign invitation
 * POST https://sandbox.leegality.com/api/v3/invite
 */
export async function createInvite(
  fileId: string,
  signers: LeegalitySigner[],
  callbackUrl?: string
): Promise<LeegalityInviteResponse> {
  try {
    const config = getLeegalityConfig();
    
    if (!config.authToken) {
      return {
        success: false,
        error: 'Leegality eSign is not configured. Please set LEEGALITY_AUTH_TOKEN environment variable.',
      };
    }

    const inviteUrl = `${config.baseUrl}/invite`;
    
    const requestBody: any = {
      fileId,
      signers: signers.map(signer => ({
        name: signer.name,
        email: signer.email || '',
        phone: signer.phone,
        authenticationType: signer.authenticationType || 'AADHAAR',
      })),
    };

    if (callbackUrl) {
      requestBody.callbackUrl = callbackUrl;
    }

    console.log('[Leegality] Creating invitation:', {
      url: inviteUrl,
      fileId,
      signersCount: signers.length,
      hasCallbackUrl: !!callbackUrl,
    });

    const response = await fetch(inviteUrl, {
      method: 'POST',
      headers: {
        'Authorization': `token ${config.authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = response.statusText || 'Unknown error';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }

      console.error('[Leegality] Create invite failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage,
        body: errorText.substring(0, 500),
      });

      return {
        success: false,
        error: `Create invite failed: ${errorMessage} (Status: ${response.status})`,
      };
    }

    const data = await response.json() as any;
    console.log('[Leegality] Invitation created:', {
      invitationId: data.invitationId || data.id || data.invitation_id || data.data?.invitationId,
      signUrl: data.signUrl || data.sign_url || data.data?.signUrl,
      response: data,
    });

    return {
      success: true,
      invitationId: data.invitationId || data.id || data.invitation_id || data.data?.invitationId,
      signUrl: data.signUrl || data.sign_url || data.data?.signUrl || data.url,
    };
  } catch (error: any) {
    console.error('[Leegality] Create invite exception:', error);
    return {
      success: false,
      error: `Create invite failed: ${error.message || error.toString()}`,
    };
  }
}

/**
 * Get invitation status
 * GET https://sandbox.leegality.com/api/v3/invite/{invitationId}
 */
export async function getInviteStatus(
  invitationId: string
): Promise<LeegalityInviteStatus> {
  try {
    const config = getLeegalityConfig();
    
    if (!config.authToken) {
      return {
        success: false,
        error: 'Leegality eSign is not configured.',
      };
    }

    const statusUrl = `${config.baseUrl}/invite/${invitationId}`;

    console.log('[Leegality] Checking invitation status:', {
      url: statusUrl,
      invitationId,
    });

    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `token ${config.authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = response.statusText || 'Unknown error';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }

      return {
        success: false,
        error: `Get status failed: ${errorMessage} (Status: ${response.status})`,
      };
    }

    const data = await response.json() as any;
    console.log('[Leegality] Invitation status:', {
      invitationId,
      status: data.status || data.data?.status,
      data,
    });

    return {
      success: true,
      status: data.status || data.data?.status || data.invitationStatus,
      data,
    };
  } catch (error: any) {
    console.error('[Leegality] Get status exception:', error);
    return {
      success: false,
      error: `Get status failed: ${error.message || error.toString()}`,
    };
  }
}

/**
 * Download signed PDF
 * GET https://sandbox.leegality.com/api/v3/invite/{invitationId}/signedDocument
 */
export async function downloadSignedPDF(
  invitationId: string
): Promise<LeegalitySignedPDF> {
  try {
    const config = getLeegalityConfig();
    
    if (!config.authToken) {
      return {
        success: false,
        error: 'Leegality eSign is not configured.',
      };
    }

    const downloadUrl = `${config.baseUrl}/invite/${invitationId}/signedDocument`;

    console.log('[Leegality] Downloading signed PDF:', {
      url: downloadUrl,
      invitationId,
    });

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Authorization': `token ${config.authToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let errorMessage = response.statusText || 'Unknown error';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorData.detail || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }

      return {
        success: false,
        error: `Download signed PDF failed: ${errorMessage} (Status: ${response.status})`,
      };
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    console.log('[Leegality] Signed PDF downloaded:', {
      invitationId,
      size: pdfBuffer.length,
    });

    return {
      success: true,
      pdfBuffer,
    };
  } catch (error: any) {
    console.error('[Leegality] Download signed PDF exception:', error);
    return {
      success: false,
      error: `Download signed PDF failed: ${error.message || error.toString()}`,
    };
  }
}

/**
 * Verify webhook signature
 * Uses LEEGALITY_WEBHOOK_SECRET to verify webhook authenticity
 */
export function verifyWebhookSignature(
  req: any,
  body: string
): boolean {
  try {
    const config = getLeegalityConfig();
    
    if (!config.webhookSecret) {
      console.warn('[Leegality] Webhook secret not configured, skipping signature verification');
      return true; // Allow if not configured (for development)
    }

    // Get signature from headers
    const signature = req.headers['x-leegality-signature'] || 
                     req.headers['x-signature'] ||
                     req.headers['signature'];

    if (!signature) {
      console.warn('[Leegality] No signature found in webhook headers');
      return false;
    }

    // Verify signature (HMAC SHA256)
    const expectedSignature = crypto
      .createHmac('sha256', config.webhookSecret)
      .update(body)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.error('[Leegality] Webhook signature verification failed:', {
        received: signature,
        expected: expectedSignature,
      });
    }

    return isValid;
  } catch (error: any) {
    console.error('[Leegality] Webhook signature verification exception:', error);
    return false;
  }
}

/**
 * Download PDF from URL (for contract file)
 * Handles Supabase Storage URLs and other sources
 */
export async function downloadPDFFromUrl(url: string): Promise<Buffer> {
  console.log('[Leegality] Downloading PDF from URL:', url);
  
  // Try direct fetch first
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/pdf, */*',
      },
    });
    
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      console.log('[Leegality] PDF downloaded successfully via direct fetch, size:', buffer.length, 'bytes');
      return buffer;
    }
    
    console.warn('[Leegality] Direct fetch failed:', {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error: any) {
    console.warn('[Leegality] Direct fetch error:', error.message);
  }
  
  // If Supabase URL and direct fetch failed, try Supabase Storage API
  if (url.includes('supabase.co') && url.includes('/storage/v1/object/public/') && supabase) {
    try {
      const urlMatch = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (urlMatch) {
        const bucketName = urlMatch[1];
        let filePath = decodeURIComponent(urlMatch[2].split('?')[0]);
        
        console.log('[Leegality] Trying Supabase Storage API:', { bucketName, filePath });
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(filePath);
        
        if (!error && data) {
          const buffer = Buffer.from(await data.arrayBuffer());
          console.log('[Leegality] PDF downloaded successfully via Supabase Storage API, size:', buffer.length, 'bytes');
          return buffer;
        }
        
        console.error('[Leegality] Supabase Storage API download failed:', error);
      }
    } catch (error: any) {
      console.error('[Leegality] Supabase Storage API error:', error.message);
    }
  }
  
  throw new Error(`Failed to download PDF from URL: ${url}`);
}
