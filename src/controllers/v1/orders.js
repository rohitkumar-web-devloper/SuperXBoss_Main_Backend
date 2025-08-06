const { default: mongoose } = require("mongoose");
const { error, success } = require("../../functions/functions");
const { ProductModel } = require("../../schemas/product");
const moment = require("moment");
const { OrderCountModal } = require("../../schemas/OrderCounter");
const { CouponModel } = require("../../schemas/coupon");
const { OrderListModel } = require("../../schemas/orders");
const { CustomerModal } = require("../../schemas/customers");
const { AddToCartModel } = require("../../schemas/add-to-cart");
const crypto = require('crypto');
const { razorpay } = require("../../middleware/razorpay");
const { PointsModel } = require("../../schemas/points");
// const { admin } = require("../../Helper/fireBase-admin");
// const createOrder = async (_req, _res) => {
//     try {
//         const { _id, type = "customer" } = _req.user;
//         const { products, coupon, shippingAddress, walletAmount = 0, point = 0 } = _req.body;

//         if (!Array.isArray(products) || products.length === 0) {
//             return _res.status(400).json(error(400, "Products list is required"));
//         }
//         if (point || walletAmount) {
//             const checkPoints = await CustomerModal.findOne({ _id }).select({ point: 1 })
//             if (checkPoints && point) {
//                 if (parseFloat(checkPoints.point) < point) {
//                     return _res.status(400).json(error(400, `You have only ${checkPoints.point} points. Cannot redeem ${point} points.`));
//                 }
//             }
//             if (checkPoints && walletAmount) {
//                 if (parseFloat(checkPoints.wallet_amount) < walletAmount) {
//                     return _res.status(400).json(error(400, `You have only ${checkPoints.wallet_amount} points. Cannot redeem ${walletAmount} points.`));
//                 }
//             }
//             if (!checkPoints) {
//                 return _res.status(400).json(error(400, `User not found`));
//             }

//         }

//         const productIds = products.map(p => new mongoose.Types.ObjectId(p.product_id));
//         const productDocs = await ProductModel.find({
//             _id: { $in: productIds }
//         }).select({ images: 0, createdAt: 0, updatedAt: 0, segment_type: 0, video: 0, createdBy: 0, trend_part: 0 });

//         const enrichedProducts = [];

//         for (const p of products) {
//             const matchedProduct = productDocs.find(doc => doc._id.toString() === p.product_id);
//             if (!matchedProduct) continue;

//             if (matchedProduct.item_stock < p.qty) {
//                 return _res.status(400).json(error(400, `Insufficient stock for product: ${matchedProduct.name || matchedProduct._id}. Requested: ${p.qty}, Available: ${matchedProduct.item_stock}`));
//             }

//             enrichedProducts.push({
//                 ...matchedProduct.toObject(),
//                 qty: p.qty
//             });
//         }

//         const disableProductDiscount = !!coupon; // true if coupon is applied
//         const discountedProducts = enrichedProducts.map(p =>
//             applyBestDiscount(p, disableProductDiscount)
//         );

//         const { earnPoints, totalQty, subTotalCustomer, subTotalB2b, taxTotalCustomer, taxTotalB2b, grandTotalCustomer, grandTotalB2B, grandTotalDiscountCustomer, grandTotalDiscountB2B } = discountedProducts.reduce((acc, curr) => {
//             acc.earnPoints += curr.point;
//             acc.totalQty += curr.qty;
//             acc.subTotalCustomer += curr.final_price_with_qty_customer;
//             acc.subTotalB2b += curr.final_price_with_qty_b2b;
//             acc.taxTotalCustomer += curr.tax_amount_customer;
//             acc.taxTotalB2b += curr.tax_amount_b2b;
//             acc.grandTotalCustomer += curr.final_price_with_qty_and_tax_customer;
//             acc.grandTotalB2B += curr.final_price_with_qty_and_tax_b2b;
//             acc.grandTotalDiscountCustomer += curr.discount_amount_customer;
//             acc.grandTotalDiscountB2B += curr.discount_amount_b2b;
//             return acc;
//         }, {
//             earnPoints: 0, totalQty: 0, subTotalCustomer: 0, subTotalB2b: 0,
//             taxTotalCustomer: 0, taxTotalB2b: 0, grandTotalCustomer: 0, grandTotalB2B: 0,
//             grandTotalDiscountCustomer: 0, grandTotalDiscountB2B: 0
//         });

//         const grandTotalDiscount = type === "b2b" ? grandTotalDiscountB2B : grandTotalDiscountCustomer;

