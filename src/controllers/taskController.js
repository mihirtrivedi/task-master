const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const {
  getUserTeamIds,
  buildTaskAccessFilter,
  findAccessibleTask,
} = require('../utils/taskAccess');
const { escapeRegex } = require('../utils/regexEscape');
const { notifyUser, notifyTaskStakeholders } = require('../utils/notifications');
const { deleteAttachmentFiles } = require('../utils/fileCleanup');
const { generateTaskDescription } = require('../services/aiService');

const createTask = async (req, res) => {
  const { title, description, dueDate, status, teamId } = req.body;

  if (teamId) {
    const team = await Team.findById(teamId);
    if (!team || !team.members.some((m) => m.user.toString() === req.user.id)) {
      res.status(403);
      throw new Error('Not authorized to create a task for this team');
    }
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    status,
    teamId: teamId || undefined,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: task,
  });
};

const getTasks = async (req, res) => {
  const {
    status,
    search,
    assignedTo,
    sortBy,
    sortOrder,
    page,
    limit,
  } = req.query;

  const teamIds = await getUserTeamIds(req.user.id);
  const query = buildTaskAccessFilter(req.user.id, teamIds);

  if (status) {
    query.status = status;
  }

  if (assignedTo) {
    if (assignedTo === 'me') {
      query.assignedTo = req.user.id;
    } else {
      query.assignedTo = assignedTo;
    }
  }

  if (search) {
    const safeSearch = escapeRegex(search);
    query.$and = [
      {
        $or: [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
        ],
      },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  const tasks = await Task.find(query)
    .skip(skip)
    .limit(limit)
    .sort(sort);

  const total = await Task.countDocuments(query);

  res.json({
    success: true,
    count: tasks.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: tasks,
  });
};

const getTaskById = async (req, res) => {
  const task = await findAccessibleTask(req.params.taskId, req.user.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.json({
    success: true,
    data: task,
  });
};

const updateTask = async (req, res) => {
  const task = await findAccessibleTask(req.params.taskId, req.user.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const { title, description, dueDate, status } = req.body;
  const updates = {};

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (dueDate !== undefined) updates.dueDate = dueDate;
  if (status !== undefined) updates.status = status;

  const updatedTask = await Task.findByIdAndUpdate(
    req.params.taskId,
    updates,
    { new: true, runValidators: true }
  );

  notifyTaskStakeholders(updatedTask, req.user.id, 'updated');

  res.json({
    success: true,
    data: updatedTask,
  });
};

const updateTaskStatus = async (req, res) => {
  const task = await findAccessibleTask(req.params.taskId, req.user.id);

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  task.status = req.body.status;
  await task.save();

  notifyTaskStakeholders(task, req.user.id, `marked as ${task.status}`);

  res.json({
    success: true,
    data: task,
  });
};

const deleteTask = async (req, res) => {
  const teamIds = await getUserTeamIds(req.user.id);

  const task = await Task.findOne({
    _id: req.params.taskId,
    $or: [{ createdBy: req.user.id }, { teamId: { $in: teamIds } }],
  });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const attachments = await Attachment.find({ task: task._id });
  deleteAttachmentFiles(attachments);

  await Promise.all([
    Comment.deleteMany({ task: task._id }),
    Attachment.deleteMany({ task: task._id }),
    task.deleteOne(),
  ]);

  res.json({
    success: true,
    message: 'Task removed',
  });
};

const assignTask = async (req, res) => {
  const { assignedTo } = req.body;

  const task = await findAccessibleTask(req.params.taskId, req.user.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const userToAssign = await User.findById(assignedTo);
  if (!userToAssign) {
    res.status(404);
    throw new Error('Assigned user not found');
  }

  if (task.teamId) {
    const team = await Team.findById(task.teamId);
    if (!team || !team.members.some((m) => m.user.toString() === req.user.id)) {
      res.status(404);
      throw new Error('Task not found');
    }

    if (!team.members.some((m) => m.user.toString() === assignedTo)) {
      res.status(400);
      throw new Error('Assigned user is not a member of this team');
    }
  }

  task.assignedTo = assignedTo;
  await task.save();

  notifyUser(assignedTo, 'taskAssigned', {
    message: `You have been assigned to task: ${task.title}`,
    taskId: task._id,
  });

  res.json({
    success: true,
    data: task,
  });
};

const addComment = async (req, res) => {
  const task = await findAccessibleTask(req.params.taskId, req.user.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const comment = await Comment.create({
    task: task._id,
    user: req.user.id,
    content: req.body.content,
  });

  await comment.populate('user', 'name email');

  notifyTaskStakeholders(task, req.user.id, 'added a comment to');

  res.status(201).json({
    success: true,
    data: comment,
  });
};

const getComments = async (req, res) => {
  const { page, limit } = req.query;

  const task = await findAccessibleTask(req.params.taskId, req.user.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ task: task._id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Comment.countDocuments({ task: task._id }),
  ]);

  res.json({
    success: true,
    count: comments.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: comments,
  });
};

const deleteComment = async (req, res) => {
  const task = await findAccessibleTask(req.params.taskId, req.user.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const comment = await Comment.findOne({
    _id: req.params.commentId,
    task: task._id,
  });

  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  if (comment.user.toString() !== req.user.id && task.createdBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  await comment.deleteOne();

  res.json({
    success: true,
    message: 'Comment deleted',
  });
};

const addAttachment = async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const task = await findAccessibleTask(req.params.taskId, req.user.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  const attachment = await Attachment.create({
    task: task._id,
    user: req.user.id,
    fileName: req.file.originalname,
    fileUrl,
    mimeType: req.file.mimetype,
    size: req.file.size,
  });

  notifyTaskStakeholders(task, req.user.id, 'added an attachment to');

  res.status(201).json({
    success: true,
    data: attachment,
  });
};

const getAttachments = async (req, res) => {
  const { page, limit } = req.query;

  const task = await findAccessibleTask(req.params.taskId, req.user.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const skip = (page - 1) * limit;

  const [attachments, total] = await Promise.all([
    Attachment.find({ task: task._id })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Attachment.countDocuments({ task: task._id }),
  ]);

  res.json({
    success: true,
    count: attachments.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: attachments,
  });
};

const deleteAttachment = async (req, res) => {
  const task = await findAccessibleTask(req.params.taskId, req.user.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const attachment = await Attachment.findOne({
    _id: req.params.attachmentId,
    task: task._id,
  });

  if (!attachment) {
    res.status(404);
    throw new Error('Attachment not found');
  }

  if (attachment.user.toString() !== req.user.id && task.createdBy.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this attachment');
  }

  deleteAttachmentFiles([attachment]);
  await attachment.deleteOne();

  res.json({
    success: true,
    message: 'Attachment deleted',
  });
};

const generateDescription = async (req, res) => {
  const { title } = req.body;
  const description = await generateTaskDescription(title);

  res.json({
    success: true,
    data: { description },
  });
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  deleteTask,
  assignTask,
  addComment,
  getComments,
  deleteComment,
  addAttachment,
  getAttachments,
  deleteAttachment,
  generateDescription,
};
