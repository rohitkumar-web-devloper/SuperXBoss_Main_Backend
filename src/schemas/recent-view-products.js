const mongoose = require('mongoose');

const RecentViewSchema = new mongoose.Schema(
    {
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customers',
            required: true
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
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const RecentViewProductModel = mongoose.model('recent_view_products', RecentViewSchema);
module.exports = { RecentViewProductModel };