//         let couponValue = 0;
//         let couponApplied = null;
//         let pointValue = parseFloat(point * 0.90)
//         let WalletValue = parseFloat(walletAmount)

//         if (coupon) {
//             const couponResponse = await CouponModel.findOne({ code: coupon, status: true });
//             if (!couponResponse) {
//                 return _res.status(400).json(error(400, "Invalid or expired coupon code."));
//             }

//             const grandTotal = type === "b2b" ? grandTotalB2B : grandTotalCustomer;

//             if (grandTotal < couponResponse.min_cart_amt) {
//                 return _res.status(400).json(error(400, `Coupon requires a minimum order of ₹${couponResponse.min_cart_amt}. Your total: ₹${grandTotal.toFixed(2)}.`));
//             }

//             couponValue = parseFloat(couponResponse.amount);
//             couponApplied = couponResponse;
//         }

//         const orderNo = await generateOrderNo(_id);
//         const finalAmount = type === "b2b"
//             ? Math.max(0, (grandTotalB2B - couponValue - pointValue - WalletValue))
//             : Math.max(0, grandTotalCustomer - couponValue - pointValue - WalletValue);


//         const StoreDataInDb = {
//             customerType: type,
//             customer_id: _id,
//             totalDiscount: grandTotalDiscount,
//             items: discountedProducts.map((item) => {
//                 return {
//                     product: item._id,
//                     name: item.name,
//                     sku_id: item.sku_id,
//                     brand_id: item.brand_id,
//                     unit: item.unit,
//                     qty: item.qty,
//                     description: item.description,
//                     unitPrice: type === "b2b" ? item.b2b_price : item.customer_price,
//                     discountType: item.discount_type,
//                     applied_discount: type === "b2b" ? item.discount_amount_b2b : item.discount_amount_customer,
//                     effectiveUnitPrice: type === "b2b" ? item.final_b2b_price : item.final_customer_price,
//                     taxPct: item.tax,
//                     taxAmount: type === "b2b" ? item.tax_amount_b2b : item.tax_amount_customer,
//                     lineSubtotal: type === "b2b" ? item.final_price_with_qty_b2b : item.final_price_with_qty_customer,
//                     lineTotal: type === "b2b" ? item.final_price_with_qty_and_tax_b2b : item.final_price_with_qty_and_tax_customer,
//                     point: item.point,
//                 }
//             }),
//             summary: {
//                 subtotal: type === "b2b" ? subTotalB2b : subTotalCustomer,
//                 taxTotal: type === "b2b" ? taxTotalB2b : taxTotalCustomer,
//                 grandTotal: type === "b2b" ? grandTotalB2B : grandTotalCustomer,
//                 totalQty: totalQty,
//             },
//             coupon_applied: {
//                 code: couponApplied ? couponApplied.code : null,
//                 min_cart_amt: couponApplied ? couponApplied.min_cart_amt : null,
//                 start_date: couponApplied ? couponApplied.start_date : null,
//                 end_date: couponApplied ? couponApplied.end_date : null,
//                 amount: couponApplied ? couponValue : null
//             },
//             shippingAddress: shippingAddress,
//             payment: {
//                 status: "pending",
//                 rzpOrderId: "",
//                 rzpPaymentId: "",
//                 rzpSignature: "",
//                 rzpAmount: "",
//                 method: "",
//                 email: "",
//                 name: "",
//                 contact: "",
//             },
//             status: "pending",
//             walletAmount,
//             point,
//             earnPoints,
//             orderNo,
//         }

//         const result = new OrderListModel(StoreDataInDb)

//         await result.save()

//         return _res.status(201).json(success({
//             orderNo,
//             products: discountedProducts,
//             grand_total: type === "b2b" ? grandTotalB2B - pointValue - WalletValue : grandTotalCustomer - pointValue - WalletValue,
//             coupon_applied: couponApplied ? {
//                 code: couponApplied.code,
//                 min_cart_amt: couponApplied.min_cart_amt,
//                 start_date: couponApplied.start_date,
//                 end_date: couponApplied.end_date,
//                 amount: couponValue
//             } : null,
//             final_amount: finalAmount,
//             customer_type: type,
//             totalDiscount: grandTotalDiscount
//         }, "Order created successfully."));

