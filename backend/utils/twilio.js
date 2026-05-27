const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+14155238886'

let client = null;
if (accountSid && accountSid.startsWith('AC') && authToken) {
  try {
    client = twilio(accountSid, authToken);
  } catch (err) {
    console.error('[OTP] Failed to initialize Twilio client:', err.message);
  }
} else {
  console.warn('[OTP] Twilio credentials invalid or missing from environment. Client not initialized.');
}

const sendOTP = async (mobile, otp) => {
  console.log(`\n======================================\n[OTP] Generated code for ${mobile}: ${otp}\n======================================\n`);
  
  if (!client || !fromWhatsApp) {
    console.warn('[OTP] Twilio client or from number not available. Skipping WhatsApp message dispatch.');
    return { sid: 'mock-sid-development' };
  }
  
  try {
    const message = await client.messages.create({
      body: `Your Vinu Learning App verification code is: ${otp}`,
      from: fromWhatsApp,
      to: `whatsapp:+91${mobile}`,
    });
    console.log(`[OTP] WhatsApp message sent successfully via Twilio. SID: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('[OTP] Error sending WhatsApp message via Twilio:', error.message);
    // Return a mock result instead of throwing to allow testing to continue
    return { sid: 'mock-sid-error-fallback' };
  }
};

module.exports = { sendOTP };
