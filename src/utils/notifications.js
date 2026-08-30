const io = require('../config/socket');

const notifyUser = (userId, event, payload) => {
  try {
    io.getIo().to(userId.toString()).emit(event, payload);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Notification error:', error.message);
    }
  }
};

const notifyTaskStakeholders = (task, updatedByUserId, changeType) => {
  const recipients = new Set();

  if (task.createdBy) recipients.add(task.createdBy.toString());
  if (task.assignedTo) recipients.add(task.assignedTo.toString());

  recipients.delete(updatedByUserId.toString());

  recipients.forEach((userId) => {
    notifyUser(userId, 'taskUpdated', {
      message: `Task "${task.title}" was ${changeType}`,
      taskId: task._id,
      changeType,
    });
  });
};

module.exports = { notifyUser, notifyTaskStakeholders };
