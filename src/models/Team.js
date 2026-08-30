const mongoose = require('mongoose');
const crypto = require('crypto');

const generateInviteCode = () => crypto.randomBytes(6).toString('hex');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  inviteCode: {
    type: String,
    unique: true,
    default: generateInviteCode,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['Admin', 'Member'],
        default: 'Member',
      },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
