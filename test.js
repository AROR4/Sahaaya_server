// Unmock the database for integration tests BEFORE requiring app
jest.unmock('./db');

// Set test database URL before requiring app (which will connect to db)
const TEST_MONGO_URL = process.env.TEST_MONGO_URL || 
  (process.env.MONGO_URL ? process.env.MONGO_URL.replace(/\/[^/]+$/, '/sahaaya_test') : 'mongodb://localhost:27017/sahaaya_test');

// Override MONGO_URL for test database
process.env.MONGO_URL = TEST_MONGO_URL;

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app');
const User = require('./models/user');

// Test user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123!',
};

let authToken = null;
let createdUserId = null;

// Setup: Connect to test database before all tests
beforeAll(async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URL);
      console.log('Connected to test database');
    } else if (mongoose.connection.readyState === 1) {
      console.log('Already connected to test database');
    }
  } catch (error) {
    console.error('Test database connection error:', error);
    throw error;
  }
});

// Cleanup: Clear test data after each test
afterEach(async () => {
  try {
    await User.deleteMany({ 
      email: { 
        $in: [
          testUser.email, 
          'test2@example.com', 
          'test3@example.com',
          'google@example.com',
          'nonexistent@example.com'
        ] 
      } 
    });
    authToken = null;
    createdUserId = null;
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// Teardown: Close database connection after all tests
afterAll(async () => {
  try {
    await mongoose.connection.close();
    console.log('Test database connection closed');
  } catch (error) {
    console.error('Error closing test database:', error);
  }
});

describe('Authentication Integration Tests', () => {
  
  describe('POST /api/local/signup', () => {
    it('should create a new user with email and password', async () => {
      const res = await request(app)
        .post('/api/local/signup')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Account created successfully');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
      // Should not return token (user needs to sign in)
      expect(res.body.user).not.toHaveProperty('token');
    });

    it('should return 400 if email already exists', async () => {
      // Create user first
      await request(app)
        .post('/api/local/signup')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        });

      // Try to create again
      const res = await request(app)
        .post('/api/local/signup')
        .send({
          name: 'Another User',
          email: testUser.email,
          password: 'DifferentPassword123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('already registered');
    });

    it('should return 400 if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/local/signup')
        .send({
          name: testUser.name,
          // Missing email and password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('required');
    });
  });

  describe('POST /api/local/login', () => {
    beforeEach(async () => {
      // Create a user before each login test
      await request(app)
        .post('/api/local/signup')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        });
    });

    it('should login with correct credentials and return token', async () => {
      const res = await request(app)
        .post('/api/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
      
      // Save token for other tests
      authToken = res.body.user.token;
      createdUserId = res.body.user._id;
    });

    it('should return 404 if user does not exist', async () => {
      const res = await request(app)
        .post('/api/local/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Account not found');
      expect(res.body.message).toContain('sign up first');
    });

    it('should return 401 if password is incorrect', async () => {
      const res = await request(app)
        .post('/api/local/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Incorrect password');
    });

    it('should return 400 if email or password is missing', async () => {
      const res = await request(app)
        .post('/api/local/login')
        .send({
          email: testUser.email,
          // Missing password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('required');
    });
  });

  describe('GET /api/validate-token', () => {
    beforeEach(async () => {
      // Create user and get token
      await request(app)
        .post('/api/local/signup')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        });

      const loginRes = await request(app)
        .post('/api/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      authToken = loginRes.body.user.token;
    });

    it('should return valid=true and user data for valid token', async () => {
      const res = await request(app)
        .get('/api/validate-token')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('valid', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.name).toBe(testUser.name);
    });

    it('should return 401 for invalid token', async () => {
      const res = await request(app)
        .get('/api/validate-token')
        .set('Authorization', 'Bearer invalid-token-here');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('valid', false);
      expect(res.body.message).toContain('Invalid or expired token');
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .get('/api/validate-token');

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('valid', false);
      expect(res.body.message).toContain('No token');
    });
  });

  describe('Protected Routes with Authentication', () => {
    beforeEach(async () => {
      // Create user and get token
      await request(app)
        .post('/api/local/signup')
        .send({
          name: testUser.name,
          email: testUser.email,
          password: testUser.password,
        });

      const loginRes = await request(app)
        .post('/api/local/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      authToken = loginRes.body.user.token;
    });

    it('should access protected route with valid token', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      // Should not return 401 (unauthorized)
      expect(res.statusCode).not.toBe(401);
    });

    it('should return 401 for protected route without token', async () => {
      const res = await request(app)
        .get('/api/user/profile');

      expect(res.statusCode).toBe(401);
    });

    it('should return 401 for protected route with invalid token', async () => {
      const res = await request(app)
        .get('/api/user/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('User Registration Edge Cases', () => {
    it('should handle user with Google auth trying to sign up with local auth', async () => {
      // First create a Google user (simulated)
      const googleUser = new User({
        name: 'Google User',
        email: 'google@example.com',
        authProvider: 'google',
      });
      await googleUser.save();

      // Try to sign up with same email using local auth
      const res = await request(app)
        .post('/api/local/signup')
        .send({
          name: 'Local User',
          email: 'google@example.com',
          password: 'Password123!',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Google');
      expect(res.body.message).toContain('Google sign in');

      // Cleanup
      await User.deleteOne({ email: 'google@example.com' });
    });
  });
});
