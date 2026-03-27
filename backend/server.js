require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// ── Route Imports ─────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const assessmentRoutes = require('./routes/assessment');
const progressRoutes = require('./routes/progress');
const analyzeRoutes = require('./routes/analyze');

const app = express();
let dbError = null;

// ── Middleware ────────────────────────────────────────────────

// ✅ SIMPLE + WORKING CORS (no errors, works with Vercel)
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diagnostic middleware
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') {
        console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

// Database Start Warning Middleware
app.use((req, res, next) => {
    if (dbError) {
        return res.status(500).json({
            success: false,
            message: `Database Failed to Start: ${dbError}`
        });
    }
    next();
});

// ── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Sports Talent Assessment API 🏋️',
        documentation: '/api/health'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Sports Talent Assessment API is running 🏋️',
        timestamp: new Date()
    });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analyze', analyzeRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`
    });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
});

// ── MongoDB Connection + Server Start ─────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sports_talent_assessment';

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API Base: /api`);
});

// Seed default user
const seedDefaultUser = async () => {
    try {
        const User = require('./models/User');
        const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@reio.com';
        const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            await User.create({
                name: 'Admin User',
                email,
                passwordHash: password,
                primarySport: 'basketball',
                height: 180,
                weight: 80
            });
            console.log(`✅ Default user seeded: ${email}`);
        }
    } catch (err) {
        console.error('⚠️ Failed to seed default user:', err.message);
    }
};

// Connect DB
const connectDatabase = async () => {
    try {
        console.log('🔄 Attempting MongoDB Cloud connection...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected to Atlas');
        await seedDefaultUser();
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        dbError = err.message;
    }
};

connectDatabase();

module.exports = app;
