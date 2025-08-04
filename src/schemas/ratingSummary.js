const mongoose = require('mongoose');

const ratingSummarySchema = new mongoose.Schema({
    userCount: {
        type: Number,
        required: true,
        default: 0,
    },
    categoryCount: {
        type: Number,
        required: true,
        default: 0,
    },
    yearCount: {
        type: Number,
        required: true,
        default: 0,
    },
    rating: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 5,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
},
    {
        timestamps: true,
        versionKey: false,
    }
);

const RatingSummary = mongoose.model('rating_summary', ratingSummarySchema);

module.exports = { RatingSummary };
