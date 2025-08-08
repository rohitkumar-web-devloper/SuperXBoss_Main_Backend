const mongoose = require('mongoose');
const PAYMENT_STATUSES = ['pending', 'authorized', 'paid', 'failed', 'refunded'];

const RechargeSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
        },
        customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'customers', required: true, index: true },
        offer_amount: {
            type: Number,
            required: true,
        },
        offer_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "wallets",

        },
        status: {
            type: String,
            default: "pending",
        },
        payment: {
            // Generic fields
            provider: { type: String, default: 'razorpay' },
            status: { type: String, enum: PAYMENT_STATUSES, default: 'pending', index: true },
            referenceId: { type: String, default: null, trim: true }, // e.g., final payment id

            // Razorpay specifics
            rzpOrderId: { type: String, index: true },     // "order_..."
            rzpPaymentId: { type: String },                // "pay_..."
            rzpSignature: { type: String },                // HMAC from client callback verify
            rzpAmount: { type: Number, min: 0 },           // amount in paise (integer)

            // Optional snapshots from checkout
            method: { type: String, trim: true },          // card/upi/netbanking/etc
            email: { type: String, trim: true },
            name: { type: String, trim: true },
            contact: { type: String, trim: true },

            // Optional extra info
            notes: { type: mongoose.Schema.Types.Mixed, default: {} },

            // Refund snapshots (optional)
            refundId: { type: String, default: null, trim: true },
            refundStatus: { type: String, default: null, trim: true },
        }
    },
    {
        versionKey: false,
        timestamps: true,
    }
);

const RechargeModel = mongoose.model('recharges', RechargeSchema);
module.exports = { RechargeModel };
