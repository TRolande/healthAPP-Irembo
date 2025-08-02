const request = require('supertest');
const express = require('express');

// Import the app
const app = require('../src/app');

describe('IremboCare+ API Tests', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Health Check', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Health Services API', () => {
    test('GET /api/health-services with valid location should return services', async () => {
      const response = await request(app)
        .get('/api/health-services')
        .query({ location: 'Bugesera' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/health-services without location should return 400', async () => {
      const response = await request(app).get('/api/health-services');
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Medication API', () => {
    test('GET /api/medication with valid disease should return medications', async () => {
      const response = await request(app)
        .get('/api/medication')
        .query({ disease: 'malaria' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/medication without disease should return all medications', async () => {
      const response = await request(app).get('/api/medication');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('First-Aid API', () => {
    test('GET /api/first-aid with valid condition should return tips', async () => {
      const response = await request(app)
        .get('/api/first-aid')
        .query({ condition: 'Burns' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('GET /api/first-aid without condition should return all tips', async () => {
      const response = await request(app).get('/api/first-aid');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('AI Doctor API', () => {
    test('POST /api/ai-doctor with valid data should return response', async () => {
      const response = await request(app)
        .post('/api/ai-doctor')
        .send({
          message: 'I have a headache',
          specialization: 'general',
          language: 'en'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('POST /api/ai-doctor without message should return 400', async () => {
      const response = await request(app)
        .post('/api/ai-doctor')
        .send({
          specialization: 'general',
          language: 'en'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('User Registration API', () => {
    test('POST /api/register with valid data should create user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const response = await request(app)
        .post('/api/register')
        .send(userData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', userData.email);
    });

    test('POST /api/register with missing required fields should return 400', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          email: 'test@example.com',
          firstName: 'John'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Telemedicine Request API', () => {
    test('POST /api/telemedicine-request with valid data should create request', async () => {
      const requestData = {
        patientName: 'John Doe',
        district: 'Bugesera',
        symptoms: 'Headache and fever',
        hospitalName: 'Nyamata District Hospital',
        contactMethod: 'phone',
        urgency: 'normal'
      };

      const response = await request(app)
        .post('/api/telemedicine-request')
        .send(requestData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('patientName', requestData.patientName);
    });
  });

  describe('Static File Serving', () => {
    test('GET / should serve main page', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('GET /styles.css should serve CSS file', async () => {
      const response = await request(app).get('/styles.css');
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/css/);
    });
  });
});