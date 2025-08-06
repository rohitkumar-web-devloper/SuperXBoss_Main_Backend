const express = require("express");
const orderRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createOrder, getOrders, updateOrder, paymentCallback } = require("../../controllers/v1/orders");

orderRouter.post('/init', asyncHandler(createOrder));
orderRouter.put('/callback', asyncHandler(paymentCallback));
orderRouter.put('/', asyncHandler(updateOrder));
orderRouter.get('/', asyncHandler(getOrders));

module.exports = orderRouter;
