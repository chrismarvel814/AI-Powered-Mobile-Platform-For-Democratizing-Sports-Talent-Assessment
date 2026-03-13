const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    drillType: {
        type: String, // e.g., 'vertical_jump', '40_yard_sprint'
        required: true,
    },
    // JSON array of keyframes or raw tracking coordinates
    motionTrackingData: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
    },
    // Specific outputs from the drill
    performanceMetrics: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    // Analyzed angles/velocities from motion data
    biomechanicsAnalysis: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
    },
    talentScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
    // The full AI Scout report
    scoutReport: {
        type: String,
        default: '',
    },
    duration: {
        type: Number, // total time in seconds
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
