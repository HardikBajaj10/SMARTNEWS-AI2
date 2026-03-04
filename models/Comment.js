const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    article: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    }
}, { timestamps: true });

// Fetch all comments on an article sorted newest-first — the most frequent query
commentSchema.index({ article: 1, createdAt: -1 });

// Allow fast lookup of all comments by a specific user (for profile/moderation)
commentSchema.index({ user: 1 });

module.exports = mongoose.model('Comment', commentSchema);
