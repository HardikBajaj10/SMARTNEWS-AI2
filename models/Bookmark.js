const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    article: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
        required: true
    }
}, { timestamps: true });

// Compound unique index: a user can only bookmark a given article once
bookmarkSchema.index({ user: 1, article: 1 }, { unique: true });

// Fast "get all bookmarks for a user" query
bookmarkSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Bookmark', bookmarkSchema);
