// const { default: mongoose } = require("mongoose");
// const { error, success } = require("../../functions/functions");
// const { ProductModel } = require("../../schemas/product");
// const moment = require("moment");
// const { OrderCountModal } = require("../../schemas/OrderCounter");
// const { CouponModel } = require("../../schemas/coupon");
// const createOrder = async (_req, _res) => {
//     try {
//         const { _id, type } = _req.user

//         const { products, coupon } = _req.body;
//         if (!Array.isArray(products) || products.length === 0) {
//             return _res.status(400).json(error(400, "Products list is required"));
//         }

//         const productIds = products.map(p => new mongoose.Types.ObjectId(p.product_id));
//         const productDocs = await ProductModel.find({ _id: { $in: productIds } }).select({ images: 0, createdAt: 0, updatedAt: 0, segment_type: 0, video: 0, createdBy: 0, trend_part: 0 })
//         const enrichedProducts = [];

//         for (const p of products) {
//             const matchedProduct = productDocs.find(doc => doc._id.toString() === p.product_id);

//             if (!matchedProduct) continue;

//             // Check stock availability
//             if (matchedProduct.item_stock < p.qty) {
//                 return _res.status(400).json(error(400, `Insufficient stock for product: ${matchedProduct.name || matchedProduct._id}. Requested: ${p.qty}, Available: ${matchedProduct.item_stock}`));
//             }

//             enrichedProducts.push({
//                 ...matchedProduct.toObject(),
//                 qty: p.qty,
//                 discountType: "percent",

//             });
//         }
//         const discountedProducts = enrichedProducts.map(applyBestDiscount);
//         const grandTotalCustomer = discountedProducts.reduce(
//             (acc, curr) => acc + curr.final_price_with_qty_and_tax_customer,
//             0
//         );
//         const grandTotalB2b = discountedProducts.reduce(
//             (acc, curr) => acc + curr.final_price_with_qty_and_tax_b2b,
//             0
//         );

//         let couponValue = 0;
//         let couponApplied = null;

//         if (coupon) {
//             const couponResponse = await CouponModel.findOne({ code: coupon, status: true });
//             if (!couponResponse) {
//                 return _res.status(400).json(error(400, "Invalid or expired coupon code."));
//             }

//             const { min_cart_amt = 0, amount } = couponResponse;

//             const grandTotal = type === "b2b" ? grandTotalB2b : grandTotalCustomer;

//             if (grandTotal < min_cart_amt) {
//                 return _res.status(400).json(
//                     error(400, `Coupon requires a minimum order of ₹${min_cart_amt}. Your total: ₹${grandTotal.toFixed(2)}.`)
//                 );
//             }
//             couponValue = parseFloat(amount);
//             couponApplied = couponResponse;
//         }


//         const OrderNo = await razorpayOrder(_id)
//         console.log(OrderNo);
//         const finalTotal = type === "b2b"
//             ? Math.max(0, grandTotalB2b - couponValue)
//             : Math.max(0, grandTotalCustomer - couponValue);

//         // const razorpayOrder = await razorpay.orders.create({
//         //     amount: Math.round(grandTotalCustomer * 100), // in paise
//         //     currency: "INR",
//         //     receipt: `rcptid_${Date.now()}`,
//         //     notes: {
//         //         user_id: _id.toString(),
//         //         products_count: discountedProducts.length,
//         //     }
//         // });
//         // return _res.status(201).json(
//         //     success({
//         //         products: discountedProducts,
//         //         razorpayOrderId: razorpayOrder.id,
//         //         amount: razorpayOrder.amount,
//         //         currency: razorpayOrder.currency
//         //     }, "Order created successfully.")
//         // );
//         return _res
//             .status(201)
//             .json(success(discountedProducts, "Product view added successfully."));

//     } catch (err) {
//         return _res.status(500).json(error(500, err.message));
//     }
// };
// const applyBestDiscount = (product) => {
//     const {
//         qty,
//         customer_price,
//         b2b_price,
//         any_discount = 0,
//         bulk_discount = [],
//         tax = 0
//     } = product;

//     // Get the best bulk discount based on quantity
//     const applicableBulk = bulk_discount
//         .filter(b => qty >= b.count)
//         .sort((a, b) => b.discount - a.discount)[0];

//     const bulkDiscount = applicableBulk ? applicableBulk.discount : 0;
//     const bestDiscount = Math.max(any_discount, bulkDiscount);
//     const discountType = bestDiscount === bulkDiscount ? 'bulk_discount' : 'any_discount';

//     // Apply discount
//     const finalCustomerPrice = customer_price - (customer_price * bestDiscount) / 100;
//     const finalB2BPrice = b2b_price - (b2b_price * bestDiscount) / 100;

