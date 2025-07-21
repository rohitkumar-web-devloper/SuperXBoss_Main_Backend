const express = require("express");
const brandType = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { getAllBrandTypes } = require("../../controllers/v1/brandType");

brandType.get('/', asyncHandler(getAllBrandTypes));

module.exports = brandType;
