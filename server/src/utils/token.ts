
import crypto from 'crypto';

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_JWT_SECRET || 'fallback-secret-key';

/**
 * Generates a URL-safe signed token for stateless verification
 * Payload format: version.requestId.action.expiry.signature
 */
export function generateActionToken(requestId: string, action: 'accept' | 'decline', expiresInHours = 24 * 7): string {
    const version = 'v1';
    const expiry = Date.now() + expiresInHours * 60 * 60 * 1000;
    const data = `${version}.${requestId}.${action}.${expiry}`;

    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(data)
        .digest('base64url');

    return `${data}.${signature}`;
}

/**
 * Verifies a signed token and returns payload if valid
 */
export function verifyActionToken(token: string): { valid: boolean; requestId?: string; action?: string; expired?: boolean } {
    try {
        const parts = token.split('.');
        if (parts.length !== 5) return { valid: false };

        const [version, requestId, action, expiryStr, signature] = parts;
        const data = `${version}.${requestId}.${action}.${expiryStr}`;

        const expectedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(data)
            .digest('base64url');

        if (signature !== expectedSignature) {
            return { valid: false };
        }

        const expiry = parseInt(expiryStr, 10);
        if (Date.now() > expiry) {
            return { valid: false, expired: true };
        }

        return { valid: true, requestId, action };
    } catch (err) {
        return { valid: false };
    }
}
