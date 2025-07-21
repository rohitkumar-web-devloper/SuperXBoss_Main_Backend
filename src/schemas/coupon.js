const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    amount: {
      type: Number,
      required: [true, 'Discount amount is required'],
      min: [1, 'Discount amount must be at least 1']
    },
    min_cart_amt: {
      type: Number,
      required: [true, 'Minimum cart amount is required'],
      min: [0, 'Minimum cart amount cannot be negative']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    start_date: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now
    },
    end_date: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true,
  }
);

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ status: 1 });
couponSchema.index({ end_date: 1 });

// Virtual for checking if coupon is active
couponSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status && now >= this.start_date && now <= this.end_date;
});

// Pre-save hook to uppercase coupon code
couponSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase();
  }
  next();
});

const CouponModel = mongoose.model('coupons', couponSchema);

module.exports = {CouponModel};