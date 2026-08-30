const { z } = require('zod');

const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  email: z.string().email('Valid email is required to add a member'),
  role: z.enum(['Admin', 'Member']).optional(),
});

const joinTeamSchema = z.object({
  inviteCode: z.string().min(6, 'Invite code is required'),
});

module.exports = { createTeamSchema, addMemberSchema, joinTeamSchema };
