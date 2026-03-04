const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const User = require('../models/User');
const Publisher = require('../models/Publisher');
const ReadSession = require('../models/ReadSession');
const { authMiddleware } = require('../middleware/auth');
const { articleValidator, handleValidationErrors } = require('../middleware/validate');
const Notification = require('../models/Notification');

// @route   GET /api/articles
// @desc    Get articles filtered by user preferences
// @access  Private
router.get('/', authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);

        const user = await User.findById(req.user.id);
        const preferences = user.preferences || [];

        const filter = preferences.length > 0 ? { category: { $in: preferences } } : {};
        const [articles, total] = await Promise.all([
            Article.find(filter).sort({ createdAt: -1 }).skip(page * limit).limit(limit),
            Article.countDocuments(filter)
        ]);

        res.json(articles);
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/articles/recommended
// @desc    Smart recommendations based on ReadSession engagement data
//          - Recommends categories the user spends the most time in (even outside preferences)
//          - Recommends articles from publishers the user reads the most
// @access  Private
router.get('/recommended', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const preferences = user.preferences || [];

        // Get the user's reading patterns from ReadSession
        const readingPatterns = await ReadSession.aggregate([
            { $match: { user: user._id } },
            {
                $group: {
                    _id: '$category',
                    totalReadTime: { $sum: '$readTime' },
                    sessionCount: { $sum: 1 }
                }
            },
            { $sort: { totalReadTime: -1 } }
        ]);

        // Get most-read publishers
        const publisherPatterns = await ReadSession.aggregate([
            { $match: { user: user._id } },
            {
                $group: {
                    _id: '$author',
                    totalReadTime: { $sum: '$readTime' },
                    sessionCount: { $sum: 1 }
                }
            },
            { $sort: { totalReadTime: -1 } },
            { $limit: 3 }
        ]);

        const totalSessions = readingPatterns.reduce((sum, p) => sum + p.sessionCount, 0);

        // Only recommend after user has read at least 2 articles
        if (totalSessions < 2) {
            return res.json([]);
        }

        let recommended = [];

        // 1. Find non-preferred categories where user has spent time (they chose not to prefer but are reading)
        const engagedNonPreferred = readingPatterns
            .filter(p => !preferences.includes(p._id))
            .map(p => p._id);

        if (engagedNonPreferred.length > 0) {
            const fromEngaged = await Article.find({ category: { $in: engagedNonPreferred } })
                .sort({ createdAt: -1 })
                .limit(4);
            recommended.push(...fromEngaged);
        }

        // 2. Recommend from favorite publishers (articles the user hasn't read yet in other categories)
        const topPublishers = publisherPatterns.map(p => p._id);
        if (topPublishers.length > 0) {
            // Get article IDs already read
            const readArticleIds = await ReadSession.distinct('article', { user: user._id });

            const fromPublishers = await Article.find({
                author: { $in: topPublishers },
                category: { $nin: preferences },
                _id: { $nin: readArticleIds }
            }).sort({ createdAt: -1 }).limit(3);

            // Avoid duplicates
            const existingIds = new Set(recommended.map(a => a._id.toString()));
            for (const a of fromPublishers) {
                if (!existingIds.has(a._id.toString())) {
                    recommended.push(a);
                }
            }
        }

        // 3. If still few recommendations and user is active, add some discovery articles
        if (recommended.length < 3 && totalSessions >= 5) {
            const readArticleIds = await ReadSession.distinct('article', { user: user._id });
            const discovery = await Article.find({
                category: { $nin: preferences },
                _id: { $nin: [...readArticleIds, ...recommended.map(a => a._id)] }
            }).sort({ createdAt: -1 }).limit(3 - recommended.length);
            recommended.push(...discovery);
        }

        res.json(recommended);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/articles/all
// @desc    Get ALL articles (used by admin pages)
// @access  Private
router.get('/all', authMiddleware, async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const articles = await Article.find({ authorId: req.user.id }).sort({ createdAt: -1 }).skip(page * limit).limit(limit);
        res.json(articles);
    } catch (err) {
        next(err);
    }
});

// @route   POST /api/articles
// @desc    Publish a new article
// @access  Private (Admin only)
router.post('/', authMiddleware, articleValidator, handleValidationErrors, async (req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }

        const { title, category, location, content, isToday, tags } = req.body;

        const newArticle = new Article({
            title,
            category,
            location,
            content,
            isToday,
            tags: tags || [],
            author: req.user.name,
            authorId: req.user.id   // now stored as ObjectId reference
        });

        const article = await newArticle.save();

        // Update Publisher stats
        await Publisher.findOneAndUpdate(
            { user: req.user.id },
            { $inc: { articleCount: 1 }, $setOnInsert: { displayName: req.user.name } },
            { upsert: true, new: true }
        );

        // Notify all readers who have this category in their preferences
        const interestedUsers = await User.find({
            preferences: category,
            role: 'user'
        }).select('_id');

        if (interestedUsers.length > 0) {
            const notifications = interestedUsers.map(u => ({
                recipient: u._id,
                type: 'new_article',
                message: `New ${category} article: "${title}" by ${req.user.name}`,
                relatedArticle: article._id
            }));
            await Notification.insertMany(notifications);
        }

        res.json(article);
    } catch (err) {
        next(err);
    }
});

// @route   GET /api/articles/analytics
// @desc    Get article stats for admin
// @access  Private (Admin only)
router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        const articlesCount = await Article.countDocuments({ authorId: req.user.id });
        res.json({ articlesPublished: articlesCount });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/articles/:id
// @desc    Get a single article by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
        // Atomically increment view count and return updated doc
        const article = await Article.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );
        if (!article) return res.status(404).json({ message: 'Article not found' });
        res.json(article);
    } catch (err) {
        if (err.kind === 'ObjectId') return res.status(404).json({ message: 'Article not found' });
        next(err);
    }
});

module.exports = router;
