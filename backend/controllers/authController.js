const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP, checkVerifyOTP, formatE164 } = require('../utils/twilio');

// In-memory OTP storage (for production, use Redis or DB table)
const otps = new Map();

/**
 * Standardize mobile number format (stores 10-digit number or formatted mobile)
 */
const cleanMobileNumber = (mobile) => {
  if (!mobile) return '';
  const digits = String(mobile).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  return digits;
};

/**
 * Helpers to get dummy test credentials from environment variables
 */
const getDummyMobile = () => cleanMobileNumber(process.env.DUMMY_MOBILE || '9999999999');
const getDummyOtp = () => String(process.env.DUMMY_OTP || '123456').trim();

/**
 * Register a new user after OTP verification
 */
exports.register = async (req, res) => {
  try {
    const rawMobile = req.body.mobile;
    const { name } = req.body;
    const mobile = cleanMobileNumber(rawMobile);

    if (!mobile || !name) {
      return res.status(400).json({ error: 'Mobile and name are required' });
    }

    const stored = otps.get(mobile);
    if (!stored || !stored.verified) {
      return res.status(400).json({ error: 'Mobile number not verified or verification expired' });
    }

    // Check if user already exists
    const userExist = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    if (userExist.rows.length > 0) {
      // User exists, return existing user
      const user = userExist.rows[0];
      otps.delete(mobile);
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.status(200).json({ message: 'User already exists, logged in successfully', token, user });
    }

    // Create user in PostgreSQL
    const newUser = await db.query(
      'INSERT INTO users (mobile, name) VALUES ($1, $2) RETURNING id, name, mobile, created_at',
      [mobile, name.trim()]
    );
    const user = newUser.rows[0];

    // Clear OTP verification session
    otps.delete(mobile);

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({ message: 'User registered successfully', token, user });
  } catch (error) {
    console.error('[Auth Register Error]:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
};

/**
 * Verify OTP code for Login / Registration
 */
exports.verifyOtp = async (req, res) => {
  try {
    const rawMobile = req.body.mobile;
    const inputOtp = String(req.body.otp || '').trim();
    const mobile = cleanMobileNumber(rawMobile);

    if (!mobile || !inputOtp) {
      return res.status(400).json({ error: 'Mobile number and OTP are required' });
    }

    const dummyMobile = getDummyMobile();
    const dummyOtp = getDummyOtp();

    const stored = otps.get(mobile);
    let isVerified = false;

    // 0. Check dummy test account credentials
    if (mobile === dummyMobile && inputOtp === dummyOtp) {
      isVerified = true;
    } else {
      // 1. Try checking against Twilio Verify API
      try {
        const verifyCheck = await checkVerifyOTP(mobile, inputOtp);
        if (verifyCheck === true) {
          isVerified = true;
        }
      } catch (e) {
        console.warn('[Twilio Verify] Verification check skipped or failed:', e.message);
      }

      // 2. Check local in-memory OTP fallback
      if (!isVerified && stored && stored.otp === inputOtp && stored.expires > Date.now()) {
        isVerified = true;
      }
    }

    if (!isVerified) {
      return res.status(400).json({ error: 'Invalid or expired OTP code' });
    }

    // Check if user exists in database
    let existingUser = await db.query(
      'SELECT id, name, mobile, created_at FROM users WHERE mobile = $1',
      [mobile]
    );

    // Auto-create dummy user in DB if it doesn't exist yet
    if (existingUser.rows.length === 0 && mobile === dummyMobile) {
      const newDummyUser = await db.query(
        'INSERT INTO users (mobile, name) VALUES ($1, $2) RETURNING id, name, mobile, created_at',
        [mobile, 'Dummy Account']
      );
      existingUser = newDummyUser;
    }

    if (existingUser.rows.length === 0) {
      // User doesn't exist -> Mark mobile as verified and instruct frontend to prompt for name
      otps.set(mobile, { verified: true, expires: Date.now() + 600000 });
      return res.status(200).json({ 
        message: 'OTP verified successfully. Please complete registration.', 
        isNewUser: true,
        mobile 
      });
    }

    // Existing user -> Complete login
    const user = existingUser.rows[0];
    otps.delete(mobile);

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      message: 'Login successful',
      isNewUser: false,
      token,
      user,
    });
  } catch (error) {
    console.error('[Auth Verify OTP Error]:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

/**
 * Request / Send OTP to WhatsApp
 */
exports.login = async (req, res) => {
  try {
    const rawMobile = req.body.mobile;
    const channel = req.body.channel || 'whatsapp';
    const mobile = cleanMobileNumber(rawMobile);

    if (!mobile || mobile.length < 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number' });
    }

    const dummyMobile = getDummyMobile();
    const dummyOtp = getDummyOtp();

    // Check if this request is for the dummy test account
    if (mobile === dummyMobile) {
      otps.set(mobile, { 
        otp: dummyOtp, 
        type: 'auth', 
        expires: Date.now() + 86400000 // 24 hours expiry for test account
      });
      console.log(`[Auth Login] Dummy mobile ${mobile} requested. Skipping Twilio dispatch.`);
      return res.status(200).json({ 
        message: 'OTP sent successfully to your WhatsApp number', 
        mobile,
        deliveryStatus: 'sent',
        mode: 'dummy'
      });
    }

    // Generate 6-digit OTP code for all other numbers
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(mobile, { 
      otp, 
      type: 'auth', 
      expires: Date.now() + 600000 // 10 minutes expiry
    });

    // Send via WhatsApp (or Twilio Verify)
    const result = await sendOTP(mobile, otp, channel);

    res.status(200).json({ 
      message: 'OTP sent successfully to your WhatsApp number', 
      mobile,
      deliveryStatus: result.status || 'sent',
      mode: result.mode
    });
  } catch (error) {
    console.error('[Auth Login / Send OTP Error]:', error);
    res.status(500).json({ error: 'Failed to dispatch OTP. Please try again.' });
  }
};

/**
 * Resend OTP
 */
exports.resendOtp = async (req, res) => {
  return exports.login(req, res);
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await db.query('SELECT id, name, mobile, created_at FROM users WHERE id = $1', [req.user.id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    const result = await db.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, mobile, created_at',
      [name.trim(), req.user.id]
    );
    res.status(200).json({ message: 'Profile updated', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Admin login
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const adminQuery = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (adminQuery.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = adminQuery.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, is_admin: true },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ message: 'Admin login successful', token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
