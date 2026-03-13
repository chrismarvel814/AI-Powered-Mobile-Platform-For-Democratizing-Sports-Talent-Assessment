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
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || /^http:\/\/localhost:\d+$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
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
        return res.status(500).json({ success: false, message: `Database Failed to Start: ${dbError}` });
    }
    next();
});

// ── Health Check ──────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ success: true, message: 'Sports Talent Assessment API 🏋️', documentation: '/api/health' });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Sports Talent Assessment API is running 🏋️', timestamp: new Date() });
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/assessment', assessmentRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/analyze', analyzeRoutes);

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── MongoDB Connection + Server Start ─────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sports_talent_assessment';

// 1. Start listening to HTTP requests IMMEDIATELY (listening on both IPv4/IPv6 natively)
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api`);
});

// 2. Connect to the database in the background. Mongoose will safety buffer frontend requests until it's ready!
const seedDefaultUser = async () => {
    try {
        const User = require('./models/User');
        const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@reio.com';
        const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
            await User.create({
                name: 'Admin User',
                email: email,
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

const connectDatabase = async () => {
    try {
        console.log('🔄 Attempting MongoDB Cloud connection...');
        await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 2000 }); // Try cloud first very quickly
        console.log('✅ MongoDB connected successfully to Cloud Atlas');
        await seedDefaultUser();
    } catch (err) {
        console.warn('⚠️ Cloud MongoDB connection failed. Falling back to persistent local instance...');
        try {
            const fs = require('fs');
            const path = require('path');
            const dbPath = path.join(__dirname, 'mongodb_data');

            if (!fs.existsSync(dbPath)) {
                fs.mkdirSync(dbPath, { recursive: true });
            }

            const lockFile = path.join(dbPath, 'mongod.lock');
            const wtLockFile = path.join(dbPath, 'WiredTiger.lock');
            if (fs.existsSync(lockFile)) fs.unlinkSync(lockFile);
            if (fs.existsSync(wtLockFile)) fs.unlinkSync(wtLockFile);

            const { MongoMemoryServer } = require('mongodb-memory-server');

            // Start MongoMemoryServer bound to a physical path so data survives restarts
            const mongod = await MongoMemoryServer.create({
                instance: {
                    dbPath: dbPath,
                    storageEngine: 'wiredTiger'
                },
                autoStart: true
            });

            const uri = mongod.getUri();

            await mongoose.connect(uri);
            console.log(`✅ Local Persistent MongoDB started at: ${dbPath}`);
            await seedDefaultUser();
        } catch (memErr) {
            console.error('❌ Failed to start Persistent MongoDB fallback:', memErr.message);
            dbError = memErr.message;
        }
    }
};

connectDatabase();

module.exports = app;
