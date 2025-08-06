// controllers/wallet.controller.js
const crypto = require("crypto");
const { success, error } = require("../../functions/functions");
const { RechargeModel } = require("../../schemas/recharge");
const { CustomerModal } = require("../../schemas/customers");
const { WalletModel } = require("../../schemas/wallet");
const { razorpay } = require("../../middleware/razorpay");
const { default: mongoose } = require("mongoose");

// POST /api/wallet/create-order
const createWalletOrder = async (req, res) => {
    try {
        const { amount, recharge_id } = req.body;
        const customer_id = req.user._id;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        // 1. If recharge_id is passed, try to return existing order (if still pending)
        if (recharge_id) {
            const existingRecharge = await RechargeModel.findOne({
                _id: recharge_id,
                customer_id,
                status: "pending"
            });

            if (existingRecharge) {
                return res.status(200).json(success({
                    orderId: existingRecharge.payment.rzpOrderId,
                    amount: existingRecharge.payment.rzpAmount,
                    currency: "INR",
                    offer_amount: existingRecharge.offer_amount || 0,
                    recharge_id: existingRecharge._id,
                    reused: true
                }));
            }
        }

        // 2. Try to find any other pending recharge for same amount
        const pendingRecharge = await RechargeModel.findOne({
            customer_id,
            amount,
            status: "pending"
        });

        if (pendingRecharge) {
            return res.status(200).json(success({
                orderId: pendingRecharge.payment.rzpOrderId,
                amount: pendingRecharge.payment.rzpAmount,
                currency: "INR",
                offer_amount: pendingRecharge.offer_amount || 0,
                recharge_id: pendingRecharge._id,
                reused: true
            }));
        }

        // 3. Get wallet offer
        const offer = await WalletModel.findOne({
            amount: { $lte: amount },
            status: true,
        }).sort({ amount: -1 });

        // 4. Create new Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amount * 100,
            currency: "INR",
            receipt: `wallet_rcpt_${Date.now()}`
        });

        // 5. Create recharge record
        const newRecharge = await RechargeModel.create({
            customer_id,
            amount,
            offer_amount: offer?.offer_amount || 0,
            offer_id: offer?._id || null,
            status: "pending",
            payment: {
                rzpOrderId: razorpayOrder.id,
                rzpAmount: razorpayOrder.amount,
                provider: "razorpay",
                status: "pending"
            }
        });

        return res.status(200).json(success({
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            offer_amount: offer?.offer_amount || 0,
            recharge_id: newRecharge._id,
            reused: false
        }));

    } catch (err) {
        console.error("Create Wallet Order Error:", err);
        return res.status(500).json(500, "Server error");
    }
};



// POST /api/wallet/verify
const verifyWalletPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            method,
            email,
            name,
            contact
        } = req.body;

        const customer_id = req.user._id;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment details" });
        }

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json(error(400, "Invalid Razorpay signature"));
        }

        const recharge = await RechargeModel.findOne({
            "payment.rzpOrderId": razorpay_order_id,
            customer_id,
            status: "pending"
        });

        if (!recharge) {
            return res.status(404).json(400, "Recharge record not found");
        }

        // Update recharge record
        recharge.status = "paid";
        recharge.payment.status = "paid";
        recharge.payment.referenceId = razorpay_payment_id;
        recharge.payment.rzpPaymentId = razorpay_payment_id;
        recharge.payment.rzpSignature = razorpay_signature;
        recharge.payment.method = method;
        recharge.payment.email = email;
        recharge.payment.name = name;
        recharge.payment.contact = contact;

        await recharge.save();

        // Credit to wallet balance
        await CustomerModal.findByIdAndUpdate(customer_id, {
            $inc: {
                wallet_balance: recharge.amount + recharge.offer_amount
            }
        });

        return res.status(200).json({ message: "Wallet recharge successful", recharge });
    } catch (err) {
        console.error("Verify Wallet Payment Error:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

const getWalletHistory = async (_req, res) => {
    try {
        const { _id } = _req.user
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;

        const matchStage = {
            _id: new mongoose.Types.ObjectId(_id)
        };

        const aggregationPipeline = [
            { $match: matchStage },


            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await RechargeModel.aggregate(aggregationPipeline);

        const points = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        return res.status(200).json(
            success(points, "Points fetched successfully",
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            )
        );

    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};


module.exports = { createWalletOrder, verifyWalletPayment, getWalletHistory }