import { Resend } from 'resend';

/**
 * OTP Email Sender using Resend
 *
 * The client is lazily initialised so the module can be imported during
 * Next.js build / page-data collection without crashing when
 * RESEND_API_KEY is not yet available.
 */

let _resend: Resend | null = null;
function getResend(): Resend {
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

export async function sendOTPEmail(params: {
    to:               string;
    displayName:      string;
    otp:              string;
    ipAddress:        string;
    expiresInMinutes: number;
}): Promise<void> {
    const { to, displayName, otp, ipAddress, expiresInMinutes } = params;

    const subject = "Smart Tiffin Admin — Your login verification code";

    const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#f9f9f9;font-family:sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;
                  border:1px solid #e5e7eb;overflow:hidden;">
        
        <div style="background:#0A0B0D;padding:24px 32px;">
          <p style="margin:0;color:#00D4AA;font-size:13px;font-weight:600;
                    letter-spacing:2px;text-transform:uppercase;">Smart Tiffin</p>
          <p style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:500;">
            Admin Portal
          </p>
        </div>

        <div style="padding:32px;">
          <p style="margin:0 0 8px;color:#111;font-size:16px;font-weight:500;">
            Hello ${displayName},
          </p>
          <p style="margin:0 0 28px;color:#666;font-size:14px;line-height:1.6;">
            Here is your one-time verification code to complete your login.
          </p>

          <div style="background:#f4f4f5;border-radius:12px;padding:28px 24px;
                      text-align:center;margin-bottom:28px;">
            <p style="margin:0 0 8px;color:#888;font-size:12px;text-transform:uppercase;
                      letter-spacing:1.5px;">Verification Code</p>
            <span style="font-size:40px;font-weight:700;letter-spacing:14px;
                         font-family:monospace;color:#0A0B0D;">
              ${otp}
            </span>
          </div>

          <table style="width:100%;border-top:1px solid #e5e7eb;padding-top:20px;
                        margin-top:4px;font-size:13px;color:#666;">
            <tr>
              <td style="padding:4px 0;">⏱ Expires in</td>
              <td style="text-align:right;color:#111;font-weight:500;">
                ${expiresInMinutes} minutes
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">🌐 Login IP</td>
              <td style="text-align:right;font-family:monospace;color:#111;">
                ${ipAddress}
              </td>
            </tr>
          </table>

          <div style="margin-top:24px;padding:16px;background:#fff8f0;
                      border-radius:8px;border-left:3px solid #f59e0b;">
            <p style="margin:0;color:#92400e;font-size:13px;line-height:1.6;">
              If you did not attempt to log in, your credentials may be compromised.
              Do not share this code with anyone.
            </p>
          </div>
        </div>

        <div style="padding:16px 32px;background:#f9f9f9;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#aaa;font-size:12px;">
            Smart Tiffin Admin Portal — Restricted Access
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    try {
        // We use onboarding@resend.dev because custom domains require DNS verification on the free tier.
        const { data, error } = await getResend().emails.send({
            from: 'Smart Tiffin Admin <onboarding@resend.dev>',
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("[ADMIN OTP] Failed to send email via Resend:", error);
            // Fallback to console in case of delivery error so dev doesn't block
            console.log(`\nFallback [ADMIN OTP] Code: ${otp}\n`);
        } else {
            console.log(`[ADMIN OTP] Email sent successfully via Resend. ID: ${data?.id}`);
        }
    } catch (err) {
        console.error("[ADMIN OTP] Exception sending email:", err);
    }
}
