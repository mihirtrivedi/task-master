const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/taskController');
const { protect } = require('../middlewares/authMiddleware');
const { handleUpload } = require('../middlewares/uploadMiddleware');
const { validate, validateQuery } = require('../middlewares/validationMiddleware');
const {
  getTasksQuerySchema,
  paginationQuerySchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  addCommentSchema,
  generateDescriptionSchema,
} = require('../validators/taskValidators');

router.use(protect);

router.route('/')
  .post(validate(createTaskSchema), createTask)
  .get(validateQuery(getTasksQuerySchema), getTasks);

router.route('/generate-description')
  .post(validate(generateDescriptionSchema), generateDescription);

router.route('/:taskId')
  .get(getTaskById)
  .put(validate(updateTaskSchema), updateTask)
  .delete(deleteTask);

router.route('/:taskId/status')
  .patch(validate(updateTaskStatusSchema), updateTaskStatus);

router.route('/:taskId/assign')
  .patch(validate(assignTaskSchema), assignTask);

router.route('/:taskId/comments')
  .post(validate(addCommentSchema), addComment)
  .get(validateQuery(paginationQuerySchema), getComments);

router.route('/:taskId/comments/:commentId')
  .delete(deleteComment);

router.route('/:taskId/attachments')
  .post(handleUpload('file'), addAttachment)
  .get(validateQuery(paginationQuerySchema), getAttachments);

router.route('/:taskId/attachments/:attachmentId')
  .delete(deleteAttachment);

module.exports = router;
