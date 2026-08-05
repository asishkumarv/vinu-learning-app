const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../utils/twilio');

// In-memory OTP storage (for production, use Redis or DB)
const otps = new Map();

exports.register = async (req, res) => {
  try {
    const { mobile, name } = req.body;

    if (!mobile || !name) {
      return res.status(400).json({ error: 'Mobile and name are required' });
    }

    const stored = otps.get(mobile);
    if (!stored || !stored.verified) {
      return res.status(400).json({ error: 'Mobile number not verified' });
    }

    // Check if user already exists just in case
    const userExist = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const newUser = await db.query(
      'INSERT INTO users (mobile, name) VALUES ($1, $2) RETURNING id, name, mobile',
      [mobile, name]
    );
    const user = newUser.rows[0];

    // Clear OTP
    otps.delete(mobile);

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.status(200).json({ message: 'User registered successfully', token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    
    const stored = otps.get(mobile);
    if (!stored || stored.otp !== otp || stored.expires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (stored.type !== 'auth') {
      return res.status(400).json({ error: 'Invalid OTP type' });
    }

    // Check if existing user
    const existingUser = await db.query(
      'SELECT id, name, mobile FROM users WHERE mobile = $1',
      [mobile]
    );

    if (existingUser.rows.length === 0) {
      // User doesn't exist, mark as verified and tell frontend to ask for name
      otps.set(mobile, { verified: true });
      return res.status(200).json({ 
        message: 'OTP verified, new user', 
        isNewUser: true 
      });
    }

    // User exists, login
    const user = existingUser.rows[0];

    // Clear OTP
    otps.delete(mobile);

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.status(200).json({
      message: 'Login successful',
      isNewUser: false,
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

exports.login = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ error: 'Mobile number is required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(mobile, { otp, type: 'auth', expires: Date.now() + 600000 }); // 10 mins

    // Send OTP via WhatsApp
    await sendOTP(mobile, otp);

    res.status(200).json({ message: 'OTP sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

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

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const result = await db.query(
      'UPDATE users SET name = $1 WHERE id = $2 RETURNING id, name, mobile',
      [name, req.user.id]
    );
    res.status(200).json({ message: 'Profile updated', user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

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
