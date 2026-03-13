const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Drill display labels ───────────────────────────────────────
const DRILL_LABELS = {
    vertical_jump: 'Vertical Jump',
    sprint_40_yard: '40-Yard Sprint',
    broad_jump: 'Broad Jump',
    agility_cone_drill: 'Agility Cone Drill',
    reaction_time_test: 'Reaction Time Test',
    lateral_movement_test: 'Lateral Movement Test',
};

// ── Specialized Coaching Guidelines ──────────────────────────────
const DRILL_COACHING_GUIDELINES = {
    vertical_jump: `
        - Focus on "Explosive Power" and "Triple Extension" (hips, knees, ankles).
        - Analyze the takeoff speed and vertical height.
        - Coach on the importance of the arm swing for momentum.
        - Give advice on landing softly to protect joints.
    `,
    sprint_40_yard: `
        - Focus on the "Drive Phase" (initial 0-10 yards) vs "Top End Speed".
        - Analyze acceleration curve and stride frequency.
        - Coach on staying low during the start and the transition to an upright posture.
        - Mention arm carriage and core stability.
    `,
    broad_jump: `
        - Focus on "Horizontal Explosive Power" and "Hip Hinge".
        - Analyze the launch angle and total displacement.
        - Coach on the "stick" (stable landing) — balance is as critical as distance.
        - Mention using the whole core to pull the legs forward in mid-air.
    `,
    agility_cone_drill: `
        - Focus on "Change of Direction Speed" (CODS) and "Center of Gravity".
        - Analyze deceleration into turns and explosive re-acceleration out of them.
        - Coach on footwork (short, choppy steps) and staying low for better leverage.
        - Mention looking toward the next target rather than at the ground.
    `,
    reaction_time_test: `
        - Focus on "Cognitive-Motor Coupling" and "First-Step Explosiveness".
        - Analyze the delay between stimulus and initial movement.
        - Coach on the "anticipatory stance" and minimizing wasted movement.
        - Mention the mental focus required to shave milliseconds off the start.
    `,
    lateral_movement_test: `
        - Focus on "Hip Fluidity" and "Weight Transfer".
        - Analyze lateral velocity and the efficiency of the push-off leg.
        - Coach on maintaining a wide base and avoiding "crossing over" the feet.
        - Mention the role of the lead leg in pulling the body across.
    `,
};

// ── Math fallback (used when Gemini is unavailable) ────────────
function mathFallbackAnalysis(metrics, biomechanicsAnalysis, drillType, primarySport) {
    const detectedMaxVel = metrics?.maxVelocity || 0;
    const detectedTime = Number(metrics?.time) || 0;

    if (detectedMaxVel < 15 || detectedTime < 0.2) {
        return {
            talentScore: 0,
            speedAssessment: 'Invalid Motion',
            explosivePowerAssessment: 'Invalid Motion',
            agilityAssessment: 'Invalid Motion',
            biomechanicsAssessment: 'Invalid Motion',
            athleticPotential: 'N/A - Invalid Attempt',
            coachInsight: 'No significant movement was detected. Please ensure your full body is visible and perform the drill with maximum effort.',
            timestamp: new Date().toISOString(),
        };
    }

    let basePower = 50, baseSpeed = 50, baseAgility = 50, baseBiomechanics = 50;
    if (metrics?.maxVelocity) basePower += (metrics.maxVelocity * 1.0);
    if (metrics?.time) {
        const timeBonus = Math.min(60, (20 / (detectedTime || 1)));
        baseSpeed += timeBonus;
        baseAgility += timeBonus;
    }
    if (biomechanicsAnalysis?.formScore) baseBiomechanics = biomechanicsAnalysis.formScore;

    baseSpeed = Math.min(100, Math.max(0, baseSpeed));
    basePower = Math.min(100, Math.max(0, basePower));
    baseAgility = Math.min(100, Math.max(0, baseAgility));
    baseBiomechanics = Math.min(100, Math.max(0, baseBiomechanics));

    let wS = 1, wP = 1, wA = 1;
    if (primarySport === 'basketball') { wP = 1.5; wA = 1.2; }
    else if (primarySport === 'football') { wS = 1.5; wA = 1.5; wP = 1.2; }
    else if (primarySport === 'soccer') { wA = 1.5; wS = 1.4; wP = 0.9; }
    else if (primarySport === 'track_and_field') { wS = 1.8; wP = 1.3; wA = 0.8; }

    const totalWeight = wS + wP + wA + 1;
    const finalTalentScore = Math.min(100, Math.round(
        ((baseSpeed * wS) + (basePower * wP) + (baseAgility * wA) + baseBiomechanics) / totalWeight
    ));

    const evaluateStat = (v) => v >= 90 ? 'Elite' : v >= 80 ? 'Good' : v >= 60 ? 'Moderate' : 'Below Average';
    let athleticPotential = 'Moderate';
    if (finalTalentScore >= 95) athleticPotential = 'Elite';
    else if (finalTalentScore >= 85) athleticPotential = 'High';

    return {
        talentScore: finalTalentScore,
        speedAssessment: evaluateStat(baseSpeed),
        explosivePowerAssessment: evaluateStat(basePower),
        agilityAssessment: evaluateStat(baseAgility),
        biomechanicsAssessment: evaluateStat(baseBiomechanics),
        athleticPotential,
        coachInsight: `Your ${DRILL_LABELS[drillType] || drillType} yielded a Talent Score of ${finalTalentScore}/100.`,
        timestamp: new Date().toISOString(),
    };
}

