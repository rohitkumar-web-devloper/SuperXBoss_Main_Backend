const { error, success } = require('../../functions/functions');
const unlinkOldFile = require('../../functions/unlinkFile');
const { VehicleSegmentTypeModel } = require('../../schemas/VehicleSegmentType ');
const { vehicleSegmentTypeSchema } = require('../../Validation/vehicleSegmentType');
const { imageUpload } = require("../../functions/imageUpload");

const createVehicleSegmentTypes = async (_req, _res) => {
    try {
        const { error: validationError } = vehicleSegmentTypeSchema.validate(_req.body, { abortEarly: false });
        if (validationError) {
            return _res.status(400).json(error(400, validationError.details.map(err => err.message)[0]));
        }
        const { name, status } = _req.body;
        const { _id } = _req.user;
        if (!_req?.file) {
            return _res.status(400).json(error(400, "Image is required.."));
        }
        const segment = await VehicleSegmentTypeModel.findOne({ name });
        if (segment) {
            return _res.status(400).json(error(400, "Segment Already exist."));
        }
        const { originalname, buffer } = _req?.file || {};
        const create = new VehicleSegmentTypeModel({ name, status, createdBy: _id })

        if (originalname && buffer) {
            create.icon = await imageUpload(originalname, buffer, 'segment')
        }
        const savedSegment = await create.save()
        return _res.status(201).json(success(savedSegment));


    } catch (err) {
        console.error('Update Segment Error:', err);
        return _res.status(500).json(error(500, err.message));
    }
}
const updateVehicleSegmentType = async (_req, _res) => {
    try {
        const { error: validationError, value } = vehicleSegmentTypeSchema.validate(_req.body, { abortEarly: false });
        if (validationError) {
            return _res.status(400).json(error(400, validationError.details.map(err => err.message)[0]));
        }

        const { _id } = _req.user;
        const { segmentId } = _req.params || {};

        const segment = await VehicleSegmentTypeModel.findById(segmentId);
        if (!segment) {
            return _res.status(404).json(error(404, 'Vehicle segment type not found'));
        }


        const duplicate = await VehicleSegmentTypeModel.findOne({
            name: { $regex: `^${value.name}$`, $options: 'i' },
            _id: { $ne: segmentId }
        });
        if (duplicate) {
            return _res.status(409).json(error(409, 'Another segment type with this name already exists'));
        }

        const exist = await VehicleSegmentTypeModel.findById(segmentId)

        let updatedImage = exist.icon;
        if (_req.file && _req.file.buffer) {
            if (exist.icon) {
                unlinkOldFile(exist.icon);
            }
            updatedImage = await imageUpload(_req.file.originalname, _req.file.buffer, 'vehicle_segment_type');
        }

        const updatedData = {
            ...value,
            icon: updatedImage,
            updatedBy: _id
        };

        const updatedSegment = await VehicleSegmentTypeModel.findByIdAndUpdate(segmentId, updatedData, { new: true });

        const { createdAt, updatedAt, ...rest } = updatedSegment.toObject();
        return _res.status(200).json(success(rest, 'Segment type updated successfully'));
    } catch (err) {
        console.error('Update Segment Error:', err);
        return _res.status(500).json(error(500, err.message));
    }
};
const getVehicleSegmentTypes = async (_req, res) => {
    try {

        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || '';
        const pagination = _req.query.pagination || '';

        const matchStage = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        const aggregationPipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdBy'
                }
            },
            {
                $unwind: {
                    path: '$createdBy',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'updatedBy',
                    foreignField: '_id',
                    as: 'updatedBy'
                }
            },
            {
                $unwind: {
                    path: '$updatedBy',
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
                    "updatedBy.status": 0
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ];

        const result = await VehicleSegmentTypeModel.aggregate(aggregationPipeline);
        const segments = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        return res.status(200).json(
            success(
                segments,
                "Vehicle segment types fetched successfully",
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            )
        );
    } catch (error) {
        return _req.status(500).json({ success: false, message: error.message });
    }
};
const getVehicleSegmentWithOutPagination = async (_req, res) => {
    try {
        const result = await VehicleSegmentTypeModel.find({ status: true }).sort({ createdAt: -1 })
        return res.status(200).json(
            success(
                result,
                "Vehicle segment types fetched successfully",
            )
        );
    } catch (error) {
        return _req.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { updateVehicleSegmentType, getVehicleSegmentTypes, createVehicleSegmentTypes, getVehicleSegmentWithOutPagination }