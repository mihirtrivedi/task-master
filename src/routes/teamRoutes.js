const express = require('express');
const router = express.Router();
const {
  createTeam,
  getTeams,
  joinTeam,
  addMember,
  getMembers,
} = require('../controllers/teamController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const {
  createTeamSchema,
  addMemberSchema,
  joinTeamSchema,
} = require('../validators/teamValidators');

router.use(protect);

router.route('/')
  .post(validate(createTeamSchema), createTeam)
  .get(getTeams);

router.post('/join', validate(joinTeamSchema), joinTeam);

router.route('/:teamId/members')
  .post(validate(addMemberSchema), addMember)
  .get(getMembers);

module.exports = router;
