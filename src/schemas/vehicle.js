const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
        },
        picture: {
            type: String,
            default: null
        },
        status: {
            type: Boolean,
            default: true
        },
        brand_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'brands',
            required: true
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
        timestamps: true,
    }
);

const VehicleModel = mongoose.model('vehicles', vehicleSchema);

module.exports = { VehicleModel };
