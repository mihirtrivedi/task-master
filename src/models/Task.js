const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a task title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    dueDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Open', 'InProgress', 'Completed'],
      default: 'Open'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Task', taskSchema);
