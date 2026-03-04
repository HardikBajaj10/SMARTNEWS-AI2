require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false // disabled to allow CDN scripts (Tailwind, Google Fonts)
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
// In development: allow all origins. In production, restrict to your domain.
app.use(cors());

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ── Rate limiting: Auth endpoints ─────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests from this IP, please try again in 15 minutes.' }
});
app.use('/api/auth', authLimiter);

// ── General API rate limiter ──────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Rate limit reached. Please slow down.' }
});
app.use('/api', apiLimiter);

// ── Serve static client files ─────────────────────────────────────────────────
app.use(express.static(__dirname));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/readsessions', require('./routes/readsessions'));
app.use('/api/publishers', require('./routes/publishers'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/likes', require('./routes/likes'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/notifications', require('./routes/notifications'));

// ── Database ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected ✅'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// ── Global Error Handler ──────────────────────────────────────────────────────
// Catches all errors forwarded via next(err) from route handlers
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} —`, err.message);
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));