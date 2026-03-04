const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get current user's notifications (unread first, then read, paginated)
// @access  Private
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ recipient: req.user.id })
                .populate('relatedArticle', 'title category')
                .sort({ isRead: 1, createdAt: -1 })
                .skip(page * limit)
                .limit(limit),
            Notification.countDocuments({ recipient: req.user.id }),
            Notification.countDocuments({ recipient: req.user.id, isRead: false })
        ]);

        res.json({ page, limit, total, unreadCount, hasMore: page * limit + notifications.length < total, notifications });
    } catch (err) {
        next(err);
    }
});

// @route   PUT /api/notifications/read
// @desc    Mark all notifications as read for the current user
// @access  Private
router.put('/read', authMiddleware, async (req, res, next) => {
    try {
        const result = await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'All notifications marked as read', count: result.modifiedCount });
    } catch (err) {
        next(err);
    }
});

// @route   PUT /api/notifications/read/:id
// @desc    Mark a single notification as read
// @access  Private
router.put('/read/:id', authMiddleware, async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { $set: { isRead: true } },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Notification not found' });
        res.json(notification);
    } catch (err) {
        next(err);
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a single notification (own only)
// @access  Private
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const result = await Notification.findOneAndDelete({
            _id: req.params.id,
            recipient: req.user.id
        });
        if (!result) return res.status(404).json({ message: 'Notification not found' });
        res.json({ message: 'Notification deleted' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