/**
 * @route POST /api/analyze
 * @desc  AI-powered sports talent analysis via Gemini 2.5 Flash
 * @access Private
 */
router.post('/', protect, async (req, res) => {
    try {
        const { drillType, performanceMetrics, biomechanicsAnalysis } = req.body;
        const metrics = performanceMetrics;
        const user = await User.findById(req.user.id);
        const primarySport = user?.primarySport || 'other';
        const drillLabel = DRILL_LABELS[drillType] || drillType;
        const specializedGuidelines = DRILL_COACHING_GUIDELINES[drillType] || 'Provide general sports coaching advice.';

        console.log('--- ANALYZE ENDPOINT TRIGGERED ---');
        console.log('Drill:', drillLabel, '| Sport:', primarySport);
        console.log('Metrics:', metrics);

        // ── Invalid movement guard ────────────────────────────────
        const detectedMaxVel = metrics?.maxVelocity || 0;
        const detectedTime = Number(metrics?.time) || 0;

        if (detectedMaxVel < 15 || detectedTime < 0.2) {
            console.log('⚠️ Invalid motion — returning 0 score.');
            return res.status(200).json({
                success: true,
                model: 'Motion-Validator-v1',
                evaluation: {
                    talentScore: 0,
                    speedAssessment: 'Invalid Motion',
                    explosivePowerAssessment: 'Invalid Motion',
                    agilityAssessment: 'Invalid Motion',
                    biomechanicsAssessment: 'Invalid Motion',
                    athleticPotential: 'N/A — Invalid Attempt',
                    coachInsight: 'No significant movement was detected. Please ensure your full body is in frame and perform the drill with maximum effort.',
                    timestamp: new Date().toISOString(),
                },
            });
        }

        // ── Gemini AI Analysis ────────────────────────────────────
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.warn('⚠️ GEMINI_API_KEY not set — using math fallback.');
            return res.status(200).json({
                success: true,
                model: 'Sports-Talent-Fallback-v1',
                evaluation: mathFallbackAnalysis(metrics, biomechanicsAnalysis, drillType, primarySport),
            });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
You are an elite sports science AI and talent scout. Analyze this athlete's performance data and provide a comprehensive, highly personalized scouting report.

## Athlete Profile
- Primary Sport: ${primarySport}
- Selected Drill: ${drillLabel}

## Performance Metrics (captured via 2D pose tracking)
- Overall Peak Velocity: ${metrics?.maxVelocity || 0}
- Peak Vertical Velocity (Y-axis): ${metrics?.maxVerticalVelocity || 0}
- Peak Horizontal Velocity (X-axis): ${metrics?.maxHorizontalVelocity || 0}
- Session Duration: ${detectedTime}s
- Biomechanics / Form Score: ${biomechanicsAnalysis?.formScore ?? 50}/100

## Expert Coaching Guidelines for this Drill
${specializedGuidelines}

## Context
These metrics are captured from a 2D webcam using MediaPipe pose landmarks. Max Velocity represents peak normalized hip displacement. Vertical and Horizontal components are provided for deeper biomechanical insight into power and speed.

## Your Task
Analyze this data and return ONLY a valid JSON object in this exact structure:

{
  "talentScore": <integer 0-100, overall weighted talent score for this sport>,
  "speedAssessment": <"Elite" | "Good" | "Moderate" | "Below Average">,
  "explosivePowerAssessment": <"Elite" | "Good" | "Moderate" | "Below Average">,
  "agilityAssessment": <"Elite" | "Good" | "Moderate" | "Below Average">,
  "biomechanicsAssessment": <"Elite" | "Good" | "Moderate" | "Below Average">,
  "athleticPotential": <"Elite" | "High" | "Moderate" | "Developing">,
  "coachInsight": <3-5 sentence personalized coaching insight. Use the Expert Coaching Guidelines provided above to sound authentic and highly specific to this drill. Focus on one strength, one growth area, and one technical improvement.>
}
`;

        console.log('🤖 Calling Gemini 2.5 Flash...');
        const result = await model.generateContent(prompt);
        const rawText = result.response.text().trim();
        console.log('✅ Gemini response received.');

        // Strip any markdown code fences if present
        const jsonText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();

        let evaluation;
        try {
            evaluation = JSON.parse(jsonText);
        } catch (parseErr) {
            console.error('❌ Failed to parse Gemini JSON, using fallback:', parseErr.message);
            console.error('Raw Gemini output:', rawText);
            evaluation = mathFallbackAnalysis(metrics, biomechanicsAnalysis, drillType, primarySport);
        }

        // Ensure timestamp is always present
        evaluation.timestamp = new Date().toISOString();

        return res.status(200).json({
            success: true,
            model: 'Gemini-2.5-Flash',
            evaluation,
        });

    } catch (err) {
        console.error('❌ Error in analyze endpoint:', err.message);

        // Graceful fallback — never crash the user's assessment
        const { performanceMetrics, biomechanicsAnalysis, drillType } = req.body;
        const user = await User.findById(req.user.id).catch(() => null);
        const primarySport = user?.primarySport || 'other';

        return res.status(200).json({
            success: true,
            model: 'Sports-Talent-Fallback-v1',
            evaluation: mathFallbackAnalysis(performanceMetrics, biomechanicsAnalysis, drillType, primarySport),
        });
    }
});

module.exports = router;
