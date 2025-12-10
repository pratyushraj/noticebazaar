// Leegality eSign API Service
// Handles document upload, signing requests, and webhook verification

import crypto from 'crypto';

const LEEGALITY_BASE_URL = process.env.LEEGALITY_BASE_URL || 'https://sandbox.leegality.com/api/v3';
const LEEGALITY_AUTH_TOKEN = process.env.LEEGALITY_AUTH_TOKEN || '';
const LEEGALITY_PRIVATE_SALT = process.env.LEEGALITY_PRIVATE_SALT || '';
const LEEGALITY_WEBHOOK_SECRET = process.env.LEEGALITY_WEBHOOK_SECRET || '';

export interface LeegalitySigner {
  name: string;
  phone: string;
  email?: string;
  sequence: number; // 1 for first signer, 2 for second, etc.
}

export interface LeegalityDocumentRequest {
  pdfUrl: string;
  brandName: string;
  creatorName: string;
  brandPhone: string;
  creatorPhone: string;
  brandEmail?: string;
  creatorEmail?: string;
}

export interface LeegalityResponse {
  success: boolean;
  documentId?: string;
  signingUrl?: string;
  error?: string;
}

/**
 * Upload PDF to Leegality and create signing request
 */
export async function sendDocumentForSigning(
  request: LeegalityDocumentRequest
): Promise<LeegalityResponse> {
  try {
    // Step 1: Download PDF from URL
    const pdfResponse = await fetch(request.pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.statusText}`);
    }
    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

    // Step 2: Upload document to Leegality
    // Use form-data package for Node.js compatibility
    const FormData = (await import('form-data')).default;
    const uploadFormData = new FormData();
    uploadFormData.append('file', pdfBuffer, {
      filename: 'contract.pdf',
      contentType: 'application/pdf',
    });
    uploadFormData.append('name', `${request.brandName}_${request.creatorName}_Contract.pdf`);

    const uploadResponse = await fetch(`${LEEGALITY_BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEEGALITY_AUTH_TOKEN}`,
        ...uploadFormData.getHeaders(),
      },
      body: uploadFormData as any,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}));
      throw new Error(`Leegality upload failed: ${errorData.message || uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    const documentId = uploadData.document_id || uploadData.id;

    if (!documentId) {
      throw new Error('Leegality did not return a document ID');
    }

    // Step 3: Create signing request with two signers
    const signers = [
      {
        name: request.brandName,
        phone: request.brandPhone,
        email: request.brandEmail,
        sequence: 1,
        signer_type: 'signer',
      },
      {
        name: request.creatorName,
        phone: request.creatorPhone,
        email: request.creatorEmail,
        sequence: 2,
        signer_type: 'signer',
      },
    ];

    const signingRequest = {
      document_id: documentId,
      signers: signers,
      signing_order: 'sequential', // Brand signs first, then creator
      expiry_days: 30,
      send_notifications: true,
    };

    const signingResponse = await fetch(`${LEEGALITY_BASE_URL}/documents/${documentId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LEEGALITY_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signingRequest),
    });

    if (!signingResponse.ok) {
      const errorData = await signingResponse.json().catch(() => ({}));
      throw new Error(`Leegality signing request failed: ${errorData.message || signingResponse.statusText}`);
    }

    const signingData = await signingResponse.json();
    const signingUrl = signingData.signing_url || signingData.url;

    return {
      success: true,
      documentId: documentId,
      signingUrl: signingUrl,
    };
  } catch (error: any) {
    console.error('[Leegality] Error sending document:', error);
    return {
      success: false,
      error: error.message || 'Failed to send document to Leegality',
    };
  }
}

/**
 * Verify webhook signature from Leegality
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!LEEGALITY_WEBHOOK_SECRET) {
    console.warn('[Leegality] Webhook secret not configured, skipping signature verification');
    return true; // Allow in development
  }

  try {
    // Leegality uses HMAC-SHA256 for webhook signatures
    const expectedSignature = crypto
      .createHmac('sha256', LEEGALITY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('[Leegality] Signature verification error:', error);
    return false;
  }
}

/**
 * Download signed PDF from Leegality
 */
export async function downloadSignedPDF(documentId: string): Promise<Buffer | null> {
  try {
    const response = await fetch(`${LEEGALITY_BASE_URL}/documents/${documentId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LEEGALITY_AUTH_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download signed PDF: ${response.statusText}`);
    }

    const pdfBuffer = Buffer.from(await response.arrayBuffer());
    return pdfBuffer;
  } catch (error: any) {
    console.error('[Leegality] Error downloading signed PDF:', error);
    return null;
  }
}

/**
 * Get document status from Leegality
 */
export async function getDocumentStatus(documentId: string): Promise<{
  status: string;
  signed: boolean;
  signed_at?: string;
} | null> {
  try {
    const response = await fetch(`${LEEGALITY_BASE_URL}/documents/${documentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LEEGALITY_AUTH_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get document status: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      status: data.status || 'unknown',
      signed: data.status === 'signed' || data.signed === true,
      signed_at: data.signed_at || data.completed_at,
    };
  } catch (error: any) {
    console.error('[Leegality] Error getting document status:', error);
    return null;
  }
}

