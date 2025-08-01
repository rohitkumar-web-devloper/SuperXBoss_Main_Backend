// models/order.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

/* -------------------------------- Helpers -------------------------------- */

// Round to 2 decimals. For exact precision, switch to Decimal128.
const money2 = (v) => (v == null ? v : Math.round((Number(v) + Number.EPSILON) * 100) / 100);

const ORDER_STATUSES = ['pending', 'confirmed', 'cancelled', 'shipped', 'completed', 'refunded'];
const PAYMENT_STATUSES = ['pending', 'authorized', 'paid', 'failed', 'refunded'];
const DISCOUNT_TYPES = ['coupon', 'bulk_discount', 'any_discount'];

/* ------------------------------ Item Subdoc ------------------------------- */

const orderItemSchema = new Schema(
    {
        // Snapshot references & identifiers
        product: { type: Types.ObjectId, ref: 'products', required: true },
        name: { type: String, trim: true },       // snapshot of product name
        sku_id: { type: String, trim: true },     // snapshot of SKU
        brand_id: { type: Types.ObjectId, ref: 'brands' },
        unit: { type: Types.ObjectId, ref: 'units', required: true },

        // Orderable attributes
        qty: { type: Number, required: true, min: 1 },
        description: { type: String, trim: true },

        // Pricing snapshots
        // If you want exact precision, change Number -> Schema.Types.Decimal128
        unitPrice: { type: Number, required: true, min: 0, set: money2 }, // pre-discount
        discountType: { type: String, enum: DISCOUNT_TYPES, default: 'none' },
        // percent: 0–100, flat: currency units; validated below
        applied_discount: { type: Number, min: 0, set: money2, default: 0 },

        // Effective pricing after discounts
        effectiveUnitPrice: { type: Number, required: true, min: 0, set: money2 },

        // Tax snapshot
        taxPct: { type: Number, min: 0, max: 100, default: 0 },
        taxAmount: { type: Number, required: true, min: 0, set: money2 },

        // Totals per line
        lineSubtotal: { type: Number, required: true, min: 0, set: money2 }, // effectiveUnitPrice * qty
        lineTotal: { type: Number, required: true, min: 0, set: money2 },    // lineSubtotal + taxAmount

        // Loyalty / points if applicable
        point: { type: Number, min: 0, default: 0 },
    },
    { _id: false }
);

// Validate percent discounts range
orderItemSchema.path('applied_discount').validate(function (v) {
    if (this.discountType === 'percent') {
        return v >= 0 && v <= 100;
    }
    return true;
}, 'Percent discount must be between 0 and 100.');

// Safety net to keep per-line totals consistent
orderItemSchema.pre('validate', function (next) {
    if (this.lineSubtotal == null && this.effectiveUnitPrice != null && this.qty != null) {
        this.lineSubtotal = money2(this.effectiveUnitPrice * this.qty);
    }
    if (this.taxAmount == null && this.lineSubtotal != null && this.taxPct != null) {
        this.taxAmount = money2(this.lineSubtotal * (this.taxPct / 100));
    }
    if (this.lineTotal == null && this.lineSubtotal != null && this.taxAmount != null) {
        this.lineTotal = money2(this.lineSubtotal + this.taxAmount);
    }
    next();
});

/* ------------------------------ Order Schema ------------------------------ */

const OrderListSchema = new Schema(
    {
        // Customer
        customerType: { type: String, enum: ['customer', 'b2b', "vendor"], required: true },
        customer_id: { type: Types.ObjectId, ref: 'customers', required: true, index: true },

        // Currency
        totalDiscount: { type: Number, },
        currency: { type: String, default: 'INR', set: (v) => (v ? String(v).toUpperCase() : 'INR') },
        // Items
        items: {
            type: [orderItemSchema],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: 'At least one order item is required.',
            },
        },

        // Summary rollups (auto-filled in pre-validate)
        summary: {
            subtotal: { type: Number, required: true, min: 0, set: money2, default: 0 },
            taxTotal: { type: Number, required: true, min: 0, set: money2, default: 0 },
            grandTotal: { type: Number, required: true, min: 0, set: money2, default: 0 },
            totalQty: { type: Number, min: 0, default: 0 },
        },
        coupon_applied: {
            code: { type: String, default: null },
            amount: { type: Number, default: null },
            min_cart_amt: { type: Number, default: null },
            start_date: { type: Date, default: null },
            end_date: { type: Date, default: null },
        },

        // Address reference
        shippingAddress: { type: Types.ObjectId, ref: 'addresses', default: null },

        /* ------------------------- Payment (with Razorpay) ------------------------ */
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
            notes: { type: Schema.Types.Mixed, default: {} },

            // Refund snapshots (optional)
            refundId: { type: String, default: null, trim: true },
            refundStatus: { type: String, default: null, trim: true },
        },

        // Order lifecycle
        status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
        walletAmountUse: { type: Number, default: 0 },
        pointUse: { type: Number, default: 0 },
        earnPoints: { type: Number, default: 0 },

        // Identifiers & metadata
        orderNo: { type: String, trim: true, unique: true, sparse: true }, // e.g., "ORD-2025-000123"
        meta: { type: Schema.Types.Mixed, default: {} },
    },
    {
        timestamps: true,
        versionKey: false,
        minimize: false,
        toJSON: {
            virtuals: true,
            transform: (_, ret) => {
                ret.id = ret._id?.toString();
                delete ret._id;
                return ret;
            },
        },
        toObject: { virtuals: true },
    }
);

/* -------------------------------- Indexes -------------------------------- */

OrderListSchema.index({ customer_id: 1, createdAt: -1 });
OrderListSchema.index({ status: 1, createdAt: -1 });
OrderListSchema.index({ 'payment.status': 1, createdAt: -1 });

/* -------------------------- Summary Auto-Compute -------------------------- */

OrderListSchema.pre('validate', function (next) {
    if (Array.isArray(this.items) && this.items.length) {
        const subtotal = this.items.reduce((acc, i) => acc + (Number(i.lineSubtotal) || 0), 0);
        const taxTotal = this.items.reduce((acc, i) => acc + (Number(i.taxAmount) || 0), 0);
        const totalQty = this.items.reduce((acc, i) => acc + (Number(i.qty) || 0), 0);
        this.summary.subtotal = money2(subtotal);
        this.summary.taxTotal = money2(taxTotal);
        this.summary.grandTotal = money2(subtotal + taxTotal);
        this.summary.totalQty = totalQty;
    }
    next();
});

/* --------------------------------- Export -------------------------------- */

const OrderListModel =
    mongoose.models.orders || mongoose.model('orders', OrderListSchema);

module.exports = { OrderListModel };
