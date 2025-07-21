const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxLength: 255,
  },
  video: {
    type: String,
    trim: true,
  },
  customer_price: {
    type: Number,
    required: true,
    min: 0,
  },
  b2b_price: {
    type: Number,
    required: true,
    min: 0,
  },
  point: {
    type: Number,
    min: 0,
  },
  new_arrival: {
    type: Boolean,
    default: false,
  },
  pop_item: {
    type: Boolean,
    default: false,
  },
  part_no: {
    type: String,
    required: true,
    trim: true,
  },
  segment_type: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'vehicle_segment_types',
    required: true,
  },
  min_qty: {
    type: Number,
    default: 1,
    min: 1,
  },
  wish_product: {
    type: Boolean,
    default: false,
  },
  any_discount: {
    type: Number,
    min: 0,
    max: 100
  },
  brand_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'brands',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    default: null
  },
  item_stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  sku_id: {
    type: String,
    trim: true,
  },
  tax: {
    type: Number,
    min: 0,
    max: 100,
  },
  hsn_code: {
    type: String,
    trim: true,
  },
  ship_days: {
    type: Number,
    min: 0,
  },
  return_days: {
    type: Number,
    min: 0,
  },
  return_policy: {
    type: String,
    trim: true,
  },
  weight: {
    type: String,
    trim: true,
  },
  unit: {
    type: String,
    trim: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
  trend_part: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  images: {
    type: [String],
    validate: [arrayLimit, '{PATH} exceeds the limit of 5'],
  },
  bulk_discount: {
    type: [
      {
        count: {
          type: Number,
          required: true,
          min: 1,
        },
        discount: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    default: [],
  },
}, {
  timestamps: true
});

function arrayLimit(val) {
  return val.length <= 5;
}

module.exports = {
  ProductModel: mongoose.model('Product', productSchema),
};
