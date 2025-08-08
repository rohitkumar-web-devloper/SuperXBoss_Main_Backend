const { BrandTypeModel } = require('../../schemas/brandTypes');
const { error, success } = require('../../functions/functions');
const getAllBrandTypes = async (_req, _res) => {
    try {
        const brandTypes = await BrandTypeModel.find();
        return _res.status(200).json(success(brandTypes, "Brand Types fetched successfully"))
    } catch (err) {
        return _res.status(500).json(error(500, "Internal server error"));
    }
};


module.exports = { getAllBrandTypes };