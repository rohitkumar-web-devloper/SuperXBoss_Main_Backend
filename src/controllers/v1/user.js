const { error, success } = require("../../functions/functions");
const { userValidationSchema, userLoginSchema, userUpdateSchema } = require("../../Validation/user");
const { UserModal } = require('../../schemas/user');
const { hashPassword, comparePassword, generateToken } = require("../../Helper");
const { imageUpload } = require("../../functions/imageUpload");
const unlinkOldFile = require("../../functions/unlinkFile");
const { default: mongoose } = require("mongoose");

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
        const { _id } = _req.user
        const { originalname, buffer } = _req.file || {};
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
        let file = '';
        if (originalname && buffer) {
            file = await imageUpload(originalname, buffer, "user")
        }
        const newUser = new UserModal({
            ...value, password: haspassword, profile: file,
            createdBy: _id
        });
        const savedUser = await newUser.save();
        const { createdAt, updatedAt, access_token, password, ...rest } = savedUser.toObject()
        return _res.status(201).json(success(rest, "User created successfully"));
    } catch (err) {
        console.log(err.message);

        return _res.status(500).json(error(500, "Internal server errror"));
    }
};

const updateUser = async (_req, _res) => {
    try {
        const { userId } = _req.body;
        const { _id } = _req.user
        const { originalname, buffer } = _req?.file || {};
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

        if (originalname && buffer) {
            if (_req.file) {
                unlinkOldFile(user.profile)
            }
            user.profile = await imageUpload(originalname, buffer, 'user')
        }

        // Set updatedBy
        user.updatedBy = _id

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

const getUser = async (_req, _res) => {
    try {
        const { _id } = _req.user;
        const page = parseInt(_req.query.page) || 1;
        const limit = parseInt(_req.query.page_size) || 15;
        const skip = (page - 1) * limit;
        const search = _req.query.search || "";

        const matchQuery = {
            _id: { $ne: new mongoose.Types.ObjectId(_id) },
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        };

        const users = await UserModal.aggregate([
            { $match: matchQuery },

            // Lookup createdBy
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "_id",
                    as: "createdBy",
                },
            },
            { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

            // Lookup updatedBy
            {
                $lookup: {
                    from: "users",
                    localField: "updatedBy",
                    foreignField: "_id",
                    as: "updatedBy",
                },
            },
            { $unwind: { path: "$updatedBy", preserveNullAndEmptyArrays: true } },

            // Project all fields, but restrict fields from createdBy and updatedBy
            {
                $project: {
                    "createdBy.access_token": 0,
                    "createdBy.password": 0,
                    "createdBy.createdAt": 0,
                    "createdBy.updatedAt": 0,
                    "createdBy.role": 0,
                    "createdBy.type": 0,
                    "createdBy.status": 0,
                    "updatedBy.access_token": 0,
                    "updatedBy.password": 0,
                    "updatedBy.createdAt": 0,
                    "updatedBy.updatedAt": 0,
                    "updatedBy.role": 0,
                    "updatedBy.type": 0,
                    "updatedBy.status": 0,
                },
            },

            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
        ]);

        const total = await UserModal.countDocuments(matchQuery);

        return _res.status(200).json(
            success(users, "Users fetched successfully",
                {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },

            )
        );
    } catch (err) {
        console.error("Error in getUser:", err);
        return _res.status(500).json(error(500, "Internal server error"));
    }
};


module.exports = { createUser, loginUser, updateUser, logoutUser, getUser } 