const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Article = require('../models/Article');
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');
const { commentValidator, handleValidationErrors } = require('../middleware/validate');

// @route   GET /api/comments/:articleId
// @desc    Get all comments for an article (paginated, newest first)
// @access  Private
router.get('/:articleId', authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        const [comments, total] = await Promise.all([
            Comment.find({ article: req.params.articleId })
                .populate('user', 'name role')
                .sort({ createdAt: -1 })
                .skip(page * limit)
                .limit(limit),
            Comment.countDocuments({ article: req.params.articleId })
        ]);

        res.json({ page, limit, total, hasMore: page * limit + comments.length < total, comments });
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/comments/:articleId
// @desc    Post a new comment on an article
// @access  Private
router.post('/:articleId', authMiddleware, commentValidator, handleValidationErrors, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.articleId);
        if (!article) return res.status(404).json({ message: 'Article not found' });

        const comment = await Comment.create({
            article: req.params.articleId,
            user: req.user.id,
            text: req.body.text
        });

        // Notify the article author (if they are a different user)
        if (article.authorId && article.authorId.toString() !== req.user.id) {
            await Notification.create({
                recipient: article.authorId,
                type: 'new_comment',
                message: `${req.user.name} commented on your article: "${article.title}"`,
                relatedArticle: article._id
            });
        }

        const populated = await comment.populate('user', 'name role');
        res.status(201).json(populated);
    } catch (err) {
        next(err);
    }
});

// @route   DELETE /api/comments/:commentId
// @desc    Delete a comment (own comment only, or admin)
// @access  Private
router.delete('/:commentId', authMiddleware, async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Only the comment author or an admin can delete
        if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        await comment.deleteOne();
        res.json({ message: 'Comment deleted' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
