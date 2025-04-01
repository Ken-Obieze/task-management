import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';
import User from '../../src/models/user.model';
import { hashPassword } from '../../src/utils/password.utils';

describe('Auth Routes', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user', async () => {
      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });

    it('should not register a user with an existing email', async () => {
      // Create a user first
      await User.create({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'test1@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'James',
          lastName: 'Doe',
          email: 'test1@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
    });
  });

  // describe('POST /api/auth/login', () => {
  //   beforeEach(async () => {
  //     await User.create({
  //       email: 'login1@example.com',
  //       password: 'password123',
  //       firstName: 'Jane',
  //       lastName: 'Doe',
  //     });
  //   });

  //   it('should authenticate a user', async () => {
  //     const res = await request(app).post('/api/auth/login').send({
  //       email: 'login1@example.com',
  //       password: 'password123'
  //     });
  //     expect(res.status).toBe(200);
  //     expect(res.body).toHaveProperty('token');
  //     expect(res.body.data.user.id).toHaveProperty('id');
  //     expect(res.body.data.user.email).toBe('test@example.com');
  //   });
  // });

  // describe('POST /api/auth/login', () => {
  //   it('should login a user', async () => {
  //     // Create a user first
  //     await User.create({
  //       firstName: 'Jane',
  //       lastName: 'Doe',
  //       email: 'test@example.com',
  //       password: 'password123'
  //     });

  //     const res = await request(app)
  //       .post('/api/auth/login')
  //       .send({
  //         email: 'test@example.com',
  //         password: 'password123'
  //       });
      
  //     expect(res.status).toBe(200);
  //     expect(res.body.data).toHaveProperty('token');
  //     expect(res.body.data.user).toHaveProperty('id');
  //     expect(res.body.data.user.email).toBe('test@example.com');
  //   });

  //   it('should not login with invalid credentials', async () => {
  //     // Create a user first
  //     await User.create({
  //       firstName: 'Jane',
  //       lastName: 'Doe',
  //       email: 'test@example.com',
  //       password: 'password123'
  //     });

  //     const res = await request(app)
  //       .post('/api/auth/login')
  //       .send({
  //         email: 'test@example.com',
  //         password: 'wrongpassword'
  //       });
      
  //     expect(res.status).toBe(401);
  //   });
  // });
});
