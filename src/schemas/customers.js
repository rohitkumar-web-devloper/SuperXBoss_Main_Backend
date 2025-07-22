const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        first_name: {
            type: String,
            trim: true,
            maxlength: 50
        },
        last_name: {
            type: String,
            trim: true,
            maxlength: 50
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
        },
        mobile: {
            type: String,
            required: [true, 'Mobile number is required'],
            trim: true,
            validate: {
                validator: function (v) {
                    return /^\d{10}$/.test(v); // Exactly 10 digits
                },
                message: props => `${props.value} is not a valid 10-digit mobile number!`
            }
        },
        state: {
            type: String,
            trim: true
        },
        refer_code: {
            type: String,
            trim: true,
            uppercase: true
        },
        reference_code: {
            type: String,
            trim: true,
            uppercase: true
        },
        point: {
            type: String,
            default: '0'
        },
        language: {
            type: String,
            default: 'en'
        },
        type: {
            type: String,
            default: ''
        },
        status: {
            type: Boolean,
            default: true
        },
        wallet_amount: {
            type: String,
            default: '0.00'
        },
        business_type: {
            type: String,
            trim: true
        },
        business_name: {
            type: String,
            trim: true,
            maxlength: 100
        },
        business_contact_no: {
            type: String,
            trim: true,
            validate: {
                validator: function (v) {
                    return !v || /^\d{10}$/.test(v); // Optional but must be 10 digits if provided
                },
                message: props => `${props.value} is not a valid 10-digit contact number!`
            }
        },
        gst_no: {
            type: String,
            trim: true,
            uppercase: true
        },
        token: {
            type: String,
            select: false
        },
        fcm_token: {
            type: String
        },
        profile: {
            type: String
        },
        otp: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual for full name
customerSchema.virtual('full_name').get(function () {
    return `${this.first_name || ''} ${this.last_name || ''}`.trim();
});

// Indexes
customerSchema.index({ mobile: 1 }, { unique: true }); // Mobile should be unique
// customerSchema.index({ email: 1 }, { unique: true, sparse: true });
customerSchema.index({ refer_code: 1 }, { unique: true, sparse: true });

const CustomerModal = mongoose.model('customers', customerSchema);

module.exports = { CustomerModal };