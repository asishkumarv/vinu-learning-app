const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+15553704726';
const contentSid = process.env.TWILIO_CONTENT_SID;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client = null;
if (accountSid && accountSid.startsWith('AC') && authToken) {
  try {
    client = twilio(accountSid, authToken);
    console.log('[Twilio] Client initialized successfully.');
  } catch (err) {
    console.error('[Twilio] Failed to initialize Twilio client:', err.message);
  }
} else {
  console.warn('[Twilio] Credentials invalid or missing from environment.');
}

/**
 * Format mobile number to E.164 (e.g. +917036734568)
 */
const formatE164 = (mobile) => {
  if (!mobile) return '';
  let clean = String(mobile).replace(/\D/g, '');
  // Default to India (+91) if 10 digits
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return `+${clean}`;
};

/**
 * Send OTP via Approved WhatsApp Content Template, Twilio Verify, or SMS
 * @param {string} mobile - Recipient mobile number (e.g., 7036734568 or +917036734568)
 * @param {string} otp - 6-digit OTP code
 * @param {string} [preferredChannel='whatsapp'] - Channel ('whatsapp' or 'sms')
 */
const sendOTP = async (mobile, otp, preferredChannel = 'whatsapp') => {
  const formattedMobile = formatE164(mobile);
  console.log(`\n======================================\n[OTP] Dispatching OTP for ${formattedMobile} (Code: ${otp}) via ${preferredChannel}\n======================================\n`);

  if (!client) {
    console.warn('[OTP] Twilio client not available. Running in mock/development mode.');
    return { success: true, sid: 'mock-sid-development', mode: 'mock' };
  }

  const isPlaceholderWhatsApp = fromWhatsApp && (fromWhatsApp.includes('5553704726') || fromWhatsApp.includes('1555'));

  // Option 1: Send via Approved WhatsApp Authentication Content Template (if valid sender configured)
  if (preferredChannel === 'whatsapp' && fromWhatsApp && !isPlaceholderWhatsApp) {
    try {
      const toWhatsApp = `whatsapp:${formattedMobile}`;
      console.log(`[WhatsApp Template] Sending from ${fromWhatsApp} to ${toWhatsApp} using Content SID: ${contentSid || 'direct'}...`);

      const msgParams = {
        from: fromWhatsApp,
        to: toWhatsApp,
      };

      if (contentSid) {
        msgParams.contentSid = contentSid;
        msgParams.contentVariables = JSON.stringify({ "1": String(otp) });
      } else {
        msgParams.body = `Your Vinuh verification code is: ${otp}. Valid for 10 minutes.`;
      }

      const message = await client.messages.create(msgParams);
      console.log(`[WhatsApp Template] Dispatched successfully! SID: ${message.sid}, Status: ${message.status}`);
      return { success: true, sid: message.sid, mode: 'approved_whatsapp_template', status: message.status };
    } catch (templateError) {
      console.error('[WhatsApp Template Error]:', templateError.message, 'Code:', templateError.code);
    }
  } else if (preferredChannel === 'whatsapp' && isPlaceholderWhatsApp) {
    console.warn(`[WhatsApp Warning] TWILIO_WHATSAPP_NUMBER (${fromWhatsApp}) is a placeholder 555 number. Falling back to Twilio Verify SMS...`);
  }

  // Option 2: Fallback to Twilio Verify API (SMS)
  if (verifyServiceSid) {
    try {
      console.log(`[Twilio Verify Fallback] Requesting SMS verification for ${formattedMobile}...`);
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications.create({
          to: formattedMobile,
          channel: 'sms',
        });

      console.log(`[Twilio Verify] Verification created. SID: ${verification.sid}, Status: ${verification.status}`);
      return { success: true, sid: verification.sid, mode: 'verify_sms', status: verification.status };
    } catch (verifyError) {
      console.error('[Twilio Verify Error]:', verifyError.message);
    }
  }

  return { success: false, sid: 'dispatch-failed', error: 'All dispatch methods failed' };
};

/**
 * Verify OTP code via Twilio Verify API (optional check)
 * @param {string} mobile 
 * @param {string} code 
 */
const checkVerifyOTP = async (mobile, code) => {
  if (!client || !verifyServiceSid) {
    return null;
  }

  try {
    const formattedMobile = formatE164(mobile);
    const check = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedMobile,
        code: String(code).trim(),
      });

    return check.status === 'approved';
  } catch (error) {
    return null;
  }
};

module.exports = {
  sendOTP,
  checkVerifyOTP,
  formatE164,
};
