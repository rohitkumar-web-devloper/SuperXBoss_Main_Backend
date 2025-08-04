const express = require("express");
const orderRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createOrder, getOrders, updateOrder } = require("../../controllers/v1/orders");

orderRouter.post('/', asyncHandler(createOrder));
orderRouter.put('/', asyncHandler(updateOrder));
orderRouter.get('/', asyncHandler(getOrders));

module.exports = orderRouter;
