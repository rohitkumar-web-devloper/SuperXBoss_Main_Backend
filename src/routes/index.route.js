const { authenticateUser } = require('../middleware/authenticateUser');
const categoryRouter = require('./admin/category.route');
const userRouter = require('./admin/user.route')

/* Packages */
const express = require("express")
const router = express.Router();

/* Routes */
router.use("/", userRouter);
router.use("/", authenticateUser, categoryRouter);

/* Export the router */
module.exports = { router }