//     } catch (err) {
//         return _res.status(500).json(error(500, err.message));
//     }
// };
const createOrder = async (_req, _res) => {
    try {
        const { _id, type = "customer" } = _req.user;
        const { products, coupon, shippingAddress, walletAmount = 0, point = 0 } = _req.body;
        if (!Array.isArray(products) || products.length === 0) {
            return _res.status(400).json(error(400, "Products list is required"));
        }
        if (point || walletAmount) {
            const checkPoints = await CustomerModal.findOne({ _id }).select({ point: 1, wallet_amount: 1 })
            if (checkPoints && point) {
                if (parseFloat(checkPoints.points) < point) {
                    return _res.status(400).json(error(400, `You have only ${checkPoints.points} points. Cannot redeem ${point} points.`));
                }
            }
            if (checkPoints && walletAmount) {
                if (parseFloat(checkPoints.wallet_amount) < walletAmount) {
                    return _res.status(400).json(error(400, `You have only ${checkPoints.wallet_amount} points. Cannot redeem ${walletAmount} points.`));
                }
            }
            if (!checkPoints) {
                return _res.status(400).json(error(400, `User not found`));
            }

        }

        const productIds = products.map(p => new mongoose.Types.ObjectId(p.product_id));
        const productDocs = await ProductModel.find({
            _id: { $in: productIds }
        }).select({ images: 0, createdAt: 0, updatedAt: 0, segment_type: 0, video: 0, createdBy: 0, trend_part: 0 });

        const enrichedProducts = [];

        for (const p of products) {
            const matchedProduct = productDocs.find(doc => doc._id.toString() === p.product_id);
            if (!matchedProduct) continue;

            if (matchedProduct.item_stock < p.qty) {
                return _res.status(400).json(error(400, `Insufficient stock for product: ${matchedProduct.name || matchedProduct._id}. Requested: ${p.qty}, Available: ${matchedProduct.item_stock}`));
            }
            enrichedProducts.push({
                ...matchedProduct.toObject(),
                qty: p.qty
            });
        }

        const discountedProducts = enrichedProducts.map(p =>
            applyBestDiscount(p)
        );

        const { earnPoints, totalQty, subTotalCustomer, subTotalB2b, taxTotalCustomer, taxTotalB2b, grandTotalCustomer, grandTotalB2B, grandTotalDiscountCustomer, grandTotalDiscountB2B } = discountedProducts.reduce((acc, curr) => {
            acc.earnPoints += curr.point * curr.qty;
            acc.totalQty += curr.qty;
            acc.subTotalCustomer += curr.final_price_with_qty_customer;
            acc.subTotalB2b += curr.final_price_with_qty_b2b;
            acc.taxTotalCustomer += curr.tax_amount_customer;
            acc.taxTotalB2b += curr.tax_amount_b2b;
            acc.grandTotalCustomer += curr.final_price_with_qty_and_tax_customer;
            acc.grandTotalB2B += curr.final_price_with_qty_and_tax_b2b;
            acc.grandTotalDiscountCustomer += curr.discount_amount_customer;
            acc.grandTotalDiscountB2B += curr.discount_amount_b2b;
            return acc;
        }, {
            earnPoints: 0, totalQty: 0, subTotalCustomer: 0, subTotalB2b: 0,
            taxTotalCustomer: 0, taxTotalB2b: 0, grandTotalCustomer: 0, grandTotalB2B: 0,
            grandTotalDiscountCustomer: 0, grandTotalDiscountB2B: 0
        });

        const grandTotalDiscount = type === "b2b" ? grandTotalDiscountB2B : grandTotalDiscountCustomer;

        let couponValue = 0;
        let couponApplied = null;
        let pointValue = parseFloat(point * 0.90)
        let WalletValue = parseFloat(walletAmount)

        if (coupon) {
            const couponResponse = await CouponModel.findOne({ code: coupon, status: true });
            if (!couponResponse) {
                return _res.status(400).json(error(400, "Invalid or expired coupon code."));
            }

            const grandTotal = type === "b2b" ? grandTotalB2B : grandTotalCustomer;

            if (grandTotal < couponResponse.min_cart_amt) {
                return _res.status(400).json(error(400, `Coupon requires a minimum order of ₹${couponResponse.min_cart_amt}. Your total: ₹${grandTotal.toFixed(2)}.`));
            }

            couponValue = parseFloat(couponResponse.amount);
            couponApplied = couponResponse;
        }

        const orderNo = await generateOrderNo(_id);
        let finalAmount = type === "b2b"
            ? Math.max(0, (grandTotalB2B - couponValue - pointValue - WalletValue))
            : Math.max(0, grandTotalCustomer - couponValue - pointValue - WalletValue);
        finalAmount = parseFloat(finalAmount.toFixed(2))
        const finalAmountPaise = parseInt(finalAmount * 100);
        const razorpayOrder = await razorpay.orders.create({
            amount: finalAmountPaise,
            currency: "INR",
            receipt: `receipt_${orderNo}`,
            payment_capture: 1,
        });

        const StoreDataInDb = {
            customerType: type,
            customer_id: _id,
            totalDiscount: grandTotalDiscount,
            items: discountedProducts.map((item) => {
                return {
                    product: item._id,
                    name: item.name,
                    sku_id: item.sku_id,
                    brand_id: item.brand_id,
                    unit: item.unit,
                    qty: item.qty,
                    description: item.description,
                    unitPrice: type === "b2b" ? item.b2b_price : item.customer_price,
                    discountType: item.discount_type,
                    applied_discount: type === "b2b" ? item.discount_amount_b2b : item.discount_amount_customer,
                    effectiveUnitPrice: type === "b2b" ? item.final_b2b_price : item.final_customer_price,
                    taxPct: item.tax,
                    taxAmount: type === "b2b" ? item.tax_amount_b2b : item.tax_amount_customer,
                    lineSubtotal: type === "b2b" ? item.final_price_with_qty_b2b : item.final_price_with_qty_customer,
                    lineTotal: type === "b2b" ? item.final_price_with_qty_and_tax_b2b : item.final_price_with_qty_and_tax_customer,
                    point: item.point,
                }
            }),
            summary: {
                subtotal: type === "b2b" ? grandTotalB2B : grandTotalCustomer,
                taxTotal: type === "b2b" ? taxTotalB2b : taxTotalCustomer,
                grandTotal: finalAmount,
                totalQty: totalQty,
            },
            coupon_applied: {
                code: couponApplied ? couponApplied.code : null,
                min_cart_amt: couponApplied ? couponApplied.min_cart_amt : null,
                start_date: couponApplied ? couponApplied.start_date : null,
                end_date: couponApplied ? couponApplied.end_date : null,
                amount: couponApplied ? couponValue : null
            },
            shippingAddress: shippingAddress,
            payment: {
                status: "pending",
                rzpOrderId: razorpayOrder.id,
                rzpPaymentId: "",
                rzpSignature: "",
                rzpAmount: finalAmountPaise,
                method: "",
                email: "",
                name: "",
                contact: "",
            },
            status: "pending",
            walletAmount,
            point,
            earnPoints,
            orderNo,
        }

        const result = new OrderListModel(StoreDataInDb)

        await result.save()

        return _res.status(201).json(success({
            orderNo,
            products: discountedProducts,
            grand_total: type === "b2b" ? grandTotalB2B - pointValue - WalletValue : grandTotalCustomer - pointValue - WalletValue,
            coupon_applied: couponApplied ? {
                code: couponApplied.code,
                min_cart_amt: couponApplied.min_cart_amt,
                start_date: couponApplied.start_date,
                end_date: couponApplied.end_date,
                amount: couponValue
            } : null,
            razorpay: {
                order_id: razorpayOrder.id,
                amount: finalAmountPaise,
                currency: "INR",
            },
            final_amount: finalAmount,
            customer_type: type,
            totalDiscount: grandTotalDiscount
        }, "Order created successfully."));

    } catch (err) {
        console.log(err);

        return _res.status(500).json(error(500, err.message));
    }
};

