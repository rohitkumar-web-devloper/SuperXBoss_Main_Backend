const { default: mongoose } = require("mongoose");
const { error, success, generateRandomCode } = require("../../functions/functions");
const { CouponModel } = require('../../schemas/coupon')
const { createCouponSchema, updateCouponSchema } = require('../../Validation/coupon')
const createCoupon = async (_req, _res) => {
    try {
        const { error: validationError, value } = createCouponSchema.validate({ ..._req.body });
        if (validationError) {
            return _res.status(400).json(error(
                400,
                validationError.details.map(err => err.message)[0]
            ));
        }

        // Check if coupon code already exists
        const existingCoupon = await CouponModel.findOne({ code: value.code });
        if (existingCoupon) {
            return _res.status(409).json(error('Coupon code already exists'));
        }
        let code = value.code

        if (!value.code) {
            code = generateRandomCode()
        }
        // Create new coupon
        const newCoupon = await CouponModel.create({
            ...value,
            code,
            createdBy: _req.user._id
        });

        return _res.status(201).json(success(newCoupon, 'Coupon created successfully'));

    } catch (err) {
        console.error('Create coupon error:', err);
        return _res.status(500).json(error(500, 'Internal server error'));
    }
};

const updateCoupon = async (_req, _res) => {
    try {
        const { couponId } = _req.params
        const { error: validationError, value } = updateCouponSchema.validate({ ..._req.body });
        if (validationError) {
            return _res.status(400).json(error(
                400,
                validationError.details.map(err => err.message)[0]
            ));
        }

        const { ...updateData } = value;

        // 1. First check if coupon exists
        const existingCoupon = await CouponModel.findById(couponId);
        if (!existingCoupon) {
            return _res.status(404).json(error(404, 'Coupon not found'));
        }

        // 2. Check if new code conflicts with other coupons
        if (updateData.code && updateData.code !== existingCoupon.code) {
            const codeExists = await CouponModel.findOne({
                code: updateData.code,
                _id: { $ne: couponId } // Exclude current coupon
            });

            if (codeExists) {
                return _res.status(409).json(error(409, 'Coupon code already in use by another coupon'));
            }
        }

        // 3. Perform the update
        const updatedCoupon = await CouponModel.findByIdAndUpdate(
            couponId,
            {
                ...updateData,
                updatedBy: _req.user._id
            },
            {
                new: true,
                runValidators: true
            }
        );

        return _res.status(200).json(success(updatedCoupon, 'Coupon updated successfully'));
    } catch (err) {
        console.error('Update coupon error:', err);
        return _res.status(500).json(error(500, 'Internal server error'));
    }
};

const getCoupon = async (_req, _res) => {
    try {
        const { code, status } = _req.query;
        const { _id, type } = _req.user
        const hasUser = type == "customer" ? mongoose.Types.ObjectId.isValid(_id) : false
        const match = {};
        if (code) {
            match.code = { $regex: code, $options: 'i' };
        }
        if (status !== undefined) {
            match.status = status === 'true';
        }

        const result = await CouponModel.aggregate([
            { $match: match },
            ...(!hasUser ? [{
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                    pipeline: [
                        { $project: { name: 1, _id: 1 } }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$createdBy",
                    preserveNullAndEmptyArrays: true
                }
            }] : []),
            ...(!hasUser ? [{
                $lookup: {
                    from: "users",
                    localField: "updatedBy",
                    foreignField: "_id",
                    as: "updatedBy",
                    pipeline: [
                        { $project: { name: 1, _id: 1 } }
                    ]
                }
            },
            {
                $unwind: {
                    path: "$updatedBy",
                    preserveNullAndEmptyArrays: true
                }
            }] : []),
            {
                $project: {
                    code: 1,
                    amount: 1,
                    min_cart_amt: 1,
                    start_date: 1,
                    end_date: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    __v: 1,
                    'createdBy': 1,
                    'updatedBy': 1,
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        return _res.status(200).json(success(result, "Coupon(s) fetched successfully"));
    } catch (err) {
        console.error('Get coupon error:', err);
        return _res.status(500).json(error(500, 'Internal server error'));
    }
};



module.exports = { createCoupon, updateCoupon, getCoupon };