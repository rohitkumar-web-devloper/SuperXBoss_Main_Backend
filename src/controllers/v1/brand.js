const { error, success } = require("../../functions/functions");
const { BrandModel } = require("../../schemas/brands");
const { brandSchema, updateBrandSchema } = require("../../Validation/brand");
const { imagePath } = require("../../functions/imagePath");
const createBrand = async (_req, _res) => {
    try {
        const { _id, name } = _req.user
        const folder = _req.body?.folder || 'brand';
        const media = _req.file ? _req.file.filename : "";

        const { error: customError, value } = brandSchema.validate({ ..._req.body, logo: _req.file }, { abortEarly: false })
        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }
        // Check if brand already exists with same name (case-insensitive)
        const existing = await BrandModel.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
        if (existing) {
            return _res.status(409).json(error(400, 'Brand with this name already exists'));
        }

        let src = '';
        if (media) {
            src = imagePath(folder, media)
        }

        const brand = new BrandModel({
            ...value, logo: src,
            createdBy: {
                _id,
                name
            }
        });
        const savebrand = await brand.save();
        const { createdAt, updatedAt, ...rest } = savebrand.toObject()
        return _res.status(201).json(success(rest, 'Brand created successfully'));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};


const updateBrand = async (_req, _res) => {
    try {
        const { _id, name: updatedByName } = _req.user;
        const { brandId } = _req.body; 
        const folder = _req.body?.folder || 'brand';
        const media = _req.file ? _req.file.filename : "";

        // Validate input using brandSchema
        const { error: customError, value } = updateBrandSchema.validate(_req.body, { abortEarly: false });

        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }

        // Check if brand exists
        const brand = await BrandModel.findById({_id:brandId});
        if (!brand) {
            return _res.status(404).json(error(404, 'Brand not found'));
        }

        // Check for duplicate name (ignore current brand)
        const existing = await BrandModel.findOne({
            name: { $regex: `^${value.name}$`, $options: 'i' },
            _id: { $ne: brandId}
        });
        if (existing) {
            return _res.status(409).json(error(409, 'Another brand with this name already exists'));
        }

        // Build update data
        let updatedLogo = brand.logo;
        if (media) {
            updatedLogo = imagePath(folder, media);
        }

        const updatedData = {
            ...value,
            logo: updatedLogo,
            updatedBy: {
                _id,
                name: updatedByName
            }
        };

        const updatedBrand = await BrandModel.findByIdAndUpdate(brandId, updatedData, { new: true });

        const { createdAt, updatedAt, ...rest } = updatedBrand.toObject();
        return _res.status(200).json(success(rest, 'Brand updated successfully'));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};


const getBrands = async (_req, res) => {
    try {
        const brands = await BrandModel.find().sort({ sorting: 1 });

        return res.status(200).json({
            success: true,
            data: brands,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { createBrand, updateBrand, getBrands }