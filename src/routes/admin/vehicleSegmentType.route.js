const express = require("express");
const vehicleSegmentType = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { upload } = require("../../middleware/upload");
const { updateVehicleSegmentType, getVehicleSegmentTypes, createVehicleSegmentTypes, getVehicleSegmentWithOutPagination } = require("../../controllers/v1/vehicleSegmentType ");
vehicleSegmentType.put('/:segmentId', upload.single('icon'), asyncHandler(updateVehicleSegmentType));
vehicleSegmentType.post('/', upload.single('icon'), asyncHandler(createVehicleSegmentTypes));
vehicleSegmentType.get('/', asyncHandler(getVehicleSegmentTypes));
vehicleSegmentType.get('/without-page', asyncHandler(getVehicleSegmentWithOutPagination));

module.exports = vehicleSegmentType;
