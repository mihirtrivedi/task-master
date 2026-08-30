const Team = require('../models/Team');
const User = require('../models/User');

const createTeam = async (req, res) => {
  const { name, description } = req.body;

  const team = await Team.create({
    name,
    description,
    createdBy: req.user.id,
    members: [{ user: req.user.id, role: 'Admin' }],
  });

  res.status(201).json({
    success: true,
    data: team,
  });
};

const getTeams = async (req, res) => {
  const teams = await Team.find({ 'members.user': req.user.id })
    .populate('members.user', 'name email');

  res.json({
    success: true,
    count: teams.length,
    data: teams,
  });
};

const joinTeam = async (req, res) => {
  const { inviteCode } = req.body;
  const cleanedCode = inviteCode ? inviteCode.trim() : '';

  const team = await Team.findOne({ inviteCode: cleanedCode });
  if (!team) {
    res.status(404);
    throw new Error('Invalid invite code');
  }

  const isAlreadyMember = team.members.some(
    (member) => member.user && member.user.toString() === req.user.id
  );

  if (isAlreadyMember) {
    res.status(409);
    throw new Error('You are already a member of this team');
  }

  team.members.push({ user: req.user.id, role: 'Member' });
  await team.save();

  res.json({
    success: true,
    message: 'Joined team successfully',
    data: team,
  });
};

const addMember = async (req, res) => {
  const { email, role } = req.body;
  const teamId = req.params.teamId;

  const team = await Team.findById(teamId);
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  const isCurrentUserAdmin =
    team.createdBy.toString() === req.user.id ||
    team.members.some(
      (member) => member.user && member.user.toString() === req.user.id && member.role === 'Admin'
    );

  if (!isCurrentUserAdmin) {
    res.status(403);
    throw new Error('User is not authorized to add members to this team');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const userToAdd = await User.findOne({ email: normalizedEmail });
  if (!userToAdd) {
    res.status(404);
    throw new Error('User with this email not found');
  }

  const isAlreadyMember = team.members.some(
    (member) => member.user && member.user.toString() === userToAdd.id
  );

  if (isAlreadyMember) {
    res.status(409);
    throw new Error('User is already a member of this team');
  }

  team.members.push({ user: userToAdd.id, role: role || 'Member' });
  await team.save();

  res.json({
    success: true,
    message: 'Member added successfully',
    data: team,
  });
};

const getMembers = async (req, res) => {
  const teamId = req.params.teamId;

  const team = await Team.findById(teamId).populate('members.user', 'name email');
  if (!team) {
    res.status(404);
    throw new Error('Team not found');
  }

  const isMember = team.members.some(
    (member) => member.user && member.user._id && member.user._id.toString() === req.user.id
  );

  if (!isMember) {
    res.status(403);
    throw new Error('Not authorized to view this team');
  }

  res.json({
    success: true,
    count: team.members.length,
    data: team.members,
    inviteCode: team.inviteCode,
  });
};

module.exports = {
  createTeam,
  getTeams,
  joinTeam,
  addMember,
  getMembers,
};
