const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
        },
        offer_amount: {
            type: Number,
            required: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
        },
        status: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

const WalletModel = mongoose.model('wallets', WalletSchema);
module.exports = { WalletModel };
