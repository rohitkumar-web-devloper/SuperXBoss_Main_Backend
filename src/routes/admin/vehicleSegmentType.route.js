const express = require("express");
const vehicleSegmentType = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { upload } = require("../../middleware/upload");
const { updateVehicleSegmentType, getVehicleSegmentTypes } = require("../../controllers/v1/vehicleSegmentType ");
vehicleSegmentType.put('/', upload.single('icon'), asyncHandler(updateVehicleSegmentType));
vehicleSegmentType.get('/', asyncHandler(getVehicleSegmentTypes));

module.exports = vehicleSegmentType;
