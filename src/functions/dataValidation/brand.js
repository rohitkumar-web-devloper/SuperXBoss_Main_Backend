const { brandSchema } = require("../../Validation/brand");
const { error } = require("../functions");

const brandValidation = async (_req, _res, next) => {
    console.log(_req.body,"req.bodyreq.body");
    
    const { error: customError, value } = brandSchema.validate({ ..._req.body, logo: _req.file }, { abortEarly: false })
    if (customError) {
        return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
    }
    next()
}

module.exports = { brandValidation }