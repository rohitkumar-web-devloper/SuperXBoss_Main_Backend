const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
};

const comparePassword = async (plainPassword, hashedPassword) => {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
};

const generateToken = (payload, secret = process.env.JWT_SECRET,) => {
    return jwt.sign(payload, secret);
};

const verifyToken = (token, secret = process.env.JWT_SECRET) => {
    try {
        const decoded = jwt.verify(token, secret);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error };
    }
};
module.exports = { hashPassword, comparePassword , generateToken, verifyToken };