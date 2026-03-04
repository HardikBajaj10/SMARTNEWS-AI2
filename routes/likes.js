const express = require('express');
const router = express.Router();
const Like = require('../models/Like');
const Article = require('../models/Article');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/likes/:articleId
// @desc    Add a like (toggle functionality)
// @access  Private
router.post('/:articleId', authMiddleware, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.articleId);
        if (!article) return res.status(404).json({ message: 'Article not found' });

        // Check if already liked
        const existingLike = await Like.findOne({ user: req.user.id, article: req.params.articleId });

        if (existingLike) {
            // Toggle off: remove like
            await Like.deleteOne({ _id: existingLike._id });
            return res.json({ message: 'Like removed', liked: false });
        }

        // Toggle on: add like
        const like = new Like({
            user: req.user.id,
            article: req.params.articleId
        });
        await like.save();

        res.status(201).json({ message: 'Liked', liked: true, like });
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/likes/my
// @desc    Get all liked articles for the current user (paginated)
// @access  Private
router.get('/my', authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        const likes = await Like.find({ user: req.user.id })
            .populate('article')
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit);

        const total = await Like.countDocuments({ user: req.user.id });

        res.json({
            page,
            limit,
            total,
            hasMore: page * limit + likes.length < total,
            articles: likes.map(l => l.article).filter(a => a !== null)
        });
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/likes/check/:articleId
// @desc    Check if current user has liked a specific article
// @access  Private
router.get('/check/:articleId', authMiddleware, async (req, res, next) => {
    try {
        const exists = await Like.exists({
            user: req.user.id,
            article: req.params.articleId
        });
        res.json({ liked: !!exists });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
