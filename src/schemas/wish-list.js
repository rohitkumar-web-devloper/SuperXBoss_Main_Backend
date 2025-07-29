const mongoose = require('mongoose');

const WishListSchema = new mongoose.Schema(
    {
        customer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'customers',
        },
        product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
        },
        isAdded: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const WishListModel = mongoose.model('wish_lists', WishListSchema);
module.exports = { WishListModel };
