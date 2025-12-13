// Unmock the database for integration tests BEFORE requiring app
jest.unmock('../db');

// Set test database URL before requiring app (which will connect to db)
const TEST_MONGO_URL = process.env.TEST_MONGO_URL || 
  (process.env.MONGO_URL ? process.env.MONGO_URL.replace(/\/[^/]+$/, '/sahaaya_regression_test') : 'mongodb://localhost:27017/sahaaya_regression_test');

// Override MONGO_URL for test database
process.env.MONGO_URL = TEST_MONGO_URL;

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../models/user');
const Campaign = require('../models/Campaign');

// Test user data
const testUser = {
  name: 'Regression Test User',
  email: 'regression@test.com',
  password: 'TestPassword123!',
};

let authToken = null;
let createdUserId = null;
let createdCampaignId = null;

// Setup: Connect to test database before all tests
beforeAll(async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URL);
      console.log('Connected to regression test database');
    } else if (mongoose.connection.readyState === 1) {
      console.log('Already connected to regression test database');
    }
  } catch (error) {
    console.error('Regression test database connection error:', error);
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
          'regression2@test.com',
          'regression3@test.com'
        ] 
      } 
    });
    await Campaign.deleteMany({ 
      title: { 
        $in: [
          'Regression Test Campaign',
          'Test Campaign for Donation',
          'Test Campaign for Join'
        ] 
      } 
    });
    authToken = null;
    createdUserId = null;
    createdCampaignId = null;
  } catch (error) {
    console.error('Cleanup error:', error);
  }
});

// Teardown: Close database connection after all tests
afterAll(async () => {
  try {
    await mongoose.connection.close();
    console.log('Regression test database connection closed');
  } catch (error) {
    console.error('Error closing regression test database:', error);
  }
});

