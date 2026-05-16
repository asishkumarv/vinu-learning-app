const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., 'whatsapp:+14155238886'

const client = twilio(accountSid, authToken);

const sendOTP = async (mobile, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your Vinu Learning App verification code is: ${otp}`,
      from: fromWhatsApp,
      to: `whatsapp:${mobile}`,
    });
    return message;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

module.exports = { sendOTP };
