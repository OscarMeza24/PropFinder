const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../server.js');
const { pool } = require('../config/database.js');

describe('Auth Endpoints', () => {
  let testUser;

  beforeAll(async () => {
    // Limpiar base de datos de test
    await pool.query('DELETE FROM users WHERE email LIKE $1', [
      'test%@example.com',
    ]);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123',
        name: 'Test User',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.role).toBe(userData.role);
      expect(response.body.user).not.toHaveProperty('password');

      testUser = response.body.user;
    });

    it('should not register user with existing email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123',
        name: 'Test User 2',
        role: 'user',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPassword123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate password strength', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'weak',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'TestPassword123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(credentials.email);
    });

    it('should not login with invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'TestPassword123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should not login with invalid password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/profile', () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123',
      });

      authToken = loginResponse.body.token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should not get profile without token', async () => {
      const response = await request(app).get('/api/auth/profile').expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/auth/profile', () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'TestPassword123',
      });

      authToken = loginResponse.body.token;
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Test User',
        phone: '+1234567890',
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.name).toBe(updateData.name);
      expect(response.body.user.phone).toBe(updateData.phone);
    });

    it('should not update profile without token', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