describe('🔴 REGRESSION TEST SUITE - Core Functionalities', () => {
  
  describe('1️⃣ User Authentication (Login)', () => {
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

    it('✅ should login with correct credentials and return token', async () => {
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

    it('✅ should return 404 if user does not exist', async () => {
      const res = await request(app)
        .post('/api/local/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'SomePassword123!',
        });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Account not found');
    });

    it('✅ should return 401 if password is incorrect', async () => {
      const res = await request(app)
        .post('/api/local/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('Incorrect password');
    });

    it('✅ should return 400 if email or password is missing', async () => {
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

  describe('2️⃣ Create Campaign', () => {
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
      createdUserId = loginRes.body.user._id;
    });

    it('✅ should create a new campaign with valid data', async () => {
      const campaignData = {
        title: 'Regression Test Campaign',
        description: 'This is a test campaign for regression testing',
        about: 'Detailed information about the campaign',
        category: 'Education',
        location: 'Test City',
        date: new Date().toISOString(),
        image_url: 'https://example.com/image.jpg',
        estimatedBudget: 10000,
        targetParticipants: 50,
        contact: {
          email: 'test@example.com',
          phone: '1234567890'
        },
        documents: [],
        isNgoAffiliated: false
      };

      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(campaignData);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('title', campaignData.title);
      expect(res.body).toHaveProperty('description', campaignData.description);
      expect(res.body).toHaveProperty('creator');
      expect(res.body.creator.toString()).toBe(createdUserId);
      expect(res.body).toHaveProperty('status', 'pending');
      
      createdCampaignId = res.body._id;
    });

    it('✅ should return 401 if not authenticated', async () => {
      const campaignData = {
        title: 'Test Campaign',
        description: 'Test description',
        about: 'Test about',
        category: 'Education',
        location: 'Test City',
        date: new Date().toISOString(),
        estimatedBudget: 10000,
        targetParticipants: 50
      };

      const res = await request(app)
        .post('/api/campaigns')
        .send(campaignData);

      expect(res.statusCode).toBe(401);
    });

    it('✅ should return 500 if required fields are missing', async () => {
      const incompleteData = {
        title: 'Incomplete Campaign',
        // Missing required fields
      };

      const res = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData);

      // Should fail validation
      expect(res.statusCode).toBe(500);
    });
  });

  describe('3️⃣ Donate to Campaign', () => {
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
      createdUserId = loginRes.body.user._id;

      // Create a campaign and approve it
      const campaignData = {
        title: 'Test Campaign for Donation',
        description: 'Campaign for donation testing',
        about: 'Test about',
        category: 'Healthcare',
        location: 'Test City',
        date: new Date().toISOString(),
        estimatedBudget: 5000,
        targetParticipants: 20,
        contact: {
          email: 'test@example.com',
          phone: '1234567890'
        }
      };

      const campaignRes = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(campaignData);

      createdCampaignId = campaignRes.body._id;

      // Approve the campaign (simulate admin approval)
      await Campaign.findByIdAndUpdate(createdCampaignId, { status: 'approved' });
    });

    it('✅ should allow donation to approved campaign', async () => {
      const donationData = {
        amount: 100,
        upiId: 'test@upi'
      };

      const res = await request(app)
        .post(`/api/campaigns/${createdCampaignId}/donate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(donationData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Donation recorded');
      expect(res.body).toHaveProperty('donation');
      expect(res.body.donation.amount).toBe(100);
      expect(res.body.donation.status).toBe('pending');
    });

    it('✅ should return 400 for invalid donation amount', async () => {
      const donationData = {
        amount: -10, // Invalid amount
        upiId: 'test@upi'
      };

      const res = await request(app)
        .post(`/api/campaigns/${createdCampaignId}/donate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(donationData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Invalid donation amount');
    });

    it('✅ should return 401 if not authenticated', async () => {
      const donationData = {
        amount: 100,
        upiId: 'test@upi'
      };

      const res = await request(app)
        .post(`/api/campaigns/${createdCampaignId}/donate`)
        .send(donationData);

      expect(res.statusCode).toBe(401);
    });

    it('✅ should return 404 for non-existent campaign', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const donationData = {
        amount: 100,
        upiId: 'test@upi'
      };

      const res = await request(app)
        .post(`/api/campaigns/${fakeId}/donate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(donationData);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Campaign not found');
    });

    it('✅ should return 403 for pending campaign (not approved)', async () => {
      // Create a pending campaign
      const pendingCampaign = await Campaign.create({
        title: 'Pending Campaign',
        description: 'Test',
        about: 'Test',
        category: 'Education',
        location: 'Test',
        date: new Date(),
        estimatedBudget: 1000,
        targetParticipants: 10,
        creator: createdUserId,
        status: 'pending'
      });

      const donationData = {
        amount: 100,
        upiId: 'test@upi'
      };

      const res = await request(app)
        .post(`/api/campaigns/${pendingCampaign._id}/donate`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(donationData);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('approved campaigns');

      // Cleanup
      await Campaign.findByIdAndDelete(pendingCampaign._id);
    });
  });

  describe('4️⃣ Join Campaign', () => {
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
      createdUserId = loginRes.body.user._id;

      // Create and approve a campaign
      const campaignData = {
        title: 'Test Campaign for Join',
        description: 'Campaign for join testing',
        about: 'Test about',
        category: 'Environment',
        location: 'Test City',
        date: new Date().toISOString(),
        estimatedBudget: 3000,
        targetParticipants: 30,
        contact: {
          email: 'test@example.com',
          phone: '1234567890'
        }
      };

      const campaignRes = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(campaignData);

      createdCampaignId = campaignRes.body._id;

      // Approve the campaign
      await Campaign.findByIdAndUpdate(createdCampaignId, { status: 'approved' });
    });

    it('✅ should allow user to join approved campaign', async () => {
      const res = await request(app)
        .post(`/api/campaigns/${createdCampaignId}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Successfully joined');
      expect(res.body).toHaveProperty('updatedScore');
    });

    it('✅ should return 400 if already joined', async () => {
      // Join once
      await request(app)
        .post(`/api/campaigns/${createdCampaignId}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      // Try to join again
      const res = await request(app)
        .post(`/api/campaigns/${createdCampaignId}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Already joined');
    });

    it('✅ should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post(`/api/campaigns/${createdCampaignId}/join`);

      expect(res.statusCode).toBe(401);
    });

    it('✅ should return 404 for non-existent campaign', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/campaigns/${fakeId}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Campaign not found');
    });

    it('✅ should return 403 for pending campaign (not approved)', async () => {
      // Create a pending campaign
      const pendingCampaign = await Campaign.create({
        title: 'Pending Campaign for Join',
        description: 'Test',
        about: 'Test',
        category: 'Education',
        location: 'Test',
        date: new Date(),
        estimatedBudget: 1000,
        targetParticipants: 10,
        creator: createdUserId,
        status: 'pending'
      });

      const res = await request(app)
        .post(`/api/campaigns/${pendingCampaign._id}/join`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('approved campaigns');

      // Cleanup
      await Campaign.findByIdAndDelete(pendingCampaign._id);
    });
  });

  describe('5️⃣ Get Campaigns', () => {
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
      createdUserId = loginRes.body.user._id;

      // Create a campaign
      const campaignData = {
        title: 'Test Campaign for Get',
        description: 'Campaign for get testing',
        about: 'Test about',
        category: 'Animal Welfare',
        location: 'Test City',
        date: new Date().toISOString(),
        estimatedBudget: 2000,
        targetParticipants: 15,
        contact: {
          email: 'test@example.com',
          phone: '1234567890'
        }
      };

      const campaignRes = await request(app)
        .post('/api/campaigns')
        .set('Authorization', `Bearer ${authToken}`)
        .send(campaignData);

      createdCampaignId = campaignRes.body._id;
    });

    it('✅ should get all campaigns (public route)', async () => {
      const res = await request(app)
        .get('/api/campaigns');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('✅ should get a single campaign by ID', async () => {
      const res = await request(app)
        .get(`/api/campaigns/${createdCampaignId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('_id', createdCampaignId);
      expect(res.body).toHaveProperty('title');
      expect(res.body).toHaveProperty('description');
    });

    it('✅ should return 404 for non-existent campaign', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/campaigns/${fakeId}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toContain('Campaign not found');
    });
  });
});

