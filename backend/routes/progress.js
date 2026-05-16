const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

router.post('/update', auth, progressController.updateProgress);
router.get('/', auth, progressController.getUserProgress);

module.exports = router;
