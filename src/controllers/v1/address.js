// routes/address.js or controllers/addressController.js

const { success, error } = require("../../functions/functions");
const { AddressModel } = require("../../schemas/address");
const { addressValidationSchema } = require("../../Validation/address");

// Create Address
const createAddress = async (req, res) => {
    try {

        const { value, error: validationError } = addressValidationSchema.validate(req.body, {
            abortEarly: false, // show all errors
            stripUnknown: true // remove unwanted fields
        });

        if (validationError) {
            const messages = validationError.details[0].message
            return res.status(400).json(error(400, messages));
        }
        const newAddress = new AddressModel({
            ...value,
            isDefault: false,
        });

        const savedAddress = await newAddress.save();
        return res.status(201).json(success(savedAddress));
    } catch (err) {
        console.error(err);
        return res.status(500).json(error(500, err.message));
    }
};

const gerAddresses = async (_req, _res) => {

    try {
        const { _id } = _req.user
        const address = await AddressModel.find({ customer: _id })
        return res.status(201).json(success(address));
    } catch (err) {
        console.error(err);
        return _res.status(500).json(error(500, err.message));
    }
}
module.exports = { createAddress, gerAddresses }