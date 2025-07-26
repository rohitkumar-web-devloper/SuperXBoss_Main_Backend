const express = require("express");
const vehicleRouter = express.Router();
const { asyncHandler } = require("../../middleware/error-handler");
const { upload } = require("../../middleware/upload");
const { createVehicle, getVehicle, updateVehicle } = require("../../controllers/v1/vehicle");

vehicleRouter.put('/:vehicle_id/:brand_id', upload.single("picture"), asyncHandler(updateVehicle));
vehicleRouter.post('/:brand_id', upload.single("picture"), asyncHandler(createVehicle));
vehicleRouter.get('/:brand_id', asyncHandler(getVehicle));
module.exports = vehicleRouter;
