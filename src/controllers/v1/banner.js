
const fs = require('fs');
const path = require('path');
const { BannerModel } = require('../../schemas/banner');
const { error, success } = require('../../functions/functions');


const createBanner = async (_req, _res) => {
    try {
        const { product_id, status } = _req.body;
        const { originalname, buffer } = _req.file || {};

        const { error: customError, value } = bannerSchema.validate(
            { product_id, status, image: _req.file },
            { abortEarly: false }
        );

        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }

        // 2. Handle Image Upload
        let file = '';
        if (buffer && originalname) {
            file = await imageUpload(originalname, buffer, 'banner');
        } else {
            return _res.status(400).json(error(400, 'Image is required.'));
        }

        // 3. Save to DB
        const newBanner = await BannerModel.create({
            image: file,
            product_id: value.product_id,
            status: value.status,
            createdBy: _req.user._id,
        });

        _res.status(201).json(success(newBanner, 'Banner created successfully'));
    } catch (error) {
        return _res.status(500).json(error(500, err.message));
    }
};

const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { product_id, status } = req.body;

        const banner = await BannerModel.findById(id);
        if (!banner) return res.status(404).json({ success: false, message: 'Banner not found' });

        // Remove old image if new image is uploaded
        if (req.file && banner.image) {
            const imagePath = path.join(__dirname, '../uploads/banner', banner.image);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        const updatedBanner = await BannerModel.findByIdAndUpdate(
            id,
            {
                image: req.file ? req.file.filename : banner.image,
                product_id: product_id || banner.product_id,
                status: status ?? banner.status,
                updatedBy: req.user._id,
            },
            { new: true }
        );

        res.json({ success: true, banner: updatedBanner });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

const getBanners = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.page_size) || 15;
        const skip = (page - 1) * limit;

        const banners = await BannerModel.aggregate([
            {
                $match: {
                    // You can filter by product name or any other field if needed
                },
            },
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
        ]);

        res.json({ success: true, banners });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createBanner,
    updateBanner,
    getBanners,
};
