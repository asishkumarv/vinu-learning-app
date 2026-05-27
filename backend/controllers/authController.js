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

    // Check if user exists
    const userExist = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(mobile, { otp, name, type: 'register', expires: Date.now() + 600000 }); // 10 mins

    // Send OTP via WhatsApp
    await sendOTP(mobile, otp);

    res.status(200).json({ message: 'OTP sent to WhatsApp' });
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

    let user;

    if (stored.type === 'register') {
      // Create user (password is null)
      const newUser = await db.query(
        'INSERT INTO users (mobile, name) VALUES ($1, $2) RETURNING id, name, mobile',
        [mobile, stored.name]
      );
      user = newUser.rows[0];
    } else if (stored.type === 'login') {
      // Fetch existing user
      const existingUser = await db.query(
        'SELECT id, name, mobile FROM users WHERE mobile = $1',
        [mobile]
      );
      if (existingUser.rows.length === 0) {
        return res.status(404).json({ error: 'User record not found' });
      }
      user = existingUser.rows[0];
    } else {
      return res.status(400).json({ error: 'Invalid OTP type' });
    }

    // Clear OTP
    otps.delete(mobile);

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      message: stored.type === 'register' ? 'User registered successfully' : 'Login successful',
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

    const user = await db.query('SELECT id, name, mobile FROM users WHERE mobile = $1', [mobile]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found. Please register first.' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(mobile, { otp, type: 'login', expires: Date.now() + 600000 }); // 10 mins

    // Send OTP via WhatsApp
    await sendOTP(mobile, otp);

    res.status(200).json({ message: 'OTP sent to WhatsApp' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
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
