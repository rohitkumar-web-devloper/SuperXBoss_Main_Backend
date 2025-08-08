const jwt = require('jsonwebtoken');
const { UserModal } = require('../schemas/user');
const { error } = require('../functions/functions');
const { CustomerModal } = require('../schemas/customers');

const authenticateUser = async (req, res, next) => {
  try {
    // Extract token from headers
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(error(400, 'Authorization token missing or invalid'));
    }

    const token = authHeader.split(' ')[1];
    let exist = null;
    if (token) {
      exist = await UserModal.findOne({ access_token: token })
    }

    if (!exist) {
      exist = await CustomerModal.findOne({ token })
    }


    if (exist) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded) {
        req.user = exist;
        next();
      }

    } else {
      return res.status(401).json(error(401, 'Unauthorized access'));
    }
    // Verify token


  } catch (err) {
    console.error('Auth Middleware Error:', err);
    return res.status(401).json({ error: 'Unauthorized access' });
  }
};

module.exports = { authenticateUser };
