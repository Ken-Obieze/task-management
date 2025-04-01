import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import User from '../../src/models/user.model';
import Task from '../../src/models/task.model';
import { UserRole } from '../../src/models/user.model';
import { TaskPriority, TaskStatus } from '../../src/models/task.model';

let mongoServer: MongoMemoryServer;
let userToken: string;
let adminToken: string;
let userId: string;
let adminId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  // Create test users
  const user = await User.create({
    firstName: 'User',
    lastName: 'Doe',
    email: 'user@example.com',
    password: 'password123',
    role: UserRole.USER
  });
  
  const admin = await User.create({
    firstName: 'Admin',
    lastName: 'Doe',
    email: 'admin@example.com',
    password: 'password123',
    role: UserRole.ADMIN
  });
  
  userId = user.id.toString();
  adminId = admin.id.toString();
  
  // Generate tokens
  userToken = jwt.sign(
    { id: userId, emial: user.email, role: user.role },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '24h' }
  );
  
  adminToken = jwt.sign(
    { id: adminId, emial: user.email, role: user.role  },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '24h' }
  );
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe('Task Routes', () => {
  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.PENDING,
          assignedTo: userId
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.title).toBe('Test Task');
      expect(res.body.data.description).toBe('This is a test task');
      expect(res.body.data.createdBy.toString()).toBe(userId);
    });

    it('should not create a task with invalid data', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // Missing required fields
          priority: TaskPriority.MEDIUM
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/tasks', () => {
    it('should get all tasks', async () => {
      // Create test tasks
      await Task.create([
        {
          title: 'Task 1',
          description: 'Description 1',
          priority: TaskPriority.LOW,
          status: TaskStatus.PENDING,
          dueDate: new Date(),
          assignedTo: userId,
          createdBy: userId
        },
        {
          title: 'Task 2',
          description: 'Description 2',
          priority: TaskPriority.HIGH,
          status: TaskStatus.IN_PROGRESS,
          dueDate: new Date(),
          assignedTo: adminId,
          createdBy: userId
        }
      ]);

      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(2);
      expect(res.body.data.total).toBe(2);
    });

    it('should filter tasks', async () => {
      // Create test tasks
      await Task.create([
        {
          title: 'Low Priority Task',
          description: 'Description 1',
          priority: TaskPriority.LOW,
          status: TaskStatus.PENDING,
          dueDate: new Date(),
          assignedTo: userId,
          createdBy: userId
        },
        {
          title: 'High Priority Task',
          description: 'Description 2',
          priority: TaskPriority.HIGH,
          status: TaskStatus.IN_PROGRESS,
          dueDate: new Date(),
          assignedTo: adminId,
          createdBy: userId
        }
      ]);

      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].priority).toBe(TaskPriority.HIGH);
    });
  });

  describe('GET /api/tasks/:id', () => {
    it('should get a task by id', async () => {
      // Create a test task
      const task = await Task.create({
        title: 'Test Task',
        description: 'Task description',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date(),
        assignedTo: userId,
        createdBy: userId
      });

      const res = await request(app)
        .get(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data._id).toBe(task.id.toString());
      expect(res.body.data.title).toBe('Test Task');
    });

    it('should return 401 for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      // Create a test task
      const task = await Task.create({
        title: 'Original Title',
        description: 'Original description',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date(),
        assignedTo: userId,
        createdBy: userId
      });

      const res = await request(app)
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
          status: TaskStatus.IN_PROGRESS
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
      expect(res.body.data.status).toBe(TaskStatus.IN_PROGRESS);
      expect(res.body.data.description).toBe('Original description'); // Unchanged
    });

    it('should restrict updates to task owner or admin', async () => {
      // Create a task owned by admin
      const task = await Task.create({
        title: 'Admin Task',
        description: 'Admin description',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date(),
        assignedTo: adminId,
        createdBy: adminId
      });

      // Try to update as regular user
      const res = await request(app)
        .put(`/api/tasks/${task._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Attempted Update'
        });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      // Create a test task
      const task = await Task.create({
        title: 'Task to Delete',
        description: 'Will be deleted',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date(),
        assignedTo: userId,
        createdBy: userId
      });

      const res = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify task is deleted
      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });

    it('should restrict deletion to task owner or admin', async () => {
      // Create a task owned by admin
      const task = await Task.create({
        title: 'Admin Task',
        description: 'Admin description',
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date(),
        assignedTo: adminId,
        createdBy: adminId
      });

      // Try to delete as regular user
      const res = await request(app)
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(401);
      
      // Verify task still exists
      const existingTask = await Task.findById(task.id);
      expect(existingTask).not.toBeNull();
    });
  });
});
