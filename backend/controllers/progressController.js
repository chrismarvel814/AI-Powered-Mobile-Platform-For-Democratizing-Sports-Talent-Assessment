const Assessment = require('../models/Assessment');

// ─── PROGRESS SUMMARY ────────────────────────────────────────
// GET /api/progress/summary
exports.getSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        const assessments = await Assessment.find({ userId }).sort({ createdAt: -1 });

        if (!assessments.length) {
            return res.json({
                success: true,
                data: {
                    totalAssessments: 0,
                    averageTalentScore: 0,
                    bestTalentScore: 0,
                    bestVelocity: 0,
                    consistencyStreak: 0,
                },
            });
        }

        const totalAssessments = assessments.length;

        let totalScore = 0;
        let maxScore = 0;
        let maxVelocity = 0;

        assessments.forEach(a => {
            const score = a.talentScore || 0;
            const vel = a.performanceMetrics?.maxVelocity || 0;
            totalScore += score;
            if (score > maxScore) maxScore = score;
            if (vel > maxVelocity) maxVelocity = vel;
        });

        const averageTalentScore = totalAssessments > 0 ? Math.round(totalScore / totalAssessments) : 0;

        // ── Consistency Streak (consecutive active days back from today) ───
        const uniqueDays = new Set(
            assessments.map(a => new Date(a.createdAt).toISOString().split('T')[0])
        );
        let consistencyStreak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];
            if (uniqueDays.has(key)) {
                consistencyStreak++;
            } else {
                break;
            }
        }

        res.json({
            success: true,
            data: {
                totalAssessments,
                averageTalentScore,
                bestTalentScore: maxScore,
                bestVelocity: maxVelocity,
                consistencyStreak,
            },
        });
    } catch (err) {
        console.error('Progress summary error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching progress summary.' });
    }
};

// ─── PROGRESS CHARTS ─────────────────────────────────────────
// GET /api/progress/charts
exports.getCharts = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 12; // Last 12 assessments

        const assessments = await Assessment.find({ userId })
            .sort({ createdAt: 1 }) // chronological order for charts
            .limit(limit);

        const talentScoreTrend = assessments.map((a) => a.talentScore || 0);
        const velocityTrend = assessments.map((a) => a.performanceMetrics?.maxVelocity || 0);
        const dates = assessments.map((a) => new Date(a.createdAt).toISOString().split('T')[0]);
        const drills = assessments.map((a) => a.drillType);

        res.json({
            success: true,
            data: {
                talentScoreTrend,
                velocityTrend,
                dates,
                drills,
            },
        });
    } catch (err) {
        console.error('Progress charts error:', err);
        res.status(500).json({ success: false, message: 'Server error fetching progress charts.' });
    }
};
