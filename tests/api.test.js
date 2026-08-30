process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.NODE_ENV = 'test';

const { before, after, beforeEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const tokenBlocklist = require('../src/utils/tokenBlocklist');

let mongoServer;
let app;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  app = require('../src/app');
});

after(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  tokenBlocklist.reset();
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

const registerUser = async (user) => {
  const res = await request(app).post('/api/auth/register').send(user);
  assert.equal(res.status, 201);
  return res.body.data;
};

describe('TaskMaster API', () => {
  it('registers, logs in, and logs out a user', async () => {
    const user = await registerUser({
      name: 'Alice',
      email: 'alice@test.com',
      password: 'password123',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'alice@test.com',
      password: 'password123',
    });
    assert.equal(loginRes.status, 200);

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);
    assert.equal(logoutRes.status, 200);

    const profileRes = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${loginRes.body.data.token}`);
    assert.equal(profileRes.status, 401);
  });

  it('creates team, joins via invite code, and manages tasks', async () => {
    const admin = await registerUser({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
    });

    const member = await registerUser({
      name: 'Member',
      email: 'member@test.com',
      password: 'password123',
    });

    const teamRes = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Engineering', description: 'Backend team' });
    assert.equal(teamRes.status, 201);

    const inviteCode = teamRes.body.data.inviteCode;
    assert.ok(inviteCode);

    const joinRes = await request(app)
      .post('/api/teams/join')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ inviteCode });
    assert.equal(joinRes.status, 200);

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        title: 'Setup API',
        description: 'Initial setup',
        teamId: teamRes.body.data._id,
      });
    assert.equal(taskRes.status, 201);

    const assignRes = await request(app)
      .patch(`/api/tasks/${taskRes.body.data._id}/assign`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ assignedTo: member._id });
    assert.equal(assignRes.status, 200);

    const myTasksRes = await request(app)
      .get('/api/tasks?assignedTo=me')
      .set('Authorization', `Bearer ${member.token}`);
    assert.equal(myTasksRes.status, 200);
    assert.equal(myTasksRes.body.total, 1);

    const statusRes = await request(app)
      .patch(`/api/tasks/${taskRes.body.data._id}/status`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ status: 'Completed' });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.body.data.status, 'Completed');
  });

  it('filters, sorts, searches tasks and validates query params', async () => {
    const user = await registerUser({
      name: 'Bob',
      email: 'bob@test.com',
      password: 'password123',
    });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Alpha task', status: 'Open' });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Beta task', status: 'Completed' });

    const filterRes = await request(app)
      .get('/api/tasks?status=open&sortBy=title&sortOrder=asc')
      .set('Authorization', `Bearer ${user.token}`);
    assert.equal(filterRes.status, 200);
    assert.equal(filterRes.body.total, 1);
    assert.equal(filterRes.body.data[0].title, 'Alpha task');

    const searchRes = await request(app)
      .get('/api/tasks?search=Beta')
      .set('Authorization', `Bearer ${user.token}`);
    assert.equal(searchRes.status, 200);
    assert.equal(searchRes.body.total, 1);

    const invalidStatusRes = await request(app)
      .get('/api/tasks?status=Unknown')
      .set('Authorization', `Bearer ${user.token}`);
    assert.equal(invalidStatusRes.status, 400);
  });

  it('handles comments with pagination and blocks unauthorized access', async () => {
    const owner = await registerUser({
      name: 'Owner',
      email: 'owner@test.com',
      password: 'password123',
    });

    const outsider = await registerUser({
      name: 'Outsider',
      email: 'outsider@test.com',
      password: 'password123',
    });

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Private task' });
    const taskId = taskRes.body.data._id;

    const commentRes = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ content: 'First comment' });
    assert.equal(commentRes.status, 201);

    const paginatedRes = await request(app)
      .get(`/api/tasks/${taskId}/comments?page=1&limit=10`)
      .set('Authorization', `Bearer ${owner.token}`);
    assert.equal(paginatedRes.status, 200);
    assert.equal(paginatedRes.body.total, 1);

    const blockedRes = await request(app)
      .get(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${outsider.token}`);
    assert.equal(blockedRes.status, 404);

    const commentId = commentRes.body.data._id;
    const deleteCommentRes = await request(app)
      .delete(`/api/tasks/${taskId}/comments/${commentId}`)
      .set('Authorization', `Bearer ${owner.token}`);
    assert.equal(deleteCommentRes.status, 200);
  });

  it('normalizes email during registration and login', async () => {
    const user = await registerUser({
      name: 'Case Test',
      email: 'Case.User@Test.COM',
      password: 'password123',
    });

    assert.equal(user.email, 'case.user@test.com');

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'CASE.USER@TEST.COM',
      password: 'password123',
    });
    assert.equal(loginRes.status, 200);
  });

  it('updates profile information', async () => {
    const user = await registerUser({
      name: 'Old Name',
      email: 'profile@test.com',
      password: 'password123',
    });

    const updateRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ name: 'New Name' });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.name, 'New Name');
  });

  it('generates AI description with fallback when no API key', async () => {
    const user = await registerUser({
      name: 'AI User',
      email: 'ai@test.com',
      password: 'password123',
    });

    delete process.env.OPENAI_API_KEY;

    const res = await request(app)
      .post('/api/tasks/generate-description')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Deploy service' });

    assert.equal(res.status, 200);
    assert.ok(res.body.data.description.includes('Deploy service'));
  });
});