const applyBestDiscount = (product, disableDiscount = false) => {
    const {
        qty,
        customer_price,
        b2b_price,
        any_discount = 0,
        bulk_discount = [],
        tax = 0
    } = product;

    let bestDiscount = 0;
    let discountType = "coupon";

    if (!disableDiscount) {
        // Get the highest applicable bulk discount
        const bestBulk = bulk_discount
            .filter(b => qty >= b.count)
            .sort((a, b) => b.discount - a.discount)[0];

        const bulkDiscount = bestBulk?.discount || 0;

        // Apply the higher of any_discount or bulk_discount
        if (any_discount >= bulkDiscount) {
            bestDiscount = any_discount;
            discountType = "any_discount";
        } else {
            bestDiscount = bulkDiscount;
            discountType = "bulk_discount";
        }
    }

    // Final prices after discount
    const finalCustomerPrice = customer_price - (customer_price * bestDiscount) / 100;
    const finalB2BPrice = b2b_price - (b2b_price * bestDiscount) / 100;

    // Total price without tax
    const customerTotal = finalCustomerPrice * qty;
    const b2bTotal = finalB2BPrice * qty;

    // Discount amount
    const discountAmountCustomer = (customer_price * qty * bestDiscount) / 100;
    const discountAmountB2B = (b2b_price * qty * bestDiscount) / 100;

    // Tax
    const customerTax = (customerTotal * tax) / 100;
    const b2bTax = (b2bTotal * tax) / 100;

    // Final price including tax
    const finalCustomerWithTax = customerTotal + customerTax;
    const finalB2BWithTax = b2bTotal + b2bTax;

    return {
        ...product,
        applied_discount: bestDiscount,
        discount_type: discountType,
        final_customer_price: parseFloat(finalCustomerPrice.toFixed(2)),
        final_b2b_price: parseFloat(finalB2BPrice.toFixed(2)),

        final_price_with_qty_customer: parseFloat(customerTotal.toFixed(2)),
        final_price_with_qty_b2b: parseFloat(b2bTotal.toFixed(2)),

        tax_amount_customer: parseFloat(customerTax.toFixed(2)),
        tax_amount_b2b: parseFloat(b2bTax.toFixed(2)),

        final_price_with_qty_and_tax_customer: parseFloat(finalCustomerWithTax.toFixed(2)),
        final_price_with_qty_and_tax_b2b: parseFloat(finalB2BWithTax.toFixed(2)),

        discount_amount_customer: parseFloat(discountAmountCustomer.toFixed(2)),
        discount_amount_b2b: parseFloat(discountAmountB2B.toFixed(2)),

        user_discount_message_customer: bestDiscount > 0
            ? `You saved ₹${discountAmountCustomer.toFixed(2)} (${bestDiscount}%)`
            : null,
        user_discount_message_b2b: bestDiscount > 0
            ? `You saved ₹${discountAmountB2B.toFixed(2)} (${bestDiscount}%)`
            : null
    };
};


