const mongoose = require('mongoose');

const publisherSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    bio: { type: String, default: '', maxlength: 500 },
    website: { type: String, default: '' },
    // Denormalized counters — updated whenever an article is published or a ReadSession is saved
    articleCount: { type: Number, default: 0 },
    totalReadTime: { type: Number, default: 0 }, // milliseconds, total across all articles
    totalSessions: { type: Number, default: 0 }, // total reads logged across all articles
    uniqueReaders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]  // stored as set of user IDs
}, { timestamps: true });

// Fast lookup of a publisher's profile by their user account
publisherSchema.index({ user: 1 });

module.exports = mongoose.model('Publisher', publisherSchema);
