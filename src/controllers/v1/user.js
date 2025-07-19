const { error, success } = require("../../functions/functions");
const { userValidationSchema, userLoginSchema } = require("../../Validation/user");
const { UserModal } = require('../../schemas/user');
const { hashPassword, comparePassword, generateToken } = require("../../Helper");
const loginUser = async (_req, _res) => {
    try {
        const { error: customError, value } = userLoginSchema.validate(_req.body);
        if (customError) {
            return _res.status(400).json({ error: customError.details[0].message });
        }

        const existingUser = await UserModal.findOne({ email: value.email });
        if (!existingUser) {
            return _res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await comparePassword(value.password, existingUser.password);
        if (!isMatch) {
            return _res.status(401).json({ error: 'Invalid email or password' });
        }

        const userObj = existingUser.toObject();
        const { password, createdAt, updatedAt, access_token, ...tokenPayload } = userObj;
        const token = generateToken(tokenPayload);

        existingUser.access_token = token;
        await existingUser.save();

        const responseUser = { ...tokenPayload, access_token: token };
        return _res.status(200).json(success(responseUser));

    } catch (err) {
        console.error('Login error:', err);
        return _res.status(500).json({ error: 'Internal Server Error' });
    }
};

const logoutUser = async (_req, _res) => {
    try {
        const { _id } = _req.user

        if (!_id) {
            return _res.status(400).json({ error: '_id is required' });
        }

        const user = await UserModal.findById(_id);
        if (!user) {
            return _res.status(404).json({ error: 'User not found' });
        }

        // Remove the access_token
        user.access_token = '';
        await user.save();

        return _res.status(200).json(success({}, 'Logout successful'));

    } catch (err) {
        console.error('Logout error:', err);
        return _res.status(500).json(error(500, 'Internal Server Error'));
    }
};

const createUser = async (_req, _res) => {
    try {
        const { _id, name } = _req.user
        console.log(_req.user);

        const { error: customError, value } = userValidationSchema.validate(_req.body, { abortEarly: false });

        if (customError) {
            return _res.status(400).json(error(400, customError.details.map(err => err.message)[0]));
        }

        const existingUser = await UserModal.findOne({
            $or: [
                { email: value.email },
                { mobile: value.mobile },
                { whatsapp: value.whatsapp }
            ]
        });

        if (existingUser) {
            return _res.status(409).json({ error: 'User already exists with this email or mobile or whatsapp number' });
        }
        const haspassword = await hashPassword(value.password)
        const newUser = new UserModal({
            ...value, password:haspassword, createdBy: {
                _id,
                name
            }
        });
        const savedUser = await newUser.save();
        const {createdAt , updatedAt , access_token, password , ...rest } = savedUser.toObject()
        return _res.status(201).json({
            message: 'User created successfully',
            user: rest
        });
    } catch (err) {
        console.error('Create user error:', err);
        return _res.status(500).json(error(500, "Internal server errror"));
    }
};

const updateUser = async (_req, _res) => {
    return
}

module.exports = { createUser, loginUser, updateUser, logoutUser } 