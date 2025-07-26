const express = require("express");
const unitRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { createUnit, updateUnit, getUnits } = require("../../controllers/v1/unit");

unitRouter.put('/:unit', asyncHandler(updateUnit));
unitRouter.post('/', asyncHandler(createUnit));
unitRouter.get('/', asyncHandler(getUnits));
module.exports = unitRouter;
