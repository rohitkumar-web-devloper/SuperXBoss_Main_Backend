const express = require("express");
const couponRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createCoupon, updateCoupon, getCoupon } = require("../../controllers/v1/coupon");

couponRouter.post('/', asyncHandler(createCoupon));
couponRouter.put('/', asyncHandler(updateCoupon));
couponRouter.get('/', asyncHandler(getCoupon));
module.exports = couponRouter;
