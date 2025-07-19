const express = require("express")
const { asyncHandler } = require("../middleware/error-handler")
const route = express.Router()


// route.post("/no-auth/vendor", asyncHandler(createVendor))


module.exports = route