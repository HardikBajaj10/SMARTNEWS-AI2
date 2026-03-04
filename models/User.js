const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    preferences: { type: [String], default: [] },
    // Link to separate Publisher profile document (only set for admin accounts)
    publisherProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Publisher',
        default: null
    },
    // Activity map kept for lightweight engagement tracking (likes per category)
    // Deep analytics (bookmarks, readTime) are in dedicated collections
    activity: {
        type: Map,
        of: new mongoose.Schema({
            readTime: { type: Number, default: 0 },
            likes: { type: Number, default: 0 },
            bookmarks: { type: Number, default: 0 }
        }, { _id: false }),
        default: {}
    }
}, { timestamps: true });

// Email is the primary auth lookup key
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