const paymentCallback = async (req, res) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature,
            order_no,
            method,
            email,
            name,
            contact
        } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !order_no) {
            return res.status(400).json(error(400, "Missing payment details"));
        }

        // Find the order by order number
        const order = await OrderListModel.findOne({ orderNo: order_no });
        if (!order) {
            return res.status(404).json(error(404, "Order not found"));
        }

        // Optional: Validate Razorpay signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");
        console.warn("Signature mismatch", {
            expected: generated_signature,
            received: razorpay_signature,
        });
        if (generated_signature !== razorpay_signature) {
            return res.status(400).json(error(400, "Invalid payment signature"));
        }
        // ✅ Verify payment is actually captured (MOST IMPORTANT PART)
        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        if (!payment || payment.status !== "captured") {
            return res.status(400).json(error(400, "Payment not completed or not captured yet"));
        }

        // ✅ Update product stock
        const stockUpdateResults = [];

        for (const item of order.items) {
            const productId = item.product;
            const quantity = item.qty;

            const updatedProduct = await ProductModel.findOneAndUpdate(
                { _id: productId },
                { $inc: { item_stock: -quantity } },
                { new: true }
            );

            if (!updatedProduct) {
                return res.status(400).json(error(400, `Insufficient stock for product: ${productId}`));
            }

            stockUpdateResults.push({
                productId,
                newStock: updatedProduct.item_stock
            });
        }


        order.payment = {
            ...order.payment,
            status: "paid",
            rzpOrderId: razorpay_order_id,
            rzpPaymentId: razorpay_payment_id,
            rzpSignature: razorpay_signature,
            rzpAmount: order.summary.grandTotal,
            method,
            email,
            name,
            contact,
            referenceId: razorpay_payment_id // optional but useful
        };
        order.status = "confirmed";


        await AddToCartModel.updateMany(
            {
                customer_id: order.customer_id, // match customer
                product_id: { $in: order.items.map((item) => item.product) } // match all ordered products
            },
            {
                $set: { isCheckedOut: true } // mark as checked out
            }
        );
        // Step 8: Handle Points (Earned & Used)
        const pointOps = [];

        if (order.earnPoints) {
            pointOps.push(
                new PointsModel({
                    customer_id: order.customer_id,
                    source: "product_purchase",
                    type: "credit",
                    points: order.earnPoints,
                }).save()
            );
        }

        if (order.pointUse) {
            pointOps.push(
                new PointsModel({
                    customer_id: order.customer_id,
                    source: "product_purchase",
                    type: "debit",
                    points: order.pointUse,
                }).save()
            );
        }

        await Promise.all(pointOps);
        await order.save();
        return res.status(200).json(success({
            orderNo: order.orderNo,
            stockUpdateResults,
            payment_status: "paid",
            message: "Payment confirmed and order updated."
        }));

    } catch (err) {
        console.error(err);
        return res.status(500).json(error(500, "Internal server error"));
    }
};

