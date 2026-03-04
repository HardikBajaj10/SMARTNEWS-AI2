const express = require('express');
const router = express.Router();
const Bookmark = require('../models/Bookmark');
const Article = require('../models/Article');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/bookmarks/:articleId
// @desc    Add a bookmark
// @access  Private
router.post('/:articleId', authMiddleware, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.articleId);
        if (!article) return res.status(404).json({ message: 'Article not found' });

        // findOneAndUpdate with upsert — idempotent (safe to call twice)
        const bookmark = await Bookmark.findOneAndUpdate(
            { user: req.user.id, article: req.params.articleId },
            { user: req.user.id, article: req.params.articleId },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(201).json({ message: 'Bookmarked', bookmark });
    } catch (err) {
        next(err);
    }
});

// @route   DELETE /api/bookmarks/:articleId
// @desc    Remove a bookmark
// @access  Private
router.delete('/:articleId', authMiddleware, async (req, res, next) => {
    try {
        const result = await Bookmark.findOneAndDelete({
            user: req.user.id,
            article: req.params.articleId
        });

        if (!result) return res.status(404).json({ message: 'Bookmark not found' });
        res.json({ message: 'Bookmark removed' });
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/bookmarks/my
// @desc    Get all bookmarked articles for the current user (paginated)
// @access  Private
router.get('/my', authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50); // cap at 50

        const bookmarks = await Bookmark.find({ user: req.user.id })
            .populate('article')
            .sort({ createdAt: -1 })
            .skip(page * limit)
            .limit(limit);

        const total = await Bookmark.countDocuments({ user: req.user.id });

        res.json({
            page,
            limit,
            total,
            hasMore: page * limit + bookmarks.length < total,
            bookmarks: bookmarks.map(b => b.article)
        });
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/bookmarks/check/:articleId
// @desc    Check if current user has bookmarked a specific article
// @access  Private
router.get('/check/:articleId', authMiddleware, async (req, res, next) => {
    try {
        const exists = await Bookmark.exists({
            user: req.user.id,
            article: req.params.articleId
        });
        res.json({ bookmarked: !!exists });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
