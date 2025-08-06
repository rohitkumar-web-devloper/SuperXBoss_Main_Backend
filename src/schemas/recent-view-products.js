const mongoose = require('mongoose');

const RecentViewSchema = new mongoose.Schema(
    {
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customers',
            required: true,
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true
        },
        count: {
            type: Number,
            default: 1,
        },
        lastViewedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        versionKey: false,
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const RecentViewProductModel = mongoose.model('recent_view_products', RecentViewSchema);
module.exports = { RecentViewProductModel };
