const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
    {
        name: {
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
                    return /^\d{10}$/.test(v);
                },
                message: props => `${props.value} is not a valid 10-digit mobile number!`
            }
        },
        refer_code: {
            type: String,
            trim: true,
            uppercase: true,
            unique: true,
            sparse: true,
            index: true
        },
        reference_code: {
            type: String,
            trim: true,
            uppercase: true
        },
        referred_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "customers",
        },
        points: {
            type: Number,
            default: 0
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
            type: Number,
            default: 0
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
        },
        status: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Indexes
customerSchema.index({ mobile: 1 }, { unique: true }); // Mobile should be unique


const generateReferCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Pre-save hook to generate unique refer_code
customerSchema.pre('save', async function (next) {
    const doc = this;

    if (!doc.isNew || doc.refer_code) return next();

    let unique = false;
    let code;

    while (!unique) {
        code = generateReferCode();
        const existing = await mongoose.models.customers.findOne({ refer_code: code });
        if (!existing) unique = true;
    }

    doc.refer_code = code;
    next();
});

const CustomerModal = mongoose.model('customers', customerSchema);

module.exports = { CustomerModal };