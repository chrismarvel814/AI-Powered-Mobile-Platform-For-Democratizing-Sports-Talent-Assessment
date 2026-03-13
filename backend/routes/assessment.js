const express = require('express');
const router = express.Router();
const { completeAssessment, getHistory } = require('../controllers/assessmentController');
const { protect } = require('../middleware/auth');

router.post('/complete', protect, completeAssessment);
router.get('/history', protect, getHistory);

module.exports = router;
