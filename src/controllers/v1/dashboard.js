const { success, error } = require("../../functions/functions");

const getOverView = async (_req, _res) => {
    try {
        const data = {
            brand: {
                active: 1,
                inActive: 2
            }
        }



        return _res
            .status(200)
            .json(success(data, "Dashboard fetch successfully."));
    } catch (err) {
        return _res.status(500).json(error(500, err.message));
    }
};

module.exports = { getOverView }