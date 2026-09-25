const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../index');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');

let mongoServer;

// Helper to register and get token
const registerAndLogin = async (userData) => {
  await request(app).post('/api/auth/register').send(userData);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: userData.email, password: userData.password });
  return res.body.token;
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean all collections before each test
  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
});

// =====================
// AUTHENTICATION TESTS
// =====================
describe('Authentication', () => {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'manager',
  };

  test('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
    expect(res.body.user.name).toBe(testUser.name);
  });

  test('should not register with duplicate email', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already registered');
  });

  test('should not register without required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@test.com' });

    expect(res.status).toBe(400);
  });

  test('should login with valid credentials', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('should reject login with wrong password', async () => {
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('should get current user with valid token', async () => {
    const token = await registerAndLogin(testUser);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');

    expect(res.status).toBe(401);
  });
});

// =====================
// AUTHORIZATION TESTS
// =====================
describe('Authorization', () => {
  test('employee should not create a project', async () => {
    const empToken = await registerAndLogin({
      name: 'Employee',
      email: 'emp@test.com',
      password: 'password123',
      role: 'employee',
    });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        name: 'Test Project',
        startDate: '2026-10-01',
        deadline: '2026-12-31',
      });

    expect(res.status).toBe(403);
  });

  test('manager should create a project', async () => {
    const mgrToken = await registerAndLogin({
      name: 'Manager',
      email: 'mgr@test.com',
      password: 'password123',
      role: 'manager',
    });

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        name: 'Test Project',
        startDate: '2026-10-01',
        deadline: '2026-12-31',
      });

    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe('Test Project');
  });

  test('employee should not access users list', async () => {
    const empToken = await registerAndLogin({
      name: 'Employee',
      email: 'emp@test.com',
      password: 'password123',
      role: 'employee',
    });

    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${empToken}`);

    expect(res.status).toBe(403);
  });
});

// =====================
// TASK CREATION & ASSIGNMENT TESTS
// =====================
describe('Task Creation & Assignment', () => {
  let mgrToken, empToken, project, empUser;

  beforeEach(async () => {
    // Create manager and employee
    mgrToken = await registerAndLogin({
      name: 'Manager',
      email: 'mgr@test.com',
      password: 'password123',
      role: 'manager',
    });

    const empRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Employee', email: 'emp@test.com', password: 'password123', role: 'employee' });
    empUser = empRes.body.user;
    empToken = empRes.body.token;

    // Create a project with employee as team member
    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        name: 'Test Project',
        startDate: '2026-10-01',
        deadline: '2026-12-31',
        teamMembers: [empUser.id],
      });
    project = projRes.body.project;
  });

  test('manager can create a task', async () => {
    const res = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        title: 'Test Task',
        dueDate: '2026-11-01',
        priority: 'high',
        assignee: empUser.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Test Task');
    expect(res.body.task.priority).toBe('high');
  });

  test('should not assign task to non-project member', async () => {
    // Create another user who is NOT in the project
    const outsiderRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Outsider', email: 'outsider@test.com', password: 'password123', role: 'employee' });

    const res = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        title: 'Task for Outsider',
        dueDate: '2026-11-01',
        assignee: outsiderRes.body.user.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('team member');
  });

  test('employee cannot create tasks', async () => {
    const res = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({
        title: 'Employee Task',
        dueDate: '2026-11-01',
      });

    expect(res.status).toBe(403);
  });
});

// =====================
// STATUS TRANSITION TESTS
// =====================
describe('Status Transitions', () => {
  let mgrToken, empToken, task, project, empUser;

  beforeEach(async () => {
    mgrToken = await registerAndLogin({
      name: 'Manager',
      email: 'mgr@test.com',
      password: 'password123',
      role: 'manager',
    });

    const empRes = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Employee', email: 'emp@test.com', password: 'password123', role: 'employee' });
    empUser = empRes.body.user;
    empToken = empRes.body.token;

    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        name: 'Status Test Project',
        startDate: '2026-10-01',
        deadline: '2026-12-31',
        teamMembers: [empUser.id],
      });
    project = projRes.body.project;

    const taskRes = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        title: 'Status Task',
        dueDate: '2026-11-01',
        assignee: empUser.id,
      });
    task = taskRes.body.task;
  });

  test('should allow valid transition: todo -> in_progress', async () => {
    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('in_progress');
  });

  test('should reject invalid transition: todo -> completed', async () => {
    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ status: 'completed' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid status transition');
  });

  test('should reject invalid transition: todo -> review', async () => {
    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ status: 'review' });

    expect(res.status).toBe(400);
  });

  test('should allow full workflow: todo -> in_progress -> review -> completed', async () => {
    // todo -> in_progress
    let res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ status: 'in_progress' });
    expect(res.status).toBe(200);

    // in_progress -> review
    res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ status: 'review' });
    expect(res.status).toBe(200);

    // review -> completed
    res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${empToken}`)
      .send({ status: 'completed' });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('completed');
  });
});

// =====================
// BUSINESS RULES TESTS
// =====================
describe('Business Rules', () => {
  let mgrToken, emp1Token, emp2Token, project, task;

  beforeEach(async () => {
    mgrToken = await registerAndLogin({
      name: 'Manager',
      email: 'mgr@test.com',
      password: 'password123',
      role: 'manager',
    });

    const emp1Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Employee 1', email: 'emp1@test.com', password: 'password123', role: 'employee' });
    emp1Token = emp1Res.body.token;

    const emp2Res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Employee 2', email: 'emp2@test.com', password: 'password123', role: 'employee' });
    emp2Token = emp2Res.body.token;

    const projRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        name: 'Rules Test Project',
        startDate: '2026-10-01',
        deadline: '2026-12-31',
        teamMembers: [emp1Res.body.user.id, emp2Res.body.user.id],
      });
    project = projRes.body.project;

    const taskRes = await request(app)
      .post(`/api/projects/${project._id}/tasks`)
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        title: 'Assigned Task',
        dueDate: '2026-11-01',
        assignee: emp1Res.body.user.id,
      });
    task = taskRes.body.task;
  });

  test('employee can only update their own tasks', async () => {
    // Employee 2 should not be able to update Employee 1's task
    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${emp2Token}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('assigned to you');
  });

  test('employee cannot change task priority', async () => {
    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${emp1Token}`)
      .send({ priority: 'critical' });

    expect(res.status).toBe(403);
  });

  test('employee cannot reassign tasks', async () => {
    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${emp1Token}`)
      .send({ assignee: new mongoose.Types.ObjectId().toString() });

    expect(res.status).toBe(403);
  });

  test('project deadline must be after start date', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${mgrToken}`)
      .send({
        name: 'Bad Dates Project',
        startDate: '2026-12-31',
        deadline: '2026-01-01',
      });

    expect(res.status).toBe(400);
  });
});
