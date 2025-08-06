const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema(
    {
        points: {
            type: Number,
            required: true,
        },
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customers',
            required: true,
            index: true,
        },
        source: {
            type: String,
            enum: ['referral', 'product_purchase', "joining"],
            required: true,
        },
        product_ids: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'products',
            required: function () {
                return this.source === 'product_purchase';
            },
            index: true
        },
        type: {
            type: String,
            default: 'credit',
        },
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

const PointsModel = mongoose.model('points', PointSchema);
module.exports = { PointsModel };
