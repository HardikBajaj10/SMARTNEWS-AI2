const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ReadSession = require('../models/ReadSession');
const Bookmark = require('../models/Bookmark');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/user/preferences
// @desc    Get logged in user's preferences
// @access  Private
router.get('/preferences', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('preferences');
        res.json(user.preferences);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/preferences
// @desc    Save category preferences
// @access  Private
router.put('/preferences', authMiddleware, async (req, res) => {
    try {
        const { preferences } = req.body;

        let user = await User.findById(req.user.id);
        user.preferences = preferences;
        await user.save();

        res.json(user.preferences);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/user/activity
// @desc    Update engagement (likes, bookmarks, readTime)
// @access  Private
router.put('/activity', authMiddleware, async (req, res) => {
    try {
        const { category, type, readTimeDelta } = req.body; // type: 'like', 'bookmark', 'read'

        let user = await User.findById(req.user.id);

        if (!user.activity) user.activity = new Map();

        let catStats = user.activity.get(category) || { readTime: 0, likes: 0, bookmarks: 0 };

        if (type === 'like') catStats.likes += 1;
        if (type === 'bookmark') catStats.bookmarks += 1;
        if (type === 'read' && readTimeDelta) catStats.readTime += readTimeDelta;

        user.activity.set(category, catStats);
        await user.save();

        res.json(user.activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/user/profile
// @desc    Get user profile and activity totals
// @access  Private
router.get('/profile', authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        // Accurate counts from dedicated collections
        const [reads, bookmarks] = await Promise.all([
            ReadSession.countDocuments({ user: req.user.id }),
            Bookmark.countDocuments({ user: req.user.id })
        ]);

        // Likes are still tracked in the activity Map
        let totalLikes = 0;
        if (user.activity) {
            for (const stats of user.activity.values()) {
                totalLikes += stats.likes || 0;
            }
        }

        res.json({
            user: { name: user.name, email: user.email, role: user.role, preferences: user.preferences },
            stats: { reads, bookmarks, likes: totalLikes },
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
