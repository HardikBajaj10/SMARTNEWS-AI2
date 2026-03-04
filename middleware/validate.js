const { body } = require('express-validator');

// Auth validators
const registerValidator = [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name max 100 chars'),
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be "user" or "admin"')
];

const loginValidator = [
    body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

// Article validators
const articleValidator = [
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 300 }).withMessage('Title max 300 chars'),
    body('category').isIn(['Technology', 'Business', 'Sports', 'Health', 'Entertainment', 'Science', 'Politics', 'International'])
        .withMessage('Invalid category'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('content').trim().notEmpty().withMessage('Content is required').isLength({ min: 50 }).withMessage('Content must be at least 50 chars'),
    body('isToday').optional().isBoolean(),
    body('tags').optional().isArray().withMessage('Tags must be an array')
];

// Comment validator
const commentValidator = [
    body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 1000 }).withMessage('Comment max 1000 chars')
];

// Publisher profile validator
const publisherProfileValidator = [
    body('displayName').optional().trim().isLength({ max: 100 }).withMessage('Display name max 100 chars'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio max 500 chars'),
    body('website').optional().trim().isURL({ require_protocol: false, allow_underscores: true })
        .withMessage('Website must be a valid URL')
];

// Middleware to handle validation errors
const { validationResult } = require('express-validator');
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

module.exports = {
    registerValidator,
    loginValidator,
    articleValidator,
    commentValidator,
    publisherProfileValidator,
    handleValidationErrors
};
