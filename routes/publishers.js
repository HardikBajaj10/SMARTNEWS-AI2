const express = require('express');
const router = express.Router();
const Publisher = require('../models/Publisher');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const { publisherProfileValidator, handleValidationErrors } = require('../middleware/validate');

// @route   GET /api/publishers/:id
// @desc    Get a publisher's public profile by publisher doc ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const publisher = await Publisher.findById(req.params.id)
            .populate('user', 'name email');
        if (!publisher) return res.status(404).json({ message: 'Publisher not found' });
        res.json(publisher);
    } catch (err) {
        if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Publisher not found' });
        next(err);
    }
});

// @route   GET /api/publishers/by-user/:userId
// @desc    Get publisher profile by user ID
// @access  Private
router.get('/by-user/:userId', authMiddleware, async (req, res, next) => {
    try {
        const publisher = await Publisher.findOne({ user: req.params.userId })
            .populate('user', 'name email');
        if (!publisher) return res.status(404).json({ message: 'Publisher not found' });
        res.json(publisher);
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/publishers/me
// @desc    Get own publisher profile (admin only)
// @access  Private (admin)
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        let publisher = await Publisher.findOne({ user: req.user.id });
        if (!publisher) {
            // Auto-create profile on first access
            publisher = await Publisher.create({ user: req.user.id, displayName: req.user.name });
            await User.findByIdAndUpdate(req.user.id, { publisherProfileId: publisher._id });
        }
        res.json(publisher);
    } catch (err) {
        next(err);
    }
});

// @route   PUT /api/publishers/me
// @desc    Update own publisher profile (admin only)
// @access  Private (admin)
router.put('/me', authMiddleware, publisherProfileValidator, handleValidationErrors, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

        const { displayName, bio, website } = req.body;
        const updates = {};
        if (displayName !== undefined) updates.displayName = displayName;
        if (bio !== undefined) updates.bio = bio;
        if (website !== undefined) updates.website = website;

        let publisher = await Publisher.findOneAndUpdate(
            { user: req.user.id },
            { $set: updates },
            { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
        );

        // If just created, link it to the user document
        await User.findByIdAndUpdate(req.user.id, { publisherProfileId: publisher._id });

        res.json(publisher);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
