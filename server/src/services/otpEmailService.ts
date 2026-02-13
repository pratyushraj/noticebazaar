// OTP Email Service
// Sends OTP verification emails for contract signing

import { Resend } from 'resend';

// const resend = new Resend(process.env.RESEND_API_KEY); // Moved to function scope

export async function sendOTPEmail(email: string, otp: string): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
        console.error('[OTP Email] Missing RESEND_API_KEY');
        throw new Error('Email service not configured');
    }
    const resendClient = new Resend(process.env.RESEND_API_KEY);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0A0A0B;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0A0A0B; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #111114; border-radius: 24px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 0 40px; text-align: center;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                                Creator<span style="background: linear-gradient(135deg, #A78BFA 0%, #60A5FA 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Armour</span>
                            </h1>
                        </td>
                    </tr>

                    <!-- Icon -->
                    <tr>
                        <td style="padding: 30px 40px 20px 40px; text-align: center;">
                            <div style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, rgba(167, 139, 250, 0.2) 0%, rgba(96, 165, 250, 0.2) 100%); border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 17L12 22L22 17" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M2 12L12 17L22 12" stroke="#A78BFA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                        </td>
                    </tr>

                    <!-- Title -->
                    <tr>
                        <td style="padding: 0 40px 10px 40px; text-align: center;">
                            <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #FFFFFF;">Your Verification Code</h2>
                        </td>
                    </tr>

                    <!-- Description -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.5);">
                                Enter this code to verify your identity and sign the collaboration agreement.
                            </p>
                        </td>
                    </tr>

                    <!-- OTP Code -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px; text-align: center;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center">
                                        <div style="display: inline-block; background: rgba(167, 139, 250, 0.1); border: 2px solid rgba(167, 139, 250, 0.3); border-radius: 16px; padding: 24px 48px;">
                                            <span style="font-size: 42px; font-weight: 800; color: #A78BFA; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                                ${otp}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Expiry Notice -->
                    <tr>
                        <td style="padding: 0 40px 30px 40px; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.3); font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                ⏱ Expires in 10 minutes
                            </p>
                        </td>
                    </tr>

                    <!-- Security Notice -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 16px;">
                                <tr>
                                    <td style="text-align: center;">
                                        <p style="margin: 0; font-size: 11px; line-height: 1.5; color: rgba(239, 68, 68, 0.8); font-weight: 600;">
                                            🔒 Never share this code with anyone. CreatorArmour will never ask for your verification code.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px 40px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                            <p style="margin: 0 0 8px 0; font-size: 11px; color: rgba(255, 255, 255, 0.3);">
                                This email was sent by CreatorArmour
                            </p>
                            <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.2);">
                                If you didn't request this code, please ignore this email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    await resendClient.emails.send({
        from: 'CreatorArmour <contracts@creatorarmour.com>',
        to: email,
        subject: `${otp} is your CreatorArmour verification code`,
        html: html,
    });
}
