const axios = require("axios")
const { decodeToken, error, decodeRefreshToken } = require("../functions/functions");
const verifyToken = async (req, res, next) => {
    try {
        if (!req.originalUrl.includes("no-auth")) {

            let token;

            let decodeTkn
            if (!token && req.cookies.refresh_token) {
                token = req.cookies.refresh_token
                decodeTkn = decodeRefreshToken(token)
            }


            if (!token) {
                return res.status(401).json(error(401, "Unauthorized: No token provided"))
            }
            if (!decodeTkn.valid) {
                return res.status(400).json(error("Token is expired."))
            }
            if (!decodeTkn.payload.id) {
                return res.status(400).json(error("Invalid token"))
            }
            // ✅ Redis session check
            const email = decodeTkn.payload.email;

        }
        next()
    } catch (err) {
        console.log(err);
        return res.status(400).json(error(400, err.message));
    }
}

module.exports = { verifyToken }