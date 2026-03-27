// MSG91 WhatsApp/SMS Service
// Handles sending OTP and Notifications via MSG91 API

interface Msg91SendResponse {
    type: string;
    message: string;
}

/**
 * Send OTP via MSG91 WhatsApp API
 * @param phoneNumber - Phone number with country code (e.g. 919999999999)
 * @param otp - 6-digit OTP code to send
 */
export async function sendOTPviaWhatsApp(
    phoneNumber: string,
    otp: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const authKey = process.env.MSG91_AUTH_KEY;
        const templateId = process.env.MSG91_WHATSAPP_TEMPLATE_ID;

        // Validate config
        if (!authKey || !templateId) {
            console.warn('[Msg91] API key or WhatsApp Template ID not configured');
            return { success: false, error: 'Configuration missing' };
        }

        // Clean phone number (keep digits only)
        let cleanPhone = phoneNumber.replace(/\D/g, '');

        // Ensure country code (default to 91 for India if length is 10)
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
        }

        // MSG91 OTP API URL (works for both SMS and WhatsApp if configured in template)
        // But for specific WhatsApp flow we use the same flow API with the WhatsApp template ID
        const url = 'https://control.msg91.com/api/v5/flow/';

        // Request body for Flow API
        const body = {
            template_id: templateId,
            recipients: [
                {
                    mobiles: cleanPhone,
                    otp: otp
                }
            ]
        };

        console.log('[Msg91] Sending WhatsApp OTP to:', cleanPhone);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'authkey': authKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json() as Msg91SendResponse;

        if (response.ok && data.type === 'success') {
            console.log('[Msg91] WhatsApp OTP sent successfully:', data.message);
            return { success: true, message: data.message };
        } else {
            console.error('[Msg91] API Error:', data);
            return { success: false, error: data.message || 'Failed to send WhatsApp OTP' };
        }

    } catch (error: any) {
        console.error('[Msg91] Exception:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send Collab Request Notification via MSG91 WhatsApp API
 * Uses distinct templates for Paid ("New Paid Collaboration Request") and Barter ("Product Collaboration Opportunity")
 */
export async function sendCollabRequestWhatsApp(
    phoneNumber: string,
    type: 'paid' | 'barter',
    data: {
        brand_name: string;
        value: string; // 'budget' for paid, 'product_value' for barter
        deliverables: string;
        timeline: string;
        action_url: string;
        accept_url?: string;
        decline_url?: string;
        counter_url?: string;
        image_url?: string;
    }
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        const authKey = process.env.MSG91_AUTH_KEY;

        // Select template based on type
        const templateId = type === 'paid'
            ? process.env.MSG91_PAID_COLLAB_TEMPLATE_ID
            : process.env.MSG91_BARTER_COLLAB_TEMPLATE_ID;

        // Validate config
        if (!authKey || !templateId) {
            console.warn('[Msg91] API key or Collab Template ID not configured for type:', type);
            return { success: false, error: 'Configuration missing' };
        }

        // Clean phone number
        let cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.length === 10) {
            cleanPhone = '91' + cleanPhone;
        }

        const url = 'https://control.msg91.com/api/v5/flow/';

        // Construct payload based on template type
        let recipientData: any = {
            mobiles: cleanPhone,
            brand_name: data.brand_name,
            deliverables: data.deliverables,
            timeline: data.timeline, // Used for deadline/timeline
            url: data.action_url, // Main action link (likely View Request)
            accept_link: data.accept_url, // For Accept button
            decline_link: data.decline_url, // For Decline button
            counter_link: data.counter_url, // For Counter button
            product_image: data.image_url // For Header Image (Barter)
        };

        if (type === 'paid') {
            // Paid Template Variables: brand_name, budget, deliverables, deadline, url, accept_link, decline_link, counter_link
            recipientData.budget = data.value;
            recipientData.deadline = data.timeline;
        } else {
            // Barter Template Variables: brand_name, product_value, deliverables, timeline, url, accept_link, decline_link, counter_link, product_image
            recipientData.product_value = data.value;
            recipientData.timeline = data.timeline;
        }

        const body = {
            template_id: templateId,
            recipients: [recipientData]
        };

        console.log(`[Msg91] Sending ${type} Collab Request WhatsApp to:`, cleanPhone);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'authkey': authKey,
                'content-type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const respData = await response.json() as Msg91SendResponse;

        if (response.ok && respData.type === 'success') {
            console.log(`[Msg91] ${type} Collab WhatsApp sent successfully:`, respData.message);
            return { success: true, message: respData.message };
        } else {
            console.error(`[Msg91] ${type} API Error:`, respData);
            return { success: false, error: respData.message || 'Failed to send Collab WhatsApp' };
        }

    } catch (error: any) {
        console.error('[Msg91] Exception:', error);
        return { success: false, error: error.message };
    }
}

// Kept for backward compatibility if needed, but redirects to WhatsApp logic if template is same
export const sendOTPviaSMS = sendOTPviaWhatsApp;