//     // Price * qty
//     const customerTotal = finalCustomerPrice * qty;
//     const b2bTotal = finalB2BPrice * qty;

//     // Tax calculation
//     const customerTaxAmount = (customerTotal * tax) / 100;
//     const b2bTaxAmount = (b2bTotal * tax) / 100;

//     // Final with tax
//     const finalCustomerWithTax = customerTotal + customerTaxAmount;
//     const finalB2BWithTax = b2bTotal + b2bTaxAmount;

//     return {
//         ...product,
//         applied_discount: bestDiscount,
//         discount_type: discountType,
//         final_customer_price: parseFloat(finalCustomerPrice.toFixed(2)),
//         final_b2b_price: parseFloat(finalB2BPrice.toFixed(2)),
//         final_price_with_qty_customer: parseFloat(customerTotal.toFixed(2)),
//         final_price_with_qty_b2b: parseFloat(b2bTotal.toFixed(2)),
//         tax_amount_customer: parseFloat(customerTaxAmount.toFixed(2)),
//         tax_amount_b2b: parseFloat(b2bTaxAmount.toFixed(2)),
//         final_price_with_qty_and_tax_customer: parseFloat(finalCustomerWithTax.toFixed(2)),
//         final_price_with_qty_and_tax_b2b: parseFloat(finalB2BWithTax.toFixed(2))
//     };
// };

// const razorpayOrder = async (customer_id) => {
//     const today = moment().format("YYYYMMDD");

//     let orderCounter = await OrderCountModal.findOne({ date: today, customer_id });

//     if (!orderCounter) {
//         orderCounter = await OrderCountModal.create({ date: today, count: 1, customer_id });
//     } else {
//         orderCounter.count += 1;
//         await orderCounter.save();
//     }

//     const orderNo = `ORD-${today}-${String(orderCounter.count).padStart(5, "0")}`;
//     return orderNo

// }


// module.exports = { createOrder }


const { default: mongoose } = require("mongoose");
const { error, success } = require("../../functions/functions");
const { ProductModel } = require("../../schemas/product");
const moment = require("moment");
const { OrderCountModal } = require("../../schemas/OrderCounter");
const { CouponModel } = require("../../schemas/coupon");
const { OrderListModel } = require("../../schemas/orders");
const { CustomerModal } = require("../../schemas/customers");
const { AddToCartModel } = require("../../schemas/add-to-cart");

const createOrder = async (_req, _res) => {
    try {
        const { _id, type = "customer" } = _req.user;
        const { products, coupon, shippingAddress, walletAmount = 0, point = 0 } = _req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return _res.status(400).json(error(400, "Products list is required"));
        }
        if (point || walletAmount) {
            const checkPoints = await CustomerModal.findOne({ _id }).select({ point: 1 })
            if (checkPoints && point) {
                if (parseFloat(checkPoints.point) < point) {
                    return _res.status(400).json(error(400, `You have only ${checkPoints.point} points. Cannot redeem ${point} points.`));
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

        const disableProductDiscount = !!coupon; // true if coupon is applied
        const discountedProducts = enrichedProducts.map(p =>
            applyBestDiscount(p, disableProductDiscount)
        );

        const { earnPoints, totalQty, subTotalCustomer, subTotalB2b, taxTotalCustomer, taxTotalB2b, grandTotalCustomer, grandTotalB2B, grandTotalDiscountCustomer, grandTotalDiscountB2B } = discountedProducts.reduce((acc, curr) => {
            acc.earnPoints += curr.point;
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
        const finalAmount = type === "b2b"
            ? Math.max(0, (grandTotalB2B - couponValue - pointValue - WalletValue))
            : Math.max(0, grandTotalCustomer - couponValue - pointValue - WalletValue);


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
                subtotal: type === "b2b" ? subTotalB2b : subTotalCustomer,
                taxTotal: type === "b2b" ? taxTotalB2b : taxTotalCustomer,
                grandTotal: type === "b2b" ? grandTotalB2B : grandTotalCustomer,
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
                rzpOrderId: "",
                rzpPaymentId: "",
                rzpSignature: "",
                rzpAmount: "",
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
            final_amount: finalAmount,
            customer_type: type,
            totalDiscount: grandTotalDiscount
        }, "Order created successfully."));

    } catch (err) {
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
        const applicableBulk = bulk_discount
            .filter(b => qty >= b.count)
            .sort((a, b) => b.discount - a.discount)[0];

        const bulkDiscount = applicableBulk ? applicableBulk.discount : 0;
        bestDiscount = Math.max(any_discount, bulkDiscount);
        discountType = bestDiscount === bulkDiscount ? "bulk_discount" : "any_discount";
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
module.exports = { createOrder, getOrders };
