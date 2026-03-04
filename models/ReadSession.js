const mongoose = require('mongoose');

const readSessionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    category: { type: String, required: true },
    author: { type: String, required: true },
    readTime: { type: Number, required: true }, // milliseconds
}, { timestamps: true });

// Index for fast lookups
readSessionSchema.index({ user: 1, article: 1 });
readSessionSchema.index({ author: 1 });
readSessionSchema.index({ category: 1 });

module.exports = mongoose.model('ReadSession', readSessionSchema);
