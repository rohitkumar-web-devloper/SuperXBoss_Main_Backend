const { required } = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        default: ""
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    role: {
        type: String,
        default: "admin"
    },
    address: {
        type: String,
        default: null
    },
    mobile: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    whatsapp: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    countryCode: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    type: {
        type: String,
        default: "vendor"
    },
    access_token: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true,
        index: true,
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
    password: {
        type: String,
    },
},
    {
        timestamps: true
    });

const UserModal = mongoose.model('users', userSchema);
module.exports = { UserModal }
