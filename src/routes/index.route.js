const { authenticateUser } = require('../middleware/authenticateUser');
const bannerRouter = require('./admin/banner.route');
const brandRouter = require('./admin/brand.route');
const brandType = require('./admin/brandTypes.route');
const categoryRouter = require('./admin/category.route');
const couponRouter = require('./admin/coupon.route');
const customerRouter = require('./admin/customer.route');
const faqRouter = require('./admin/faq.route');
const productRouter = require('./admin/product.route');
const ratingRouter = require('./admin/ratingSummery.route');
const unitRouter = require('./admin/unit.route');
const userRouter = require('./admin/user.route');
const vehicleRouter = require('./admin/vehicle.route');
const vehicleSegmentType = require('./admin/vehicleSegmentType.route');

/* Packages */
const express = require("express");
const router = express.Router();

/* Routes */
router.use("/", userRouter);
router.use("/category", authenticateUser, categoryRouter);
router.use("/brand", authenticateUser, brandRouter);
router.use("/banner", authenticateUser, bannerRouter);
router.use("/vehicleSegmentType", authenticateUser, vehicleSegmentType);
router.use("/brandType", authenticateUser, brandType);
router.use("/faq", authenticateUser, faqRouter);
router.use("/coupon", authenticateUser, couponRouter);
router.use("/rating", authenticateUser, ratingRouter);
router.use("/customer", customerRouter);
router.use("/product", authenticateUser, productRouter);
router.use("/vehicle", authenticateUser, vehicleRouter);
router.use("/unit", authenticateUser, unitRouter);

/* Export the router */
module.exports = { router }
