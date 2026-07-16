const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send';

/** EmailJS when EMAIL_PROVIDER=emailjs and keys are set. Otherwise OTP/logs go to the console. */
export const isEmailEnabled = () => {
  const enabled = process.env.EMAIL_PROVIDER === 'emailjs' &&
    Boolean(process.env.EMAILJS_SERVICE_ID) &&
    Boolean(process.env.EMAILJS_TEMPLATE_ID) &&
    Boolean(process.env.EMAILJS_PUBLIC_KEY);
  
  if (!enabled) {
    const reasons = [];
    if (process.env.EMAIL_PROVIDER !== 'emailjs') {
      reasons.push(`EMAIL_PROVIDER is '${process.env.EMAIL_PROVIDER}' (should be 'emailjs')`);
    }
    if (!process.env.EMAILJS_SERVICE_ID) reasons.push('EMAILJS_SERVICE_ID is missing');
    if (!process.env.EMAILJS_TEMPLATE_ID) reasons.push('EMAILJS_TEMPLATE_ID is missing');
    if (!process.env.EMAILJS_PUBLIC_KEY) reasons.push('EMAILJS_PUBLIC_KEY is missing');
    
    if (reasons.length > 0) {
      console.log('[email] EmailJS disabled because:', reasons.join(', '));
    }
  }
  
  return enabled;
};

const sendViaEmailJS = async (templateParams, templateId = null) => {
  const body = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: templateId || process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    template_params: templateParams,
  };
  if (process.env.EMAILJS_PRIVATE_KEY) {
    body.accessToken = process.env.EMAILJS_PRIVATE_KEY;
  }

  console.log('[emailjs] Attempting to send email...');
  console.log('[emailjs] Service ID:', process.env.EMAILJS_SERVICE_ID);
  console.log('[emailjs] Template ID:', body.template_id);
  console.log('[emailjs] Recipient:', templateParams.to_email);

  const res = await fetch(EMAILJS_API, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'User-Agent': 'DieraShop/1.0'
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error('[emailjs] API Error Response:', text);
    console.error('[emailjs] Status Code:', res.status);
    throw new Error(text || `EmailJS error ${res.status}`);
  }
  
  const responseData = await res.text().catch(() => 'OK');
  console.log('[emailjs] API Success Response:', responseData);
};

export const logOtpToConsole = (email, code) => {
  console.log('\n========================================');
  console.log('  DIERA SHOP — OTP (console mode)');
  console.log(`  Email: ${email}`);
  console.log(`  Code:  ${code}`);
  console.log('  Expires in 10 minutes');
  console.log('========================================\n');
};

export const sendEmail = async ({ to, subject, html, otpCode, templateParams = {}, templateId = null }) => {
  if (!isEmailEnabled()) {
    if (otpCode) logOtpToConsole(to, otpCode);
    else console.log(`[email console] To: ${to} | ${subject}`);
    return { ok: true, stub: true };
  }

  try {
    const params = {
      to_email: to,
      email: to, // Add this for EmailJS template's {{email}} variable
      to_name: templateParams.to_name || to.split('@')[0],
      user_email: to,
      reply_to: to,
      from_name: 'Diera Shop',
      subject: subject || 'Diera Shop Notification',
      message: html?.replace(/<[^>]+>/g, ' ') || subject || '',
      otp_code: otpCode || '',
      passcode: otpCode || '',
      ...templateParams,
    };
    
    console.log('[emailjs] Sending email to:', to);
    console.log('[emailjs] Template params:', JSON.stringify(params, null, 2));
    
    await sendViaEmailJS(params, templateId);
    console.log('[emailjs] Email sent successfully to:', to);
    return { ok: true, stub: false };
  } catch (err) {
    console.error('[emailjs] send failed, falling back to console:', err.message);
    if (otpCode) logOtpToConsole(to, otpCode);
    else console.log(`[email console] To: ${to} | ${subject}`);
    return { ok: true, stub: true, emailError: err.message };
  }
};

export const otpEmailHtml = (code) => `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fdf2f4;border-radius:12px;">
    <h2 style="color:#9d174d;">Diera Shop</h2>
    <p>Your verification code is:</p>
    <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#be185d;">${code}</p>
    <p style="color:#666;font-size:14px;">Expires in 10 minutes.</p>
  </div>
`;

export const orderEmailHtml = ({ orderId, total, status }) => `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fdf2f4;border-radius:12px;">
    <h2 style="color:#9d174d;">Diera Shop — Order Update</h2>
    <p>Order <strong>#${orderId.slice(-8)}</strong></p>
    <p>Total: <strong>रू ${total}</strong></p>
    <p>Status: <strong>${status}</strong></p>
    <p style="color:#666;font-size:14px;">Thank you for shopping with Diera Shop, Nepal.</p>
  </div>
`;

export const passwordResetEmailHtml = (resetLink, userName = 'there') => `
  <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fdf2f4;border-radius:12px;">
    <h2 style="color:#9d174d;">Diera Shop — Password Reset</h2>
    <p>Hi ${userName},</p>
    <p>You requested to reset your password. Click the button below to set a new password:</p>
    <div style="text-align:center;margin:30px 0;">
      <a href="${resetLink}" style="display:inline-block;padding:12px 32px;background:#be185d;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Reset Password</a>
    </div>
    <p style="color:#666;font-size:14px;">This link will expire in 1 hour.</p>
    <p style="color:#666;font-size:14px;">If you didn't request this, please ignore this email.</p>
    <p style="color:#999;font-size:12px;margin-top:30px;word-break:break-all;">Or copy and paste this link: ${resetLink}</p>
  </div>
`;
