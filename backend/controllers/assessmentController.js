const Assessment = require('../models/Assessment');

// ─── COMPLETE ASSESSMENT ──────────────────────────────────────
// POST /api/assessment/complete
exports.completeAssessment = async (req, res) => {
    try {
        const { drillType, motionTrackingData, performanceMetrics, biomechanicsAnalysis, talentScore, duration } = req.body;
        const userId = req.user.id;

        if (!drillType) {
            return res.status(400).json({ success: false, message: 'drillType is required.' });
        }

        // ── Save Assessment ──────────────────────────────────────
        const assessment = await Assessment.create({
            userId,
            drillType,
            motionTrackingData: motionTrackingData || [],
            performanceMetrics: performanceMetrics || {},
            biomechanicsAnalysis: biomechanicsAnalysis || {},
            talentScore: talentScore || 0,
            duration: duration || 0,
        });

        res.status(201).json({
            success: true,
            message: 'Assessment saved successfully.',
            data: {
                assessmentId: assessment._id,
                talentScore: assessment.talentScore,
            },
        });
    } catch (err) {
        console.error('Assessment error:', err);
        res.status(500).json({ success: false, message: 'Server error saving assessment.' });
    }
};

// ─── GET ASSESSMENT HISTORY ──────────────────────────────────
// GET /api/assessment/history
exports.getHistory = async (req, res) => {
    try {
        const assessments = await Assessment.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({ success: true, data: assessments });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error fetching history.' });
    }
};
