const db = require('../db');

module.exports = async (req, res, next) => {
  try {
    if (!req.user || !req.user.is_admin || !req.user.adminId) {
      return res.status(403).json({ error: 'Access denied, admin only' });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
