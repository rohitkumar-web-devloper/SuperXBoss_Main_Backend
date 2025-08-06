// routes/address.js or controllers/addressController.js

const { success, error } = require("../../functions/functions");
const { AddressModel } = require("../../schemas/address");
const { addressValidationSchema } = require("../../Validation/address");

// Create Address
const createAddress = async (req, res) => {
    try {
        const { _id } = req.user

        const { value, error: validationError } = addressValidationSchema.validate({ ...req.body, customer: _id.toString() }, {
            abortEarly: false, // show all errors
            stripUnknown: true // remove unwanted fields
        });

        if (validationError) {
            return res.status(400).json(error(400, validationError.details.map(err => err.message)[0]));
        }
        if (value.isDefault) {
            await AddressModel.updateMany(
                { customer: _id, isDefault: true },
                { $set: { isDefault: false } }
            );
        }
        const newAddress = new AddressModel({
            ...value,
        });

        const savedAddress = await newAddress.save();
        return res.status(201).json(success(savedAddress, "Address Created Successfully."));
    } catch (err) {
        console.error(err);
        return res.status(500).json(error(500, err.message));
    }
};
// Update Address Status (active/inactive)
const updateAddressStatus = async (_req, _res) => {
    try {
        const { id } = _req.params; // Address ID
        const { status } = _req.body;

        if (typeof status !== 'boolean') {
            return _res.status(400).json(error(400, "Status must be a boolean (true or false)"));
        }

        const updatedAddress = await AddressModel.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updatedAddress) {
            return _res.status(404).json(error(404, "Address not found"));
        }

        return _res.status(200).json(success(updatedAddress, "Address Deleted successfully"));
    } catch (err) {
        console.error(err);
        return _res.status(500).json(error(500, err.message));
    }
};

const gerAddresses = async (_req, _res) => {

    try {
        const { _id } = _req.user
        const address = await AddressModel.find({ customer: _id, status: true })

        return _res.status(201).json(success(address));
    } catch (err) {
        console.error(err);
        return _res.status(500).json(error(500, err.message));
    }
}
module.exports = { createAddress, gerAddresses, updateAddressStatus }