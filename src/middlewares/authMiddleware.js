const jwt = require('jsonwebtoken');
const User = require('../models/User');
const tokenBlocklist = require('../utils/tokenBlocklist');

const protect = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];

      if (tokenBlocklist.isBlocked(token)) {
        res.status(401);
        throw new Error('Not authorized, token revoked');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      req.token = token;
      return next();
    } catch (error) {
      if (error.message === 'Not authorized, token revoked') {
        throw error;
      }
      console.error(error);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  res.status(401);
  throw new Error('Not authorized, no token');
};

module.exports = { protect };
