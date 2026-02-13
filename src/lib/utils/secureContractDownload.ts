/**
 * Utility for generating and using signed URLs for secure contract downloads
 * This replaces direct public URL access with time-limited signed URLs
 */

import { supabase } from '@/integrations/supabase/client';

export interface SignedUrlResponse {
    success: boolean;
    signedUrl: string;
    expiresIn: number | null;
    type: 'signed' | 'unsigned';
    legacy?: boolean; // Indicates if this is a legacy public URL
}

/**
 * Generate a signed URL for downloading a contract (authenticated)
 * @param dealId - The deal ID
 * @returns Promise with signed URL response
 */
export async function getSignedContractUrl(dealId: string): Promise<SignedUrlResponse> {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('Not authenticated');
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
            ? 'https://api.noticebazaar.com'
            : typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
                ? 'https://api.creatorarmour.com'
                : 'http://localhost:3001');

    const response = await fetch(`${apiBaseUrl}/api/contracts/signed-url`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ dealId })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate signed URL' }));
        throw new Error(error.error || 'Failed to generate signed URL');
    }

    return response.json();
}

/**
 * Generate a signed URL using a magic link token (unauthenticated)
 * @param token - The magic link token
 * @param type - Type of contract to download
 * @returns Promise with signed URL response
 */
export async function getSignedContractUrlWithToken(
    token: string,
    type: 'contract' | 'signed' = 'contract'
): Promise<SignedUrlResponse> {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ||
        (typeof window !== 'undefined' && window.location.origin.includes('noticebazaar.com')
            ? 'https://api.noticebazaar.com'
            : typeof window !== 'undefined' && window.location.origin.includes('creatorarmour.com')
                ? 'https://api.creatorarmour.com'
                : 'http://localhost:3001');

    const response = await fetch(`${apiBaseUrl}/api/contracts/signed-url-token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, type })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate signed URL' }));
        throw new Error(error.error || 'Failed to generate signed URL');
    }

    return response.json();
}

/**
 * Download a contract using a signed URL
 * @param dealId - The deal ID
 * @param filename - Optional custom filename
 */
export async function downloadContractSecure(dealId: string, filename?: string): Promise<void> {
    const urlResponse = await getSignedContractUrl(dealId);

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = urlResponse.signedUrl;
    link.download = filename || `contract-${dealId}.${urlResponse.type === 'signed' ? 'pdf' : 'docx'}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
}

/**
 * Download a contract using a magic link token
 * @param token - The magic link token
 * @param type - Type of contract to download
 * @param filename - Optional custom filename
 */
export async function downloadContractWithToken(
    token: string,
    type: 'contract' | 'signed' = 'contract',
    filename?: string
): Promise<void> {
    const urlResponse = await getSignedContractUrlWithToken(token, type);

    const link = document.createElement('a');
    link.href = urlResponse.signedUrl;
    link.download = filename || `contract-${type}.${type === 'signed' ? 'pdf' : 'docx'}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
}
