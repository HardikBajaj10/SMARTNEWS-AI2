const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
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

// Compound unique index: a user can only like a given article once
likeSchema.index({ user: 1, article: 1 }, { unique: true });

// Fast "get all likes for a user" query
likeSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Like', likeSchema);
