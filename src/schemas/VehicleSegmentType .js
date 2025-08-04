const mongoose = require('mongoose');

const vehicleSegmentTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    icon: {
      type: String,
      default: null
    },
    status: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
    },
  },
  {
    versionKey: false,
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const VehicleSegmentTypeModel = mongoose.model('vehicle_segment_types', vehicleSegmentTypeSchema);

module.exports = { VehicleSegmentTypeModel };
