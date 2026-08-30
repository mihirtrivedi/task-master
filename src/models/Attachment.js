const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  mimeType: {
    type: String
  },
  size: {
    type: Number
  }
}, { timestamps: true });

module.exports = mongoose.model('Attachment', attachmentSchema);
