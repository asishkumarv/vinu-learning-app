const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOTP } = require('../utils/twilio');

// In-memory OTP storage (for production, use Redis or DB)
const otps = new Map();

exports.register = async (req, res) => {
  try {
    const { mobile, name, password } = req.body;

    // Check if user exists
    const userExist = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otps.set(mobile, { otp, name, password, expires: Date.now() + 600000 }); // 10 mins

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

    // Hash password
    const hashedPassword = await bcrypt.hash(stored.password, 10);

    // Create user
    const newUser = await db.query(
      'INSERT INTO users (mobile, name, password) VALUES ($1, $2, $3) RETURNING id, name, mobile',
      [mobile, stored.name, hashedPassword]
    );

    // Clear OTP
    otps.delete(mobile);

    // Generate JWT
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;

    const user = await db.query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.rows[0].password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        mobile: user.rows[0].mobile,
      },
    });
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
