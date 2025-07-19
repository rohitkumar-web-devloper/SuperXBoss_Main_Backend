const jwt = require('jsonwebtoken');
const { UserModal } = require('../schemas/user');
const { error } = require('../functions/functions');

const authenticateUser = async (req, res, next) => {
  try {
    // Extract token from headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(error(400, 'Authorization token missing or invalid'));
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token
    const user = await UserModal.findById(decoded._id);
    if (!user || user.access_token !== token) {
      return res.status(401).json(error(400, 'Unauthorized or token expired'));
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({ error: 'Unauthorized access' });
  }
};

module.exports = { authenticateUser };
