const Team = require('../models/Team');
const Task = require('../models/Task');

const getUserTeamIds = async (userId) => {
  const userTeams = await Team.find({ 'members.user': userId }).select('_id');
  return userTeams.map((t) => t._id);
};

const buildTaskAccessFilter = (userId, teamIds) => ({
  $or: [
    { createdBy: userId },
    { assignedTo: userId },
    { teamId: { $in: teamIds } },
  ],
});

const findAccessibleTask = async (taskId, userId) => {
  const teamIds = await getUserTeamIds(userId);
  return Task.findOne({
    _id: taskId,
    ...buildTaskAccessFilter(userId, teamIds),
  });
};

module.exports = {
  getUserTeamIds,
  buildTaskAccessFilter,
  findAccessibleTask,
};
