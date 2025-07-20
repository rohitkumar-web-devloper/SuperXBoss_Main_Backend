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
      type: String,
      default: null,
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
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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
      ref:'users'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:'users'
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

const BrandModel = mongoose.model('brands', brandSchema);
module.exports = { BrandModel };
