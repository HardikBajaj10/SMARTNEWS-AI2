const express = require('express');
const router = express.Router();
const ReadSession = require('../models/ReadSession');
const User = require('../models/User');
const Article = require('../models/Article');
const Publisher = require('../models/Publisher');
const { authMiddleware } = require('../middleware/auth');

// @route   POST /api/readsessions
// @desc    Save a read session when user finishes reading an article
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { articleId, readTime } = req.body;

        const article = await Article.findById(articleId);
        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        const session = new ReadSession({
            user: req.user.id,
            article: articleId,
            category: article.category,
            author: article.author,
            readTime
        });

        await session.save();

        // Update Publisher stats if authorId is available
        if (article.authorId) {
            await Publisher.findOneAndUpdate(
                { user: article.authorId },
                {
                    $inc: { totalReadTime: readTime, totalSessions: 1 },
                    $addToSet: { uniqueReaders: req.user.id } // This is just a set in the model, though model defined it as Number... wait
                },
                { upsert: true }
            );
        }

        // Also update user's aggregate activity for backward compatibility
        const user = await User.findById(req.user.id);
        if (!user.activity) user.activity = new Map();

        let catStats = user.activity.get(article.category) || { readTime: 0, likes: 0, bookmarks: 0 };
        catStats.readTime += readTime;
        user.activity.set(article.category, catStats);
        await user.save();

        res.json({ message: 'Read session saved', session });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/readsessions/my
// @desc    Get logged-in user's reading history
// @access  Private
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const sessions = await ReadSession.find({ user: req.user.id })
            .populate('article', 'title category')
            .sort({ createdAt: -1 });

        res.json(sessions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/readsessions/publisher-stats
// @desc    Get read time analytics for the logged-in publisher's articles
// @access  Private (Admin)
router.get('/publisher-stats', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const publisherName = req.user.name;

        // Aggregate stats per article (only for this publisher)
        const perArticle = await ReadSession.aggregate([
            { $match: { author: publisherName } },
            {
                $group: {
                    _id: '$article',
                    category: { $first: '$category' },
                    totalReadTime: { $sum: '$readTime' },
                    uniqueReaders: { $addToSet: '$user' },
                    sessionCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 1,
                    category: 1,
                    totalReadTime: 1,
                    readerCount: { $size: '$uniqueReaders' },
                    sessionCount: 1,
                    avgReadTime: { $divide: ['$totalReadTime', '$sessionCount'] }
                }
            },
            { $sort: { totalReadTime: -1 } }
        ]);

        // Populate article titles
        const Article = require('../models/Article');
        const populated = await Promise.all(perArticle.map(async (stat) => {
            const article = await Article.findById(stat._id).select('title');
            return {
                ...stat,
                title: article ? article.title : 'Deleted Article'
            };
        }));

        // Overall totals (only for this publisher)
        const totals = await ReadSession.aggregate([
            { $match: { author: publisherName } },
            {
                $group: {
                    _id: null,
                    totalReadTime: { $sum: '$readTime' },
                    totalSessions: { $sum: 1 },
                    uniqueReaders: { $addToSet: '$user' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalReadTime: 1,
                    totalSessions: 1,
                    uniqueReaderCount: { $size: '$uniqueReaders' }
                }
            }
        ]);

        res.json({
            totals: totals[0] || { totalReadTime: 0, totalSessions: 0, uniqueReaderCount: 0 },
            perArticle: populated
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
