const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const addressSchema = new Schema(
    {
        customer: {
            type: Types.ObjectId,
            ref: 'users',
            required: true,
            index: true
        },

        label: {
            type: String,
            enum: ['Home', 'Office', 'Other'],
            default: 'Office'
        },

        // Address fields
        address: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        mobile: { type: String, required: true, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        pinCode: { type: String, },
        country: { type: String, default: 'India', trim: true },
        coordinates: {
            type: [Number], // [longitude, latitude]
            default: []
        },
        isDefault: { type: Boolean, default: false }, // mark primary address
        type: { type: String, enum: ['shipping', 'billing', 'both'], default: 'shipping' },
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
            }
        },
        toObject: { virtuals: true }
    }
);

// Optional geospatial index if location is used
addressSchema.index({ location: '2dsphere' });

const AddressModel = mongoose.models.addresses || mongoose.model('addresses', addressSchema);

module.exports = { AddressModel };
