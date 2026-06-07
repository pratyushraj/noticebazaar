import fetch from 'node-fetch';

const META_API_VERSION = 'v20.0';

interface SendMetaTemplatePayload {
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters?: Array<{ type: 'text'; text: string }>;
  headerImage?: string; // Optional URL for image header
  buttonUrlParameter?: string; // Optional dynamic URL parameter for a template button
}

/**
 * Send a WhatsApp Message Template directly using official Meta WhatsApp Cloud API
 */
export async function sendMetaWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en_US',
  bodyParameters = [],
  headerImage,
  buttonUrlParameter
}: SendMetaTemplatePayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      console.warn('[Meta WhatsApp] Credentials are not set in environment variables');
      return { success: false, error: 'Configuration missing' };
    }

    // Clean phone number: digits only
    let cleanPhone = to.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone; // Default to India prefix
    }

    const url = `https://graph.facebook.com/${META_API_VERSION}/${phoneId}/messages`;

    // Construct template components
    const components: any[] = [];

    // Body text parameters
    if (bodyParameters.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParameters
      });
    }

    // Header image parameter if present
    if (headerImage) {
      components.push({
        type: 'header',
        parameters: [
          {
            type: 'image',
            image: {
              link: headerImage
            }
          }
        ]
      });
    }

    // Dynamic button link parameter if present
    if (buttonUrlParameter) {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: '0', // 0-indexed position of the dynamic URL button
        parameters: [
          {
            type: 'text',
            text: buttonUrlParameter
          }
        ]
      });
    }

    const body = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode
        },
        components: components
      }
    };

    console.log(`[Meta WhatsApp] Dispatching template "${templateName}" to:`, cleanPhone);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json() as any;

    if (response.ok && data.messages?.[0]?.id) {
      console.log('[Meta WhatsApp] Message sent successfully! ID:', data.messages[0].id);
      return { success: true, messageId: data.messages[0].id };
    } else {
      console.error('[Meta WhatsApp] API Error Response:', data.error || data);
      return { success: false, error: data.error?.message || 'Failed to send WhatsApp message via Meta Cloud API' };
    }
  } catch (error: any) {
    console.error('[Meta WhatsApp] Exception during send:', error);
    return { success: false, error: error.message };
  }
}
