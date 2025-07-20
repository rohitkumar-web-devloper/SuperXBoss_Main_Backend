const { authenticateUser } = require('../middleware/authenticateUser');
const bannerRouter = require('./admin/banner.route');
const brandRouter = require('./admin/brand.route');
const categoryRouter = require('./admin/category.route');
const userRouter = require('./admin/user.route')

/* Packages */
const express = require("express")
const router = express.Router();

/* Routes */
router.use("/", userRouter);
router.use("/", authenticateUser, categoryRouter);
router.use("/brand", authenticateUser, brandRouter);
router.use("/banner", authenticateUser, bannerRouter);

/* Export the router */
module.exports = { router }
