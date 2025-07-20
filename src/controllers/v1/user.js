const { error, success } = require("../../functions/functions");
const { userValidationSchema, userLoginSchema, userUpdateSchema } = require("../../Validation/user");
const { UserModal } = require('../../schemas/user');
const { hashPassword, comparePassword, generateToken } = require("../../Helper");
const { imagePath } = require("../../functions/imagePath");
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
        const folder = _req.body.folder || 'user';
        const media = _req.file ? _req.file.filename : "";

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
        let src = '';
        if(media){
             src = imagePath(folder, media)
        }
        const newUser = new UserModal({
            ...value, password: haspassword, profile: src,
            createdBy: {
                _id,
                name
            }
        });
        const savedUser = await newUser.save();
        const { createdAt, updatedAt, access_token, password, ...rest } = savedUser.toObject()
        return _res.status(201).json(success(rest , "User created successfully"));
    } catch (err) {
        return _res.status(500).json(error(500, "Internal server errror"));
    }
};


const getUser = async (_req, _res) => {
    try {
        const { _id } = _req.user;

        const users = await UserModal.find({ _id: { $ne: _id } });

        return _res.status(200).json(success(users, "User fetch successfully"));

    } catch (err) {
        return _res.status(500).json(error(500, "Internal server errror"));
    }
};

const updateUser = async (_req, _res) => {
    try {
        const { userId } = _req.body;
        const { _id, name } = _req.user
        const folder = _req.body.folder || 'default';
        const media = _req.file ? _req.file.filename : "";
        if (!userId) {
            return _res.status(400).json({ error: 'User ID is required' });
        }

        const { error: customError, value } = userUpdateSchema.validate(_req.body, {
            abortEarly: false,
            presence: 'optional',
        });

        if (customError) {
            return _res
                .status(400)
                .json(error(400, customError.details.map((err) => err.message)[0]));
        }

        const user = await UserModal.findById(userId);
        if (!user) {
            return _res.status(404).json(error(400, 'User not found'));
        }

        // Check for duplicates on fields that can conflict
        let duplicateUser = null;

        if (value.email || value.mobile || value.whatsapp) {
            duplicateUser = await UserModal.findOne({
                _id: { $ne: userId },
                $or: [
                    value.email ? { email: value.email } : null,
                    value.mobile ? { mobile: value.mobile } : null,
                    value.whatsapp ? { whatsapp: value.whatsapp } : null
                ].filter(Boolean)
            });
        }

        if (duplicateUser) {
            return _res.status(409).json({
                error: 'Another user exists with this email, mobile, or WhatsApp number',
            });
        }

        // Hash password if updating
        if (value.password) {
            value.password = await hashPassword(value.password);
        }

        // Update only provided fields
        Object.keys(value).forEach((key) => {
            user[key] = value[key];
        });

        // profile update
        if (media) {
            user.profile = imagePath(folder, media)
        }

        // Set updatedBy
        user.updatedBy = {
            _id,
            name
        };

        const updatedUser = await user.save();
        const { password, access_token, createdAt, updatedAt, ...rest } = updatedUser.toObject();

        return _res.status(200).json({
            message: 'User updated successfully',
            user: rest
        });
    } catch (err) {
        console.error('Update User Error:', err);
        return _res.status(500).json({ error: 'Internal server error' });
    }
};


module.exports = { createUser, loginUser, updateUser, logoutUser, getUser } 