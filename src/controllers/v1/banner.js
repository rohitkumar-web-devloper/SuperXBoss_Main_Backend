
const { error, success } = require('../../functions/functions');
const { BannerModel } = require('../../schemas/banner');
const { bannerSchema, updateBannerSchema } = require('../../Validation/banner');
const { imageUpload } = require("../../functions/imageUpload");
const unlinkOldFile = require("../../functions/unlinkFile");

const createBanner = async (_req, _res) => {
    try {
        const { error: customError, value } = bannerSchema.validate(
            { ..._req.body, image: _req.file },
            { abortEarly: false }
        );

        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }

        const { originalname, buffer } = _req.file || {};
        // 2. Handle Image Upload
        let file = '';
        if (buffer && originalname) {
            file = await imageUpload(originalname, buffer, 'banner');
        } else {
            return _res.status(400).json(error(400, 'Image is required.'));
        }

        // 3. Save to DB
        const newBanner = await BannerModel.create({
            ..._req.body,
            image: file,
            createdBy: _req.user._id,
        });

        _res.status(201).json(success(newBanner, 'Banner created successfully'));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};

const updateBanner = async (_req, _res) => {
    try {
        const { _id } = _req.user;
        const { bannerId } = _req.body;

        const { error: customError, value } = updateBannerSchema.validate(
            { ..._req.body, image: _req.file },
            { abortEarly: false }
        );

        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }

        // Find banner
        const banner = await BannerModel.findById(bannerId);
        if (!banner) {
            return _res.status(404).json(error(404, 'Banner not found'));
        }

        // Check for duplicate product_id (optional)
        if (value.product_id) {
            const existing = await BannerModel.findOne({
                product_id: value.product_id,
                _id: { $ne: bannerId }
            });
            if (existing) {
                return _res.status(409).json(error(409, 'Another banner with this product ID already exists'));
            }
        }

        // Handle image upload
        let updatedImage = banner.image;
        if (_req.file && _req.file.buffer) {
            if (banner.image) {
                unlinkOldFile(banner.image);
            }
            updatedImage = await imageUpload(_req.file.originalname, _req.file.buffer, 'banner');
        }

        const updatedData = {
            ...value,
            image: updatedImage,
            updatedBy: _id,
        };

        const updatedBanner = await BannerModel.findByIdAndUpdate(bannerId, updatedData, { new: true });

        const { createdAt, updatedAt, ...rest } = updatedBanner.toObject();
        return _res.status(200).json(success(rest, 'Banner updated successfully'));
    } catch (err) {
        console.error('Update Banner Error:', err);
        return _res.status(500).json(error(500, err.message));
    }
};

const getBanners = async (_req, _res) => {
    try {
        const search = _req.query.search?.trim() || '';
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;

        const matchStage = {}; // You can customize base filtering here if needed

        const bannersPipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: 'products',
                    localField: 'product_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            {
                $unwind: {
                    path: '$product',
                    preserveNullAndEmptyArrays: true,
                },
            },

            // Filter by product.name (case-insensitive)
            ...(search
                ? [{
                    $match: {
                        'product.name': { $regex: search, $options: 'i' },
                    },
                }]
                : []),

            {
                $lookup: {
                    from: 'users',
                    localField: 'createdBy',
                    foreignField: '_id',
                    as: 'createdBy',
                },
            },
            {
                $unwind: {
                    path: '$createdBy',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'updatedBy',
                    foreignField: '_id',
                    as: 'updatedBy',
                },
            },
            {
                $unwind: {
                    path: '$updatedBy',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    image: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    'product._id': 1,
                    'product.name': 1,
                    'createdBy._id': 1,
                    'createdBy.name': 1,
                    'updatedBy._id': 1,
                    'updatedBy.name': 1,
                },
            },
            { $skip: skip },
            { $limit: limit },
        ];

        const [banners, totalCountArr] = await Promise.all([
            BannerModel.aggregate(bannersPipeline),
            BannerModel.aggregate([
                ...bannersPipeline.slice(0, -2), // Remove $skip and $limit
                { $count: 'total' }
            ])
        ]);

        const total = totalCountArr[0]?.total || 0;

        return _res.status(200).json(
            success(
                banners,
                "Banners fetched successfully",
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                }
            )
        );
    } catch (error) {
        _res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createBanner,
    updateBanner,
    getBanners,
};