const updateOrder = async (_req, _res) => {
    try {
        const { _id } = _req.user;
        const { order_id, status, customer } = _req.body;
        const order = await OrderListModel.findById(order_id)
        // const customerInfo = await CustomerModal.findById(customer)
        order.status = status
        order.updatedBy = _id
        console.log(order);
        await order.save()


        // 🎯 Determine notification content
        let notificationTitle = "Order Update";
        let notificationBody = "";

        switch (status) {
            case "confirmed":
                notificationBody = `Your order #${order.orderNo} has been confirmed.`;
                break;
            case "shipped":
                notificationBody = `Your order #${order.orderNo} has been shipped.`;
                break;
            case "delivered":
                notificationBody = `Your order #${order.orderNo} has been delivered.`;
                break;
            case "cancelled":
                notificationBody = `Your order #${order.orderNo} has been cancelled.`;
                break;
            default:
                notificationBody = `Your order #${order.orderNo} status is updated to ${status}.`;
        }

        // ✅ Send FCM Notification if user has a deviceToken
        // if (customerInfo?.fcm_token) {
        //     await admin.messaging().send({
        //         token: customerInfo?.fcm_token,
        //         notification: {
        //             title: notificationTitle,
        //             body: notificationBody
        //         },
        //         data: {
        //             orderId: order._id.toString(),
        //             orderNo: order.orderNo,
        //             status
        //         }
        //     });
        // }



        return _res.status(201).json(success(order, "Order Update successfully."));

    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};

const generateOrderNo = async (customer_id) => {
    const today = moment().format("YYYYMMDD");
    let orderCounter = await OrderCountModal.findOne({ date: today, customer_id });

    if (!orderCounter) {
        orderCounter = await OrderCountModal.create({ date: today, count: 1, customer_id });
    } else {
        orderCounter.count += 1;
        await orderCounter.save();
    }

    return `ORD-${today}-${String(orderCounter.count).padStart(5, "0")}`;
};


const getOrders = async (_req, _res) => {
    try {
        const { _id, type } = _req.user
        const hasUser = type != "vendor" ? mongoose.Types.ObjectId.isValid(_id) : false
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const orderNo = _req?.query?.orderNo;
        const search = _req?.query?.search;
        const orderId = _req?.query?.orderId;
        const status = _req?.query?.status;
        const payment_status = _req?.query?.payment_status;
        let matches = {}
        if (type != "vendor" && type != "admin") {
            matches.customer_id = new mongoose.Types.ObjectId(_id)
        }
        if (orderNo) {
            matches.orderNo = orderNo
        }
        if (orderId) {
            matches._id = new mongoose.Types.ObjectId(orderId)
        }
        if (status) {
            matches.status = status
        } else {
            matches.status = { $ne: "pending" }
        }
        if (payment_status) {
            matches["payment.status"] = payment_status
        }
        if (search) {
            matches.$or = [
                { "customer.first_name": { $regex: search, $options: "i" } },
                { "customer.last_name": { $regex: search, $options: "i" } },
                { orderNo: { $regex: search, $options: "i" } },
                { "payment.rzpOrderId": { $regex: search, $options: "i" } },
                { "coupon_applied.code": { $regex: search, $options: "i" } },
                { "items.name": { $regex: search, $options: "i" } }
            ]
        }


        const getData = await OrderListModel.aggregate([
            {
                $lookup: {
                    from: "customers",
                    localField: "customer_id",
                    foreignField: "_id",
                    as: "customer"
                }
            },
            {
                $unwind: {
                    path: "$customer",
                }
            },
            {
                $match: matches,
            },
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
                $facet: {
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip }, { $limit: limit }
                    ],
                    totalCount: [
                        { $count: "count" } // now counts unique products
                    ]
                }
            }

        ])
        const result = getData
        const orders = result[0].data;
        const total = result[0].totalCount[0]?.count || orders.length;
        return _res.status(201).json(success(orders, "Order fetch successfully.",
            {
                total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit),
            }
        ));

    } catch (err) {
        console.log(err);

        return _res.status(500).json(error(500, err.message));
    }

}
module.exports = { createOrder, getOrders, updateOrder, paymentCallback };
