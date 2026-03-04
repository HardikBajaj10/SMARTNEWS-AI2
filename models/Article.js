const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true, maxlength: 300 },
    category: {
        type: String,
        required: true,
        enum: ['Technology', 'Business', 'Sports', 'Health', 'Entertainment', 'Science', 'Politics', 'International']
    },
    // Proper ObjectId reference to the publishing User account
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Kept as a string for backward-compat display (populated from User.name on create)
    author: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    isToday: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    // Simple view counter — incremented on each GET /:id call
    views: { type: Number, default: 0 }
}, { timestamps: true });

// Compound index: powers the preference-filtered feed (category filter + newest-first sort)
articleSchema.index({ category: 1, createdAt: -1 });

// Text index: enables full-text search on title and content
articleSchema.index({ title: 'text', content: 'text' });

// Lookup by author name (for publisher analytics)
articleSchema.index({ author: 1 });

// Fast lookup of articles by a specific publisher's user account
articleSchema.index({ authorId: 1 });

module.exports = mongoose.model('Article', articleSchema);
