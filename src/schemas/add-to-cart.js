const mongoose = require('mongoose');

const AddToCartSchema = new mongoose.Schema(
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
        qty: {
            type: Number,
            default: 1,
            required: true
        },
        isCheckedOut: { type: Boolean, default: false },
        status: { type: Boolean, default: true },

    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const AddToCartModel = mongoose.model('add_to_carts', AddToCartSchema);
module.exports = { AddToCartModel };
