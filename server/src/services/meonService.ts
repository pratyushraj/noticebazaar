// MEON ESIGN SERVICE — COMPLETE REPLACEMENT FOR LEEGALITY

import crypto from 'crypto';

import { supabase } from '../index.js';

function getMeonConfig() {
  return {
    baseUrl: (process.env.MEON_BASE_URL || 'https://esign.meon.co.in').replace(/\/$/, ''),
    username: process.env.MEON_USERNAME || '',
    clientSecretKey: process.env.MEON_CLIENT_SECRET_KEY || '',
    webhookSecret: process.env.MEON_WEBHOOK_SECRET || '',
  };
}

export async function uploadPDF(buffer: Buffer, fileName: string) {
  try {
    const cfg = getMeonConfig();
    if (!cfg.username || !cfg.clientSecretKey) {
      return { success: false, error: 'Meon is not configured properly.' };
    }

    // Convert PDF buffer to base64
    const documentData = buffer.toString('base64');
    
    // Generate signature - using client_secret_key as signature
    // TODO: Verify with Meon if signature needs HMAC or other generation method
    const signature = cfg.clientSecretKey;
    
    const uploadUrl = `${cfg.baseUrl}/EsignServices/uploadPDF`;
    
    console.log('[Meon] Uploading PDF to:', uploadUrl);
    console.log('[Meon] Document name:', fileName);
    console.log('[Meon] Document size:', buffer.length, 'bytes');
    console.log('[Meon] Document size (base64):', documentData.length, 'chars');

    // Build webhook URL if available
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.WEBHOOK_HOST || 'localhost:3001';
    const webhookUrl = `${protocol}://${host}/api/esign/webhook`;

    const requestBody = {
      name: '',
      document_name: fileName,
      email: '',
      mobile: '',
      reason: 'Contract Signing',
      days_to_expire: '7',
      coordinate: [], // Empty for now - can be configured later if needed
      webhook: webhookUrl,
      redirect_url: '',
      cancel_redirect_url: '',
      esign_type: 'EKYC',
      remove_preview_pdf: false,
      need_name_match: false,
      debit: false,
      percentage_name_match: 80,
      need_aadhaar_match: false,
      aadhaar_number: '',
      need_gender_match: false,
      gender: '',
      document_data: documentData,
    };

    const axios = (await import('axios')).default;
    
    console.log('[Meon] Request details:', {
      url: uploadUrl,
      hasSignature: !!signature,
      signatureLength: signature?.length,
      documentSize: buffer.length,
      base64Size: documentData.length,
    });
    
    const res = await axios.post(uploadUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'signature': signature,
      },
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status code
    });

    console.log('[Meon] Upload response status:', res.status);
    console.log('[Meon] Upload response data:', JSON.stringify(res.data));

    // Check for error responses
    if (res.status >= 400) {
      const errorMsg = res.data?.message || res.data?.error || `HTTP ${res.status}: ${res.statusText}`;
      console.error('[Meon] API returned error status:', {
        status: res.status,
        statusText: res.statusText,
        error: errorMsg,
        fullResponse: res.data,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    // Check if response indicates an error in the data
    if (!res.data?.success && res.data?.message) {
      return {
        success: false,
        error: res.data.message || 'Meon API returned an error',
      };
    }

    // Meon returns token in response, not fileId
    const token = res.data?.token;
    const esignUrl = res.data?.esign_url;

    if (!token) {
      return {
        success: false,
        error: res.data?.message || 'No token received from Meon API',
      };
    }

    return {
      success: true,
      fileId: token, // Using token as fileId for compatibility with existing code
      token: token,
      esignUrl: esignUrl,
    };
  } catch (err: any) {
    console.error('[Meon] Upload error:', {
      message: err.message,
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: err.config?.url,
    });
    
    let errorMessage = err.message || 'Unknown error';
    if (err.response?.data) {
      if (typeof err.response.data === 'string') {
        errorMessage = err.response.data;
      } else if (err.response.data.message || err.response.data.error) {
        errorMessage = err.response.data.message || err.response.data.error;
      } else {
        errorMessage = JSON.stringify(err.response.data);
      }
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function createInvite(fileId: string, signers: any[], callbackUrl?: string) {
  // Meon returns esign_url directly from uploadPDF, so this function
  // is mainly for compatibility. The token from uploadPDF is the invitationId.
  // If Meon requires additional steps for multi-signer, implement here.
  try {
    // For now, just return the token as invitationId
    // The esign_url should already be set from uploadPDF response
    return {
      success: true,
      invitationId: fileId, // token from uploadPDF
      signUrl: '', // Will be set from uploadPDF response
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getInviteStatus(invitationId: string) {
  try {
    const cfg = getMeonConfig();
    const res = await fetch(`${cfg.baseUrl}/invite/${invitationId}`, {
      headers: {
        username: cfg.username,
        client_secret_key: cfg.clientSecretKey,
      },
    });

    if (!res.ok) return { success: false, error: 'Could not get invitation status.' };

    const data = await res.json();
    return {
      success: true,
      status: data?.status || data?.data?.status,
      data,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function downloadSignedPDF(invitationId: string) {
  try {
    const cfg = getMeonConfig();
    const res = await fetch(`${cfg.baseUrl}/invite/${invitationId}/signedDocument`, {
      headers: {
        username: cfg.username,
        client_secret_key: cfg.clientSecretKey,
      },
    });

    if (!res.ok) return { success: false, error: 'Could not download signed PDF.' };

    const buffer = Buffer.from(await res.arrayBuffer());
    return { success: true, pdfBuffer: buffer };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export function verifyWebhookSignature(req: any, body: string) {
  const cfg = getMeonConfig();
  if (!cfg.webhookSecret) return true; // Dev mode

  const signature = req.headers['x-meon-signature'];
  if (!signature) return false;

  const expected = crypto.createHmac('sha256', cfg.webhookSecret).update(body).digest('hex');
  return signature === expected;
}

export async function downloadPDFFromUrl(url: string): Promise<Buffer> {
  console.log('[Meon] Downloading PDF from URL:', url);
  
  // Try direct fetch first
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/pdf, */*',
      },
    });
    
    if (response.ok) {
      const buffer = Buffer.from(await response.arrayBuffer());
      console.log('[Meon] PDF downloaded successfully via direct fetch, size:', buffer.length, 'bytes');
      return buffer;
    }
    
    console.warn('[Meon] Direct fetch failed:', {
      status: response.status,
      statusText: response.statusText,
    });
  } catch (error: any) {
    console.warn('[Meon] Direct fetch error:', error.message);
  }
  
  // If Supabase URL and direct fetch failed, try Supabase Storage API
  if (url.includes('supabase.co') && url.includes('/storage/v1/object/public/') && supabase) {
    try {
      const urlMatch = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
      if (urlMatch) {
        const bucketName = urlMatch[1];
        let filePath = decodeURIComponent(urlMatch[2].split('?')[0]);
        
        console.log('[Meon] Trying Supabase Storage API:', { bucketName, filePath });
        
        const { data, error } = await supabase.storage
          .from(bucketName)
          .download(filePath);
        
        if (!error && data) {
          const buffer = Buffer.from(await data.arrayBuffer());
          console.log('[Meon] PDF downloaded successfully via Supabase Storage API, size:', buffer.length, 'bytes');
          return buffer;
        }
        
        console.error('[Meon] Supabase Storage API download failed:', error);
      }
    } catch (error: any) {
      console.error('[Meon] Supabase Storage API error:', error.message);
    }
  }
  
  throw new Error(`Failed to download PDF from URL: ${url}`);
}

