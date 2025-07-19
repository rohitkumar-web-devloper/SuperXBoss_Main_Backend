const userRouter = require('./admin/user.route')

/* Packages */
const express = require("express")
const router = express.Router();

/* Routes */
router.use("/",userRouter);

/* Export the router */
module.exports={router}
