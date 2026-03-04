const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['new_article', 'new_comment', 'system'],
        required: true
    },
    message: { type: String, required: true, maxlength: 300 },
    isRead: { type: Boolean, default: false },
    relatedArticle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
        default: null
    }
}, { timestamps: true });

// Fast unread-count + feed queries for a user
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
