// Test setup file for IremboCare+ application

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 0; // Use random port for tests
process.env.RAPIDAPI_KEY = 'test-api-key';

// Global test timeout
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to create test user data
  createTestUser: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    ...overrides
  }),

  // Helper to create test telemedicine request
  createTestTelemedicineRequest: (overrides = {}) => ({
    patientName: 'John Doe',
    district: 'Bugesera',
    symptoms: 'Headache and fever',
    hospitalName: 'Nyamata District Hospital',
    contactMethod: 'phone',
    urgency: 'normal',
    ...overrides
  }),

  // Helper to create test AI doctor request
  createTestAIDoctorRequest: (overrides = {}) => ({
    message: 'I have a headache',
    specialization: 'general',
    language: 'en',
    ...overrides
  }),

  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to generate random email
  randomEmail: () => `test-${Date.now()}@example.com`,

  // Helper to generate random string
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
}); 