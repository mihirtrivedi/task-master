const { z } = require('zod');

const VALID_STATUSES = ['Open', 'InProgress', 'Completed'];
const STATUS_MAP = {
  open: 'Open',
  inprogress: 'InProgress',
  completed: 'Completed',
};

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

const getTasksQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        STATUS_MAP[val.toLowerCase()] ||
        VALID_STATUSES.includes(val),
      { message: 'Invalid status filter. Use Open, InProgress, or Completed' }
    )
    .transform((val) => {
      if (!val) return undefined;
      return STATUS_MAP[val.toLowerCase()] || val;
    }),
  search: z.string().optional(),
  assignedTo: z.union([z.enum(['me']), objectIdSchema]).optional(),
  sortBy: z
    .enum(['createdAt', 'dueDate', 'title', 'status'])
    .optional()
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['Open', 'InProgress', 'Completed']).optional(),
  teamId: objectIdSchema.optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).optional(),
  description: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  status: z.enum(['Open', 'InProgress', 'Completed']).optional(),
});

const updateTaskStatusSchema = z.object({
  status: z.enum(['Open', 'InProgress', 'Completed']),
});

const assignTaskSchema = z.object({
  assignedTo: objectIdSchema,
});

const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000),
});

const generateDescriptionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
});

module.exports = {
  objectIdSchema,
  getTasksQuerySchema,
  paginationQuerySchema,
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  assignTaskSchema,
  addCommentSchema,
  generateDescriptionSchema,
};
