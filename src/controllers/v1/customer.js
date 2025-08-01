const { error, success } = require("../../functions/functions");
const { imageUpload } = require("../../functions/imageUpload");
const unlinkOldFile = require("../../functions/unlinkFile");
const { CustomerModal } = require('../../schemas/customers');
const { customerLoginSchema, customerVerifyOtpSchema, customerUpdateSchema } = require("../../Validation/customer");
const { generateToken } = require("../../Helper");

const loginCustomer = async (_req, _res) => {
    try {
        const { error: customError, value } = customerLoginSchema.validate({ ..._req.body }, { abortEarly: false });
        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }


        const { mobile } = _req.body;
        let customer = await CustomerModal.findOne({ mobile });

        if (!customer) {
            customer = new CustomerModal({
                mobile,
                otp: '1234',
            });
            await customer.save();

            return _res.status(200).json(success({
                mobile
            }, 'User registered. OTP sent.'));
        }

        customer.otp = '1234';
        await customer.save();


        return _res.status(200).json(success({
            mobile
        }, 'OTP sent to registered mobile.'));

    } catch (err) {
        console.error('OTP error:', err);
        return _res.status(500).json(error('Internal Server Error'));
    }
};
const verifyOTP = async (_req, _res) => {
    try {
        const { error: customError } = customerVerifyOtpSchema.validate({ ..._req.body });
        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }

        const { mobile, otp, fcm_token } = _req.body;
        const customer = await CustomerModal.findOne({ mobile });
        if (!customer) {
            return _res.status(404).json(error('Customer not found'));
        }

        if (customer.otp !== otp) {
            return _res.status(401).json(error('Invalid OTP'));
        }

        const token = generateToken(mobile);

        // Clear OTP after successful verification
        customer.otp = null;
        customer.token = token;
        customer.fcm_token = fcm_token;
        await customer.save();

        return _res.status(200).json(success(customer, 'OTP verified successfully'));

    } catch (err) {
        console.error('Verify OTP error:', err);
        return _res.status(500).json(error('Internal Server Error'));
    }
};
const logoutCustomer = async (_req, _res) => {
    try {
        if (!_req.body) {
            return _res.status(400).json(error(400, 'Customer ID is required'));
        }
        const customer = await CustomerModal.findById(_req.body.customerId);
        if (!customer) {
            return _res.status(404).json(error('Customer not found'));
        }

        customer.token = undefined;
        await customer.save();

        return _res.status(200).json(success({}, 'Logged out successfully'));

    } catch (err) {
        console.error('Logout error:', err);
        return _res.status(500).json(error('Internal Server Error'));
    }
};
const updateCustomer = async (_req, _res) => {
    try {
        const { error: customError, value } = customerUpdateSchema.validate({ ..._req.body, profile: _req.file }, {
            abortEarly: false,
        });
        if (customError) {
            return _res.json(error(400, customError.details.map(err => err.message)[0]));
        }


        const { customerId } = _req.body;
        const existing = await CustomerModal.findById(customerId);
        if (!existing) {
            return _res.status(409).json(error(409, 'Customer not foundddd'));
        }

        let profile = existing.profile;
        if (_req.file && _req.file.buffer) {
            if (existing.profile) {
                unlinkOldFile(existing.profile);
            }
            profile = await imageUpload(_req.file.originalname, _req.file.buffer, 'customer');
        }

        const updatedData = {
            ...value,
            profile,
        };

        const updatedBrand = await CustomerModal.findByIdAndUpdate(customerId, updatedData, { new: true });
        const { createdAt, updatedAt, ...rest } = updatedBrand.toObject();
        return _res.status(200).json(success(rest, 'Customer updated successfully'));

    } catch (err) {
        console.error(err);
        return _res.status(500).json({
            status: false,
            message: 'Internal server error',
        });
    }
};
const getCustomers = async (_req, _res) => {
    try {
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";
        const match = {

        }
        if (search) {
            match.$or = [
                {
                    first_name: { $regex: search, $options: "i" },
                    last_name: { $regex: search, $options: "i" },
                    mobile: { $regex: search, $options: "i" },
                    refer_code: { $regex: search, $options: "i" },
                    state: { $regex: search, $options: "i" },
                }
            ]
        }
        const result = await CustomerModal.aggregate([
            {
                $match: match
            },
            {
                $facet: {
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $project: {
                                fcm_token: 0,
                                otp: 0
                            }
                        }
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ])

        const customers = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;


        return _res.status(200).json(success(customers, 'Customer fetch successfully',
            {
                total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit),
            }
        ));

    } catch (err) {
        console.error(err);
        return _res.status(500).json(error(500, err.message));
    }
};
module.exports = { loginCustomer, verifyOTP, logoutCustomer, updateCustomer, getCustomers }