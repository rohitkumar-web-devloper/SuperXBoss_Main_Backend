const mongoose = require('mongoose');

const WishListSchema = new mongoose.Schema(
    {
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customers',
            required: true,
            index: true
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required: true,
            index: true
        },
        isAdded: {
            type: Boolean,
            default: true,
        },
    },
    {
        versionKey: false,
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const WishListModel = mongoose.model('wish_lists', WishListSchema);
module.exports = { WishListModel };
