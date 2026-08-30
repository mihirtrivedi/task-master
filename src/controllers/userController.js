const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  
  if (user) {
    res.json({
      success: true,
      data: {
        _id: user.id,
        name: user.name,
        email: user.email,
      }
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user.id);

  if (user) {
    user.name = req.body.name ? req.body.name.trim() : user.name;
    user.email = req.body.email ? req.body.email.toLowerCase().trim() : user.email;
    
    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      success: true,
      data: {
        _id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      }
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
