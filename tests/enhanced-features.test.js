const request = require('supertest');
const app = require('../src/app');

describe('Enhanced IremboCare+ Features', () => {
  let server;

  beforeAll((done) => {
    server = app.listen(0, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Weather Health API', () => {
    test('GET /api/weather-health-tips should return weather-based health recommendations', async () => {
      const response = await request(app)
        .get('/api/weather-health-tips')
        .query({ location: 'Kigali' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('weather');
      expect(response.body.data).toHaveProperty('healthRecommendations');
      expect(response.body.data.weather).toHaveProperty('location');
      expect(response.body.data.weather).toHaveProperty('temperature');
      expect(Array.isArray(response.body.data.healthRecommendations)).toBe(true);
    });

    test('GET /api/weather-health-tips with invalid location should still return data', async () => {
      const response = await request(app)
        .get('/api/weather-health-tips')
        .query({ location: 'InvalidLocation' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    test('GET /api/weather-health-tips without location should use default', async () => {
      const response = await request(app)
        .get('/api/weather-health-tips');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('location');
    });
  });

  describe('Health News API', () => {
    test('GET /api/health-news should return health news', async () => {
      const response = await request(app)
        .get('/api/health-news');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('count');
      
      if (response.body.data.length > 0) {
        const article = response.body.data[0];
        expect(article).toHaveProperty('id');
        expect(article).toHaveProperty('title');
        expect(article).toHaveProperty('description');
        expect(article).toHaveProperty('source');
        expect(article).toHaveProperty('healthCategory');
      }
    });

    test('GET /api/health-news with parameters should filter results', async () => {
      const response = await request(app)
        .get('/api/health-news')
        .query({ 
          country: 'rw',
          pageSize: 5,
          language: 'en'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });

    test('GET /api/health-news/category/:category should return categorized news', async () => {
      const response = await request(app)
        .get('/api/health-news/category/malaria');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('category', 'malaria');
    });

    test('GET /api/health-news/trending should return trending topics', async () => {
      const response = await request(app)
        .get('/api/health-news/trending');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Enhanced Health Services API', () => {
    test('GET /api/health-services/search should return filtered results', async () => {
      const response = await request(app)
        .get('/api/health-services/search')
        .query({ 
          location: 'Bugesera',
          telemedicine: 'true',
          sort: 'name'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('filters');
      expect(response.body.filters).toHaveProperty('telemedicine', 'true');
      expect(response.body.filters).toHaveProperty('sort', 'name');
      
      if (response.body.data.length > 0) {
        const hospital = response.body.data[0];
        expect(hospital).toHaveProperty('name');
        expect(hospital).toHaveProperty('type');
        expect(hospital).toHaveProperty('telemedicine');
        expect(hospital).toHaveProperty('specialties');
        expect(hospital.telemedicine).toBe(true);
      }
    });

    test('GET /api/health-services/search without location should return 400', async () => {
      const response = await request(app)
        .get('/api/health-services/search');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/health-services/search with specialty filter', async () => {
      const response = await request(app)
        .get('/api/health-services/search')
        .query({ 
          location: 'Bugesera',
          specialty: 'emergency'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.filters).toHaveProperty('specialty', 'emergency');
    });

    test('GET /api/health-services/search with type filter', async () => {
      const response = await request(app)
        .get('/api/health-services/search')
        .query({ 
          location: 'Bugesera',
          type: 'Public'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.filters).toHaveProperty('type', 'Public');
    });
  });

  describe('Enhanced Medication API', () => {
    test('GET /api/medication/search should return enhanced medication data', async () => {
      const response = await request(app)
        .get('/api/medication/search')
        .query({ 
          symptoms: 'headache,fever',
          sort: 'effectiveness'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('query');
      expect(response.body.query).toHaveProperty('symptoms', 'headache,fever');
      expect(response.body.query).toHaveProperty('sort', 'effectiveness');
      
      if (response.body.data.length > 0) {
        const medication = response.body.data[0];
        expect(medication).toHaveProperty('openfda');
        expect(medication).toHaveProperty('dosage');
        expect(medication).toHaveProperty('type');
        expect(medication).toHaveProperty('effectiveness');
      }
    });

    test('GET /api/medication/search with type filter', async () => {
      const response = await request(app)
        .get('/api/medication/search')
        .query({ 
          disease: 'malaria',
          type: 'brand',
          sort: 'name'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.query).toHaveProperty('type', 'brand');
      expect(response.body.query).toHaveProperty('sort', 'name');
    });

    test('GET /api/medication/search with limit', async () => {
      const response = await request(app)
        .get('/api/medication/search')
        .query({ 
          disease: 'fever',
          limit: 3
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
      expect(response.body.query).toHaveProperty('limit', 3);
    });
  });

  describe('Enhanced System Health Endpoints', () => {
    test('GET /health should return enhanced health information', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'IremboCare+');
      expect(response.body).toHaveProperty('version', '1.3.0');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /ready should return readiness status', async () => {
      const response = await request(app).get('/ready');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('service', 'IremboCare+');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /metrics should return basic metrics', async () => {
      const response = await request(app).get('/metrics');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    test('Invalid API endpoint should return 404', async () => {
      const response = await request(app).get('/api/nonexistent');
      expect(response.status).toBe(404);
    });

    test('Weather API error should return fallback data', async () => {
      // This test assumes the weather API might fail
      const response = await request(app)
        .get('/api/weather-health-tips')
        .query({ location: 'TestLocation' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      // Should return mock data if API fails
    });

    test('News API error should return fallback data', async () => {
      // This test assumes the news API might fail
      const response = await request(app).get('/api/health-news');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      // Should return mock data if API fails
    });
  });

  describe('Data Validation', () => {
    test('Health services search with invalid parameters should handle gracefully', async () => {
      const response = await request(app)
        .get('/api/health-services/search')
        .query({ 
          location: 'Bugesera',
          telemedicine: 'invalid_boolean',
          sort: 'invalid_sort'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('Medication search with invalid limit should handle gracefully', async () => {
      const response = await request(app)
        .get('/api/medication/search')
        .query({ 
          disease: 'malaria',
          limit: 'invalid_number'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Integration Tests', () => {
    test('Complete user journey - search hospitals, get weather tips, read news', async () => {
      // Search for hospitals
      const hospitalsResponse = await request(app)
        .get('/api/health-services/search')
        .query({ 
          location: 'Bugesera',
          telemedicine: 'true'
        });

      expect(hospitalsResponse.status).toBe(200);
      expect(hospitalsResponse.body.success).toBe(true);

      // Get weather health tips
      const weatherResponse = await request(app)
        .get('/api/weather-health-tips')
        .query({ location: 'Bugesera' });

      expect(weatherResponse.status).toBe(200);
      expect(weatherResponse.body.success).toBe(true);

      // Get health news
      const newsResponse = await request(app)
        .get('/api/health-news')
        .query({ pageSize: 5 });

      expect(newsResponse.status).toBe(200);
      expect(newsResponse.body.success).toBe(true);

      // All requests should complete successfully
      expect([hospitalsResponse, weatherResponse, newsResponse].every(r => r.body.success)).toBe(true);
    });

    test('API response times should be reasonable', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/health-services/search')
        .query({ location: 'Bugesera' });

      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });

  describe('Backward Compatibility', () => {
    test('Original health services endpoint should still work', async () => {
      const response = await request(app)
        .get('/api/health-services')
        .query({ location: 'Bugesera' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Original medication endpoint should still work', async () => {
      const response = await request(app)
        .get('/api/medication')
        .query({ disease: 'malaria' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Original first-aid endpoint should still work', async () => {
      const response = await request(app)
        .get('/api/first-aid')
        .query({ condition: 'Burns' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Original AI doctor endpoint should still work', async () => {
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
  });
});