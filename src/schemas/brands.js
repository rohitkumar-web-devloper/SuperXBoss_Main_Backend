const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      required: true,
    },
    logo: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      default: null,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'brand_types',
      required: true,
    },
    brand_day: {
      type: Boolean,
      default: false,
    },
    brand_day_offer: {
      type: Number,
      default: 0,
    },
    brand_segment: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'vehicle_segment_types',
      default: [],
      required: true, // Optional: only if brand_segment must always be set
    },
    sorting: {
      type: Number,
      default: 0,
    },
    status: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'users'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

const BrandModel = mongoose.model('brands', brandSchema);
module.exports = { BrandModel };
