const { default: mongoose } = require("mongoose");
const { success, error, parseBool } = require("../../functions/functions");
const { imageUpload } = require("../../functions/imageUpload");
const unlinkOldFile = require("../../functions/unlinkFile");
const { VehicleModel } = require("../../schemas/vehicle");
const { vehicleValidationSchema, vehicleValidationUpdateSchema } = require("../../Validation/vehicle");
const { BrandModel } = require("../../schemas/brands");

const createVehicle = async (_req, _res) => {
    try {
        const { _id } = _req.user;
        const { originalname, buffer } = _req.file;
        if (!_req.body) {
            return _res.status(400).json(error(400, "Request body is required."));
        }
        const { error: customError } = vehicleValidationSchema.validate(
            { ..._req.body },
            { abortEarly: false }
        );
        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }
        const { name, description, status, start_year, end_year } = _req.body
        const { brand_id } = _req.params
        const brand = await BrandModel.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(brand_id) } },
            {
                $lookup: {
                    from: "brand_types",
                    localField: "type",
                    foreignField: "_id",
                    as: "brand_type"
                }
            },
            {
                $unwind: {
                    path: "$brand_type",
                    preserveNullAndEmptyArrays: true
                }
            },
        ])
        if (brand[0]?.brand_type.name != "Vehicle") {
            return _res.status(400).json(error(400, "Brand Type Vehicle is required."));
        }

        const check = await VehicleModel.findOne({ name, brand_id });
        if (check) {
            return _res.status(400).json(error(400, "Vehicle Already Exist."));
        }
        let create = new VehicleModel({
            name,
            description,
            status,
            brand_id,
            start_year,
            end_year,
            createdBy: _id
        })
        if (buffer && originalname) {
            create.picture = await imageUpload(originalname, buffer, "vehicle");
        }
        await create.save()
        return _res.status(200).json(success(create, "Vehicle Created successfully"));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
}
const updateVehicle = async (_req, _res) => {
    try {
        const { _id } = _req.user;
        const { vehicle_id, brand_id } = _req.params;
        const { originalname, buffer } = _req.file || {}
        if (!_req.body) {
            return _res.status(400).json(error(400, "Request body is required."));
        }
        const { error: customError } = vehicleValidationUpdateSchema.validate(
            { ..._req.body },
            { abortEarly: false }
        );
        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }
        const { name, description, status, start_year, end_year } = _req.body
        const vehicle = await VehicleModel.findById(vehicle_id);

        if (!vehicle) {
            return _res.status(404).json(error(404, 'Vehicle not found'));
        }
        const existing = await VehicleModel.findOne({
            name: { $regex: `^${name}$`, $options: 'i' },
            _id: { $ne: vehicle_id },
            brand_id: { $ne: brand_id },

        });
        if (existing) {
            return _res.status(409).json(error(409, 'Another vehicle with this name already exists'));
        }

        let updatedData = {
            name,
            description,
            status,
            start_year,
            end_year,
            updatedBy: _id
        };
        if (buffer && originalname) {
            if (vehicle.picture) {
                unlinkOldFile(vehicle.picture);
            }
            updatedData = {
                ...updatedData,
                picture: await imageUpload(originalname, buffer, "vehicle"),
            }
        }
        const updatedVehicle = await VehicleModel.findByIdAndUpdate(vehicle_id, updatedData, { new: true });
        return _res.status(200).json(success(updatedVehicle, "Vehicle Update successfully"));
    } catch (err) {
        console.log(err);
        return _res.status(500).json(error(500, err.message));
    }
}

const getVehicle = async (_req, _res) => {
    try {
        const { active, pagination = "true" } = _req.query || {}
        const usePagination = pagination === "true";
        const { brand_id } = _req.params || {}
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";
        const matchStage = {};
        if (search) {
            matchStage.$or = [
                { startYear: { $regex: search, $options: "i" } },
                { endYear: { $regex: search, $options: "i" } },
                { name: { $regex: search, $options: "i" } }
            ]

        }
        const booleanFilters = {
            status: parseBool(active),
        };
        if (brand_id) {
            booleanFilters["brand_id"] = new mongoose.Types.ObjectId(brand_id)
        }
        for (const [key, value] of Object.entries(booleanFilters)) {
            if (value !== undefined) {
                matchStage[key] = value;
            }
        }
        const aggregationPipeline = [
            {
                $addFields: {
                    startYear: { $toString: "$start_year" },
                    endYear: { $toString: "$end_year" }
                }
            },
            { $match: matchStage },

            {
                $lookup: {
                    from: "brands",
                    localField: "brand_id",
                    foreignField: "_id",
                    as: "brand"
                }
            },
            {
                $unwind: {
                    path: "$brand",
                    preserveNullAndEmptyArrays: true
                }
            },

            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy"
                }
            },
            {
                $unwind: {
                    path: "$createdBy",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Lookup updatedBy details
            {
                $lookup: {
                    from: "users",
                    localField: "updatedBy",
                    foreignField: "_id",
                    as: "updatedBy"
                }
            },
            {
                $unwind: {
                    path: "$updatedBy",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    "createdBy.access_token": 0,
                    "createdBy.password": 0,
                    "createdBy.createdAt": 0,
                    "createdBy.updatedAt": 0,
                    "createdBy.role": 0,
                    "createdBy.type": 0,
                    "createdBy.status": 0,
                    "updatedBy.access_token": 0,
                    "updatedBy.password": 0,
                    "updatedBy.createdAt": 0,
                    "updatedBy.updatedAt": 0,
                    "updatedBy.role": 0,
                    "updatedBy.type": 0,
                    "updatedBy.status": 0,
                    "brand_id": 0,

                }
            },
            {
                $facet: {
                    data: [
                        { $sort: { createdAt: -1 } },
                        ...(usePagination ? [{ $skip: skip }, { $limit: limit }] : [])
                    ],
                    totalCount: [
                        { $count: "count" }
                    ]
                }
            }
        ];

        const result = await VehicleModel.aggregate(aggregationPipeline)
        const vehicle = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;
        return _res.status(200).json(
            success(vehicle, "Vehicles fetched successfully",
                {
                    total,
                    page: usePagination ? page : 1,
                    limit: usePagination ? limit : total,
                    totalPages: usePagination ? Math.ceil(total / limit) : 1,
                }

            )
        );
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
}

module.exports = { getVehicle, createVehicle, updateVehicle }