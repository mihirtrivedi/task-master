const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const { registerSchema, loginSchema } = require('../validators/authValidators');

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/logout', protect, logoutUser);

module.exports = router;
